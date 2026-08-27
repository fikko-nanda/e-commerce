/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

export const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Permitted empty catch
  }
}

function getAuthToken() {
  let token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (!token) {
    try {
      const u = JSON.parse(localStorage.getItem('warmart_user') || '{}');
      token = u.access || u.token || u.access_token;
    } catch {
      // Permitted empty catch
    }
  }
  return token || null;
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('warmart_user') || '{}');
  } catch {
    return {};
  }
}

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSeller, setActiveSeller] = useState(null);   // nama toko (buyer view)
  const [activeCustomer, setActiveCustomer] = useState(null); // email customer (seller view)
  const [receiverId, setReceiverId] = useState(null);       // UUID lawan bicara
  const [wsUrl, setWsUrl] = useState(null);
  const socketRef = useRef(null);

  const [conversations, setConversations] = useState(() => loadLS('warmart_conversations', {}));
  const [customerChats, setCustomerChats] = useState(() => loadLS('warmart_customer_chats', {}));
  const [unread, setUnread] = useState(() => loadLS('warmart_chat_unread', {}));

  useEffect(() => { saveLS('warmart_conversations', conversations); }, [conversations]);
  useEffect(() => { saveLS('warmart_customer_chats', customerChats); }, [customerChats]);
  useEffect(() => { saveLS('warmart_chat_unread', unread); }, [unread]);

  const markRead = useCallback((key) => {
    if (!key) return;
    setUnread((prev) => {
      if (!prev || prev[key] === undefined || prev[key] === 0) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // 1. Deteksi Store: HANYA panggil jika token valid tersedia
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_BASE}/stores/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then((d) => {
        const name = d?.store?.store_name;
        if (name) localStorage.setItem('myStoreName', name);
        else localStorage.removeItem('myStoreName');
      })
      .catch(() => {
        // Abaikan error jika token kadaluarsa/unauthorized
      });
  }, []);

  // 2. Muat riwayat chat: HANYA panggil jika token valid tersedia
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_BASE}/chats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (!Array.isArray(list) || list.length === 0) return;

        const u = getCurrentUser();
        const meId = String(u.id || '');
        const meEmail = String(u.email || '');
        const myStore = localStorage.getItem('myStoreName');

        const convs = {};
        const custs = {};

        list.forEach((c) => {
          const mine = String(c.sender) === meId || c.sender_email === meEmail;
          const otherEmail = mine ? c.receiver_email : c.sender_email;
          const otherId = mine ? c.receiver : c.sender;
          const time = new Date(c.timestamp || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          if (myStore) {
            const key = otherEmail || `Customer ${String(otherId || '').slice(0, 8)}`;
            if (!custs[key]) custs[key] = [];
            custs[key].push({
              id: c.id || Date.now(),
              sender: mine ? 'seller' : 'user',
              text: c.message,
              time,
              sender_id: c.sender,
              sender_email: c.sender_email,
            });
          } else {
            const key = otherEmail || 'Toko';
            if (!convs[key]) convs[key] = [];
            convs[key].push({
              id: c.id || Date.now(),
              sender: mine ? 'user' : 'seller',
              text: c.message,
              time,
              sender_id: c.sender,
            });
          }
        });

        if (Object.keys(custs).length) setCustomerChats((prev) => ({ ...custs, ...prev }));
        if (Object.keys(convs).length) setConversations((prev) => ({ ...convs, ...prev }));
      })
      .catch(() => {
        // Abaikan error jika token kadaluarsa/unauthorized
      });
  }, [activeSeller]);

  // Buyer membuka chat dengan toko tertentu
  const openChatWithSeller = useCallback(async (sellerName, productInfo = null) => {
    if (!sellerName) return;
    setActiveCustomer(null);
    setActiveSeller(sellerName);
    markRead(sellerName);
    setIsOpen(true);

    if (productInfo?.name) {
      const productText = `Halo ${sellerName}, apakah produk "${productInfo.name}" masih ready stok?`;
      setConversations((prev) => {
        const currentMsgs = prev[sellerName] || [];
        if (currentMsgs.some((m) => m.text === productText)) return prev;
        return {
          ...prev,
          [sellerName]: [...currentMsgs, { id: `msg-prod-${Date.now()}`, sender: 'user', text: productText, time: 'Baru saja' }],
        };
      });
    }

    const token = getAuthToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const storeRes = await fetch(`${API_BASE}/stores/user-by-name/?store_name=${encodeURIComponent(sellerName)}`, { headers });
      if (!storeRes.ok) return;
      const storeData = await storeRes.json();
      const sellerUserId = storeData.user_id;
      if (!sellerUserId) return;

      setReceiverId(sellerUserId);

      const roomRes = await fetch(`${API_BASE}/chats/room-name/?user_id=${sellerUserId}`, { headers });
      if (!roomRes.ok) return;
      const roomData = await roomRes.json();
      if (roomData.ws_url) setWsUrl(roomData.ws_url);
    } catch {
      // Abaikan error jaringan
    }
  }, []);

  // Seller membuka thread customer tertentu
  const openCustomerChat = useCallback(async (customerKey) => {
    setActiveSeller(null);
    setActiveCustomer(customerKey);
    markRead(customerKey);
    setIsOpen(true);

    const custMsgs = customerChats[customerKey] || [];
    const custMsg = custMsgs.find((m) => m.sender !== 'seller' && m.sender_id);
    const customerId = custMsg?.sender_id;
    if (!customerId) return;

    setReceiverId(customerId);

    const token = getAuthToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const roomRes = await fetch(`${API_BASE}/chats/room-name/?user_id=${customerId}`, { headers });
      if (!roomRes.ok) return;
      const roomData = await roomRes.json();
      if (roomData.ws_url) setWsUrl(roomData.ws_url);
    } catch {
      // Abaikan error jaringan
    }
  }, [customerChats]);

  // Koneksi WebSocket
  useEffect(() => {
    if (!isOpen) {
      if (socketRef.current) {
        try { socketRef.current.close(); } catch { /* empty */ }
        socketRef.current = null;
      }
      if (window.chatSocket) delete window.chatSocket;
      return;
    }

    if (!wsUrl) return;

    const token = getAuthToken();
    const authedUrl = token ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : wsUrl;

    let ws;
    try {
      ws = new WebSocket(authedUrl);
    } catch {
      return;
    }
    socketRef.current = ws;
    window.chatSocket = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.message) return;

        const u = getCurrentUser();
        const meId = String(u.id || '');
        const meEmail = String(u.email || '');
        const isSelf = data.sender_id && (String(data.sender_id) === meId || String(data.sender_email || '') === meEmail);
        if (isSelf) return;

        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const myStore = localStorage.getItem('myStoreName');

        if (myStore) {
          const customerKey = data.sender_email || `Customer ${String(data.sender_id || '').slice(0, 8)}`;
          setCustomerChats((prev) => ({
            ...prev,
            [customerKey]: [
              ...(prev[customerKey] || []),
              {
                id: `msg-ws-${Date.now()}-${Math.random()}`,
                sender: 'user',
                text: data.message,
                time,
                sender_id: data.sender_id,
                sender_email: data.sender_email,
              },
            ],
          }));
          if (activeCustomer !== customerKey) {
            setUnread((prev) => ({ ...prev, [customerKey]: (prev[customerKey] || 0) + 1 }));
          }
        } else if (activeSeller) {
          setConversations((prev) => ({
            ...prev,
            [activeSeller]: [
              ...(prev[activeSeller] || []),
              { id: `msg-ws-${Date.now()}-${Math.random()}`, sender: 'seller', text: data.message, time },
            ],
          }));
        }
      } catch {
        // Safe parse
      }
    };

    ws.onerror = () => {};

    return () => {
      try { ws.close(); } catch { /* empty */ }
      if (window.chatSocket === ws) delete window.chatSocket;
      if (socketRef.current === ws) socketRef.current = null;
    };
  }, [wsUrl, isOpen, activeSeller, activeCustomer]);

  // Kirim pesan
  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;
    const trimmedText = text.trim();
    const targetSeller = activeSeller;
    const targetCustomer = activeCustomer;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (targetCustomer && !targetSeller) {
      setCustomerChats((prev) => ({
        ...prev,
        [targetCustomer]: [
          ...(prev[targetCustomer] || []),
          { id: `msg-seller-${Date.now()}`, sender: 'seller', text: trimmedText, time },
        ],
      }));
      markRead(targetCustomer);

      try {
        const ws = socketRef.current || window.chatSocket;
        const payload = { message: trimmedText, receiver_id: receiverId };
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
      } catch { /* empty */ }
      return;
    }

    if (targetSeller) {
      setConversations((prev) => ({
        ...prev,
        [targetSeller]: [
          ...(prev[targetSeller] || []),
          { id: `msg-user-${Date.now()}`, sender: 'user', text: trimmedText, time },
        ],
      }));
      markRead(targetSeller);

      try {
        const ws = socketRef.current || window.chatSocket;
        const payload = { message: trimmedText, receiver_id: receiverId };
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
      } catch { /* empty */ }
    }
  }, [activeSeller, activeCustomer, receiverId, markRead]);

  return (
    <ChatContext.Provider
      value={{
        isOpen, setIsOpen,
        activeSeller, setActiveSeller,
        activeCustomer, setActiveCustomer,
        conversations, customerChats, unread,
        openChatWithSeller, openCustomerChat,
        sendMessage, markRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}