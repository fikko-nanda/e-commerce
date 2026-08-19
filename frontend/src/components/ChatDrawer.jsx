import { useState } from 'react';

export default function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'WARMART CS', text: 'Halo! Ada yang bisa kami bantu seputar koleksi 2026?', time: '10:00' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'Anda', text: input, time: 'Baru saja' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Balasan Otomatis
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'WARMART CS', text: 'Pesan Anda telah diterima penjual. Mohon tunggu balasan ya!', time: 'Baru saja' },
      ]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-yellow-300 text-black font-black p-4 border-4 border-black shadow-brutal-lg hover:bg-black hover:text-yellow-300 transition active:translate-x-1 active:translate-y-1 flex items-center gap-2 uppercase text-xs"
      >
        💬 <span className="hidden sm:inline">Tanya Penjual</span>
      </button>

      {/* Drawer Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white border-4 border-black shadow-brutal-lg flex flex-col h-[420px]">
          {/* Header */}
          <div className="bg-black text-white p-3 border-b-4 border-black flex justify-between items-center">
            <span className="font-black text-xs uppercase tracking-wider">💬 Live Support WARMART</span>
            <button onClick={() => setIsOpen(false)} className="bg-red-500 text-white font-black px-2 py-0.5 border border-white text-xs hover:bg-white hover:text-black">
              ✕
            </button>
          </div>

          {/* Body Chat */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'Anda' ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] font-black uppercase text-gray-500 mb-0.5">{m.sender}</span>
                <div className={`p-2.5 border-2 border-black max-w-[80%] text-xs font-bold shadow-brutal ${
                  m.sender === 'Anda' ? 'bg-yellow-300 text-black' : 'bg-white text-black'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className="p-2 bg-white border-t-4 border-black flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-grow border-2 border-black p-2 font-bold text-xs focus:outline-none"
            />
            <button type="submit" className="bg-yellow-300 font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-brutal hover:bg-black hover:text-white transition">
              Kirim
            </button>
          </form>
        </div>
      )}
    </>
  );
}