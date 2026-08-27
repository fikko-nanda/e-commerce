import { useState } from 'react';
import { useChat } from "../context/ChatContext";

export default function ChatDrawer() {
  const { 
    isOpen, 
    setIsOpen, 
    activeSeller, 
    setActiveSeller,
    activeCustomer,
    setActiveCustomer,
    conversations,
    customerChats,
    unread,
    openCustomerChat,
    sendMessage,
    markRead
  } = useChat();

  const [input, setInput] = useState('');

  const isSellerView = (() => {
    if (localStorage.getItem('myStoreName')) return true;
    try {
      const saved = localStorage.getItem('warmart_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role === 'seller' || !!u.store_name || !!u.store;
      }
    } catch {
      // Permitted empty catch
    }
    return false;
  })();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-yellow-300 text-black font-black p-4 border-4 border-black shadow-brutal-lg hover:bg-black hover:text-yellow-300 transition uppercase text-xs flex items-center gap-2 cursor-pointer"
      >
        💬 <span>Pesan Seller</span>
      </button>
    );
  }

  const isInCustomerThread = isSellerView && !!activeCustomer;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleBack = () => {
    if (isInCustomerThread) setActiveCustomer(null);
    else setActiveSeller(null);
  };

  const handleOpenCustomer = (custKey) => {
    openCustomerChat(custKey);
  };

  // Tentukan pesan yang ditampilkan
  let currentMessages = [];
  let headerTitle = '💬 Pesan Masuk';
  let placeholder = '';

  if (isInCustomerThread) {
    currentMessages = customerChats[activeCustomer] || [];
    headerTitle = `👤 ${activeCustomer}`;
    placeholder = `Balas ke ${activeCustomer}...`;
  } else if (isSellerView && activeSeller) {
    currentMessages = conversations[activeSeller] || [];
    headerTitle = `🏪 ${activeSeller}`;
    placeholder = `Balas di thread ${activeSeller}...`;
  } else if (activeSeller) {
    currentMessages = conversations[activeSeller] || [];
    headerTitle = `🏪 ${activeSeller}`;
    placeholder = `Tanya ${activeSeller}...`;
  }

  const canSend = isInCustomerThread || !!activeSeller;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white border-4 border-black shadow-brutal-lg flex flex-col h-[480px]">
      <div className="bg-black text-white p-3 border-b-4 border-black flex justify-between items-center">
        {(activeSeller || activeCustomer) ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBack}
              className="bg-yellow-300 text-black font-black text-[10px] px-1.5 py-0.5 border border-black hover:bg-white cursor-pointer"
            >
              ←
            </button>
            <span className="font-black text-xs uppercase tracking-wider line-clamp-1">
              {headerTitle}
            </span>
          </div>
        ) : (
          <span className="font-black text-xs uppercase tracking-wider">💬 Pesan Masuk</span>
        )}
        <button 
          onClick={() => setIsOpen(false)} 
          className="bg-red-500 text-white font-black px-2 py-0.5 border border-white text-xs hover:bg-white hover:text-black cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Tampilan List Pesan / Thread */}
      {!activeSeller && !activeCustomer ? (
        <div className="flex-grow p-3 overflow-y-auto space-y-2 bg-gray-50">
          {isSellerView ? (
            <>
              <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Customer yang chat ke toko Anda:</p>
              {Object.keys(customerChats).length === 0 ? (
                <p className="text-center py-8 text-xs font-bold text-gray-400">Belum ada pesan dari customer</p>
              ) : (
                Object.keys(customerChats).map((custKey) => {
                  const lastMsg = customerChats[custKey][customerChats[custKey].length - 1];
                  return (
                    <div
                      key={custKey}
                      onClick={() => handleOpenCustomer(custKey)}
                      className="bg-white border-2 border-black p-3 shadow-brutal hover:bg-yellow-300 cursor-pointer transition flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-black text-xs uppercase flex items-center gap-1.5">
                          👤 {custKey}
                          {unread[custKey] > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 border border-black leading-none">
                              {unread[custKey]}
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] font-bold text-gray-600 line-clamp-1 mt-0.5">
                          {lastMsg ? (lastMsg.text || lastMsg.message) : 'Belum ada pesan'}
                        </p>
                      </div>
                      <span className="text-xs font-black">→</span>
                    </div>
                  );
                })
              )}
              <div className="border-t-2 border-black my-2 pt-2">
                <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Thread toko (lama):</p>
                {Object.keys(conversations).map((sellerName) => {
                  const lastMsg = conversations[sellerName][conversations[sellerName].length - 1];
                  return (
                    <div
                      key={sellerName + (lastMsg?.id || '')}
                      onClick={() => { setActiveSeller(sellerName); markRead(sellerName); }}
                      className="bg-white border-2 border-black p-3 shadow-brutal hover:bg-yellow-300 cursor-pointer transition flex justify-between items-center mb-2"
                    >
                      <div>
                        <h4 className="font-black text-xs uppercase flex items-center gap-1.5">
                          🏪 {sellerName}
                          {unread[sellerName] > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 border border-black leading-none">
                              {unread[sellerName]}
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] font-bold text-gray-600 line-clamp-1 mt-0.5">
                          {lastMsg ? (lastMsg.text || lastMsg.message) : 'Belum ada pesan'}
                        </p>
                      </div>
                      <span className="text-xs font-black">→</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Pilih Toko Penjual:</p>
              {Object.keys(conversations).map((sellerName) => {
                const lastMsg = conversations[sellerName][conversations[sellerName].length - 1];
                return (
                  <div
                    key={sellerName + (lastMsg?.id || '')}
                    onClick={() => { setActiveSeller(sellerName); markRead(sellerName); }}
                    className="bg-white border-2 border-black p-3 shadow-brutal hover:bg-yellow-300 cursor-pointer transition flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-black text-xs uppercase flex items-center gap-1.5">
                        🏪 {sellerName}
                        {unread[sellerName] > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 border border-black leading-none">
                            {unread[sellerName]}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-bold text-gray-600 line-clamp-1 mt-0.5">
                        {lastMsg ? (lastMsg.text || lastMsg.message) : 'Belum ada pesan'}
                      </p>
                    </div>
                    <span className="text-xs font-black">→</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50">
            {(() => {
              // Tentukan berapa pesan masuk terakhir yang belum dibaca (dot merah)
              const threadKey = isInCustomerThread ? activeCustomer : activeSeller;
              const unreadCount = (unread && unread[threadKey]) || 0;

              const incomingIdxs = [];
              currentMessages.forEach((m, i) => {
                const mine = isInCustomerThread
                  ? (m.sender === 'seller' || m.sender === 'store' || m.is_seller === true)
                  : (m.sender === 'user' || m.is_me === true);
                if (!mine) incomingIdxs.push(i);
              });

              const unreadStart = Math.max(0, incomingIdxs.length - unreadCount);
              const unreadIndexSet = new Set(unreadStart < incomingIdxs.length ? incomingIdxs.slice(unreadStart) : []);

              return currentMessages.map((m, idx) => {
                // PEMISAHAN LOGIKA POSISI CHAT LOGIS
                const isMe = isInCustomerThread
                  ? (m.sender === 'seller' || m.sender === 'store' || m.is_seller === true)
                  : (m.sender === 'user' || m.is_me === true);
                const isUnread = !isMe && unreadIndexSet.has(idx);

                return (
                  <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                    <span className="text-[9px] font-black uppercase text-gray-500 mb-0.5 flex items-center gap-1">
                      {isMe ? 'ANDA' : (activeCustomer || activeSeller)}
                    </span>
                    <div className={`relative p-2.5 border-2 border-black max-w-[85%] text-xs font-bold shadow-brutal ${
                      isMe ? 'bg-yellow-300 text-black' : 'bg-white text-black'
                    }`}>
                      {isUnread && (
                        <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 border border-black" />
                      )}
                      {m.text || m.message}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <form onSubmit={handleSend} className="p-2 bg-white border-t-4 border-black flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder || 'Tulis pesan...'}
              disabled={!canSend}
              className="flex-grow border-2 border-black p-2 font-bold text-xs focus:outline-none"
            />
            <button 
              type="submit" 
              disabled={!canSend}
              className="bg-black text-white font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-brutal hover:bg-yellow-300 hover:text-black transition disabled:opacity-50 cursor-pointer"
            >
              Kirim
            </button>
          </form>
        </>
      )}
    </div>
  );
}