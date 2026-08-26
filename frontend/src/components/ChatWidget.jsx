import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useChat } from "../context/ChatContext";

function slugifyRoom(name) {
  return String(name || 'seller').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'seller';
}

export default function ChatWidget() {
  const { user } = useContext(AuthContext);
  const { sendMessage, conversations, activeSeller } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const isLoggedIn = Boolean(user && (user.id || user.email || Object.keys(user).length > 0));

  useEffect(() => {
    if (!isLoggedIn || !isOpen) return;

    const ws = window.chatSocket;
    if (!ws) return;

    const handler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setMessages((prev) => [
            ...prev,
            { message: data.message, sender_id: data.sender_id, localId: Date.now() }
          ]);
        }
      } catch (err) {
        console.error("Parse WS Error:", err);
      }
    };

    ws.addEventListener('message', handler);
    return () => {
      try {
        ws.removeEventListener('message', handler);
      } catch {
        // Safe cleanup tanpa variabel unused
      }
    };
  }, [isLoggedIn, user, isOpen]);

  if (!isLoggedIn) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(input.trim());

    setMessages((prev) => [
      ...prev,
      { message: input.trim(), sender: 'user', localId: Date.now() }
    ]);

    setInput('');
  };

  const currentSellerMsgs = activeSeller ? conversations[activeSeller] || [] : [];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-black text-white font-black px-5 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition uppercase text-xs"
        >
          💬 Live Chat
        </button>
      ) : (
        <div className="bg-white border-4 border-black w-80 sm:w-96 h-96 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white p-3 flex justify-between items-center">
            <span className="font-black text-xs uppercase tracking-wider">
              Live Chat {activeSeller ? `- ${activeSeller}` : 'CS'}
            </span>
            <button onClick={() => setIsOpen(false)} className="text-white font-black text-sm">✕</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.length === 0 && currentSellerMsgs.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold text-center mt-10">Belum ada obrolan...</p>
            ) : (
              <div className="space-y-2">
                {currentSellerMsgs.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`p-2 border-2 border-black max-w-[85%] text-xs font-bold ${
                      msg.sender === 'user' ? 'bg-black text-white ml-auto' : 'bg-white text-black mr-auto'
                    }`}
                  >
                    <p className="text-[9px] opacity-70 mb-0.5">{msg.sender === 'user' ? 'Anda' : 'Penjual'}</p>
                    <p>{msg.text}</p>
                  </div>
                ))}

                {messages.map((msg) => {
                  const isOwn = msg.sender === 'user' || msg.sender_id === slugifyRoom(user?.id);
                  return (
                    <div 
                      key={msg.localId}
                      className={`p-2 border-2 border-black max-w-[85%] text-xs font-bold ${
                        isOwn ? 'bg-black text-white ml-auto' : 'bg-white text-black mr-auto'
                      }`}
                    >
                      <p className="text-[9px] opacity-70 mb-0.5">{isOwn ? 'Anda' : 'Penjual'}</p>
                      <p>{msg.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-2 border-t-2 border-black flex gap-2 bg-white">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 bg-gray-100 border-2 border-black px-3 py-1.5 text-xs font-bold focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-black text-white font-black px-4 uppercase text-xs border border-black hover:bg-yellow-300 hover:text-black transition"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
}