import { useState } from 'react';

export default function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'seller', text: 'Halo! Ada yang bisa kami bantu seputar koleksi WARMART?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-yellow-300 border-4 border-black p-4 font-black text-sm uppercase shadow-brutal hover:bg-black hover:text-white transition flex items-center gap-2"
        >
          💬 Chat CS
        </button>
      ) : (
        <div className="bg-white border-4 border-black w-80 h-96 flex flex-col justify-between shadow-brutal-lg">
          <div className="bg-black text-white p-3 border-b-4 border-black flex justify-between items-center">
            <span className="font-black text-xs uppercase tracking-wider">Live Chat WARMART</span>
            <button onClick={() => setIsOpen(false)} className="text-white font-black">✕</button>
          </div>

          <div className="p-3 overflow-y-auto space-y-2 flex-1 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 max-w-[80%] text-xs font-bold border-2 border-black shadow-brutal ${
                  m.sender === 'user' ? 'bg-yellow-300' : 'bg-white'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-2 border-t-4 border-black bg-white flex gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan..." 
              className="flex-1 border-2 border-black p-1.5 text-xs font-bold focus:outline-none"
            />
            <button type="submit" className="bg-black text-white font-black text-xs px-3 uppercase border-2 border-black hover:bg-yellow-400 hover:text-black">
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
}