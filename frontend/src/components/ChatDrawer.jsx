import { useState } from 'react';
import { useChat } from '../context/ChatContext';

export default function ChatDrawer() {
  const { 
    isOpen, 
    setIsOpen, 
    activeSeller, 
    setActiveSeller, 
    conversations, 
    sendMessage 
  } = useChat();

  const [input, setInput] = useState('');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-yellow-300 text-black font-black p-4 border-4 border-black shadow-brutal-lg hover:bg-black hover:text-yellow-300 transition uppercase text-xs flex items-center gap-2"
      >
        💬 <span>Pesan Seller</span>
      </button>
    );
  }

  const currentMessages = activeSeller ? conversations[activeSeller] || [] : [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white border-4 border-black shadow-brutal-lg flex flex-col h-[480px]">
      {/* Header Drawer */}
      <div className="bg-black text-white p-3 border-b-4 border-black flex justify-between items-center">
        {activeSeller ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveSeller(null)}
              className="bg-yellow-300 text-black font-black text-[10px] px-1.5 py-0.5 border border-black hover:bg-white"
            >
              ←
            </button>
            <span className="font-black text-xs uppercase tracking-wider line-clamp-1">
              🏪 {activeSeller}
            </span>
          </div>
        ) : (
          <span className="font-black text-xs uppercase tracking-wider">💬 Pesan Masuk</span>
        )}

        <button 
          onClick={() => setIsOpen(false)} 
          className="bg-red-500 text-white font-black px-2 py-0.5 border border-white text-xs hover:bg-white hover:text-black"
        >
          ✕
        </button>
      </div>

      {/* Tampilan 1: Daftar Seluruh Obrolan Toko */}
      {!activeSeller ? (
        <div className="flex-grow p-3 overflow-y-auto space-y-2 bg-gray-50">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Pilih Toko Penjual:</p>
          {Object.keys(conversations).map((sellerName) => {
            const lastMsg = conversations[sellerName][conversations[sellerName].length - 1];
            return (
              <div
                key={sellerName}
                onClick={() => setActiveSeller(sellerName)}
                className="bg-white border-2 border-black p-3 shadow-brutal hover:bg-yellow-300 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <h4 className="font-black text-xs uppercase">🏪 {sellerName}</h4>
                  <p className="text-[11px] font-bold text-gray-600 line-clamp-1 mt-0.5">
                    {lastMsg ? lastMsg.text : 'Belum ada pesan'}
                  </p>
                </div>
                <span className="text-xs font-black">→</span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tampilan 2: Ruang Obrolan Toko Aktif */
        <>
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50">
            {currentMessages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] font-black uppercase text-gray-500 mb-0.5">
                  {m.sender === 'user' ? 'Anda' : activeSeller}
                </span>
                <div className={`p-2.5 border-2 border-black max-w-[85%] text-xs font-bold shadow-brutal ${
                  m.sender === 'user' ? 'bg-yellow-300 text-black' : 'bg-white text-black'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-2 bg-white border-t-4 border-black flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Tanya ${activeSeller}...`}
              className="flex-grow border-2 border-black p-2 font-bold text-xs focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-black text-white font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-brutal hover:bg-yellow-300 hover:text-black transition"
            >
              Kirim
            </button>
          </form>
        </>
      )}
    </div>
  );
}