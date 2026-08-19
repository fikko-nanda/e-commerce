import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ChatWidget() {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !isOpen) return;

    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws'}/chat/room_${user.id}/`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [user, isOpen]);

  if (!user) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    const messageData = {
      message: input,
      sender: user.email,
    };

    socketRef.current.send(JSON.stringify(messageData));
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-black text-white font-black px-5 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          💬 Live Chat
        </button>
      ) : (
        <div className="bg-white border-4 border-black w-80 sm:w-96 h-96 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white p-3 flex justify-between items-center">
            <span className="font-black text-xs uppercase tracking-wider">Live Chat CS</span>
            <button onClick={() => setIsOpen(false)} className="text-white font-black text-sm">✕</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold text-center mt-10">Mulai percakapan dengan penjual...</p>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`max-w-[80%] p-2.5 text-xs font-bold border-2 border-black ${
                    msg.sender === user.email 
                      ? 'bg-black text-white ml-auto' 
                      : 'bg-white text-black mr-auto'
                  }`}
                >
                  <p className="text-[9px] opacity-70 mb-0.5">{msg.sender}</p>
                  <p>{msg.message}</p>
                </div>
              ))
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
            <button type="submit" className="bg-black text-white text-xs font-black px-4 uppercase">Kirim</button>
          </form>
        </div>
      )}
    </div>
  );
}