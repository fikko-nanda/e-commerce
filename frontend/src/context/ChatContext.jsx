import { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSeller, setActiveSeller] = useState(null);

  // Riwayat pesan dikelompokkan berdasarkan nama seller / toko
  const [conversations, setConversations] = useState({
    'WARMART IND': [
      { id: 1, sender: 'seller', text: 'Halo! Ada yang bisa kami bantu seputar produk WARMART IND?', time: '10:00' }
    ],
    'URBAN CORE': [
      { id: 1, sender: 'seller', text: 'Stok Hoodie Red Neon ready siap kirim hari ini ya kak!', time: '09:15' }
    ]
  });

  // Buka obrolan langsung ke seller tertentu (misal dari halaman produk)
  const openChatWithSeller = (sellerName, productInfo = null) => {
    if (!conversations[sellerName]) {
      setConversations((prev) => ({
        ...prev,
        [sellerName]: [
          { 
            id: Date.now(), 
            sender: 'seller', 
            text: `Halo! Terima kasih telah tertarik dengan toko ${sellerName}. Ada yang bisa kami bantu?`, 
            time: 'Baru saja' 
          }
        ]
      }));
    }

    // Jika membawa konteks produk
    if (productInfo) {
      const initialMsg = {
        id: Date.now() + 1,
        sender: 'user',
        text: `Halo ${sellerName}, apakah produk "${productInfo.name}" masih ready stok?`,
        time: 'Baru saja'
      };
      setConversations((prev) => ({
        ...prev,
        [sellerName]: [...(prev[sellerName] || []), initialMsg]
      }));
    }

    setActiveSeller(sellerName);
    setIsOpen(true);
  };

  const sendMessage = (text) => {
    if (!activeSeller || !text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text, time: 'Baru saja' };
    
    setConversations((prev) => ({
      ...prev,
      [activeSeller]: [...(prev[activeSeller] || []), userMsg]
    }));

    // Simulasi balasan otomatis dari seller yang bersangkutan
    setTimeout(() => {
      const sellerReply = {
        id: Date.now() + 1,
        sender: 'seller',
        text: `[${activeSeller}] Pesan Anda telah kami terima. Tim kami akan segera membalas!`,
        time: 'Baru saja'
      };
      setConversations((prev) => ({
        ...prev,
        [activeSeller]: [...(prev[activeSeller] || []), sellerReply]
      }));
    }, 1200);
  };

  return (
    <ChatContext.Provider value={{
      isOpen,
      setIsOpen,
      activeSeller,
      setActiveSeller,
      conversations,
      openChatWithSeller,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);