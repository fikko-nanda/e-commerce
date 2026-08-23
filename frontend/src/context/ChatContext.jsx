/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

export const ChatContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

function slugifyRoom(name) {
  return String(name || 'seller')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40) || 'seller';
}

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

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  const [activeSeller, setActiveSeller] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const socketRef = useRef(null);

  const [conversations, setConversations] = useState(() => loadLS('warmart_conversations', {}));
  const [customerChats, setCustomerChats] = useState(() => loadLS('warmart_customer_chats', {}));

  useEffect(() => { saveLS('warmart_conversations', conversations); }, [conversations]);
  useEffect(() => { saveLS('warmart_customer_chats', customerChats); }, [customerChats]);

  // Fetch riwayat chat dari REST API backend
  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    fetch(`${API_BASE}/chats/`, { headers })
      .then((r) => r.json())
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (!Array.isArray(list) || list.length === 0) return;

        const u = getCurrentUser();
        const meId = String(u.id || '');
        const meEmail = String(u.email || '');

        const convs = {};
        const custs = {};

        list.forEach((c) => {
          const mine = String(c.sender) === meId || c.sender_email === meEmail;
          const otherEmail = mine ? c.receiver_email : c.sender_email;
          const otherId = mine ? c.receiver : c.sender;
          const time = new Date(c.timestamp || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          const storeTarget = mine ? (c.receiver_email || 'Toko') : (c.sender_email || 'Toko');

          if (mine) {
            const key = activeSeller || storeTarget;
            if (!convs[key]) convs[key] = [];
            convs[key].push({ id: c.id || Date.now(), sender: 'user', text: c.message, time });
          } else {
            const key = otherEmail || `Customer ${String(otherId || '').slice(0, 8)}`;
            if (!custs[key]) custs[key] = [];
            custs[key].push({ id: c.id || Date.now(), sender: 'seller', text: c.message, time });
          }
        });

        if (Object.keys(convs).length) setConversations((prev) => ({ ...convs, ...prev }));
        if (Object.keys(custs).length) setCustomerChats((prev) => ({ ...custs, ...prev }));
      })
      .catch(() => {});
  }, [activeSeller]);

  const openChatWithSeller = useCallback((sellerName, productInfo = null) => {
    if (!sellerName) return;
    localStorage.setItem('activeSellerId', sellerName);
    setActiveSeller(sellerName);
    setIsOpen(true);

    setConversations((prev) => {
      const currentMsgs = prev[sellerName] || [];
      if (productInfo?.name) {
        const productText = `Halo ${sellerName}, apakah produk "${productInfo.name}" masih ready stok?`;
        const exists = currentMsgs.some((m) => m.text === productText);
        if (!exists) {
          return {
            ...prev,
            [sellerName]: [
              ...currentMsgs,
              { id: `msg-prod-${Date.now()}`, sender: 'user', text: productText, time: 'Baru saja' },
            ],
          };
        }
      }
      return { ...prev, [sellerName]: currentMsgs };
    });
  }, []);

  const openCustomerChat = useCallback((customerKey) => {
    setActiveCustomer(customerKey);
    setIsOpen(true);
  }, []);

  // Hubungkan WebSocket secara aman ke room store
  useEffect(() => {
    const targetRoom = activeSeller || localStorage.getItem('activeSellerId') || localStorage.getItem('myStoreName');
    if (!targetRoom) return;

    const roomSlug = slugifyRoom(targetRoom);
    const roomName = roomSlug.startsWith('store_') ? roomSlug : `store_${roomSlug}`;
    const token = getAuthToken();
    const wsUrl = `${WS_BASE}/ws/chat/${roomName}/${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
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

        setConversations((prev) => ({
          ...prev,
          [targetRoom]: [
            ...(prev[targetRoom] || []),
            {
              id: `msg-ws-${Date.now()}-${Math.random()}`,
              sender: 'seller',
              text: data.message,
              time,
            },
          ],
        }));
      } catch {
        // Safe parse failure
      }
    };

    return () => {
      try { 
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close();
        }
      } catch {
        // Safe close error
      }
      if (window.chatSocket === ws) delete window.chatSocket;
      socketRef.current = null;
    };
  }, [activeSeller, activeCustomer]);

  const pushToBackend = (payload) => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_BASE}/chats/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const targetSeller = activeSeller || localStorage.getItem('activeSellerId');
    if (!targetSeller) return;

    const u = getCurrentUser();
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const trimmedText = text.trim();

    setConversations((prev) => ({
      ...prev,
      [targetSeller]: [
        ...(prev[targetSeller] || []),
        {
          id: `msg-user-${Date.now()}`,
          sender: 'user',
          text: trimmedText,
          time,
        },
      ],
    }));

    try {
      const ws = socketRef.current || window.chatSocket;
      const wsPayload = {
        message: trimmedText,
        sender_id: u.id || 'anon',
        sender_email: u.email || '',
        receiver: targetSeller,
      };
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(wsPayload));
      }
    } catch {
      // Safe send error
    }

    pushToBackend({
      message: trimmedText,
      receiver: targetSeller,
      receiver_id: targetSeller,
      store_name: targetSeller,
    });
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        activeSeller,
        setActiveSeller,
        activeCustomer,
        setActiveCustomer,
        conversations,
        customerChats,
        openChatWithSeller,
        openCustomerChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);