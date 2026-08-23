import { useEffect, useState, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function UserChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const {
    openChatWithSeller,
    isOpen,
    setIsOpen,
    conversations = {},
    activeSeller,
    sendMessage,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const hasOpenedRef = useRef(false);

  // Parse query parameters dari URL
  const urlParams = new URLSearchParams(location.search);
  const storeName = urlParams.get('store') || '';
  const productId = urlParams.get('productId') || '';
  const productName = urlParams.get('productName') || '';

  // Kunci agar openChatWithSeller HANYA dipanggil 1x saat komponen dimuat
  useEffect(() => {
    if (storeName && !hasOpenedRef.current && typeof openChatWithSeller === 'function') {
      hasOpenedRef.current = true;
      const productInfo = productName ? { id: productId, name: productName } : null;
      openChatWithSeller(storeName, productInfo);
    }
  }, [storeName, productId, productName, openChatWithSeller]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    if (sendMessage) {
      sendMessage(inputMessage.trim());
    }
    setInputMessage('');
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-8">
          Obrolan Saya
        </h2>
        <p className="text-sm text-gray-600 mb-6 font-bold">
          Silakan login terlebih dahulu untuk mengobrol dengan penjual.
        </p>
        <button
          onClick={() => navigate('/login', { state: { from: '/user/chat' } })}
          className="bg-black text-white font-black px-6 py-3 uppercase tracking-wider border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition"
        >
          Masuk untuk Chat
        </button>
      </div>
    );
  }

  const currentSellerKey = activeSeller || storeName;
  const currentMessages = currentSellerKey ? conversations[currentSellerKey] || [] : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-8">
        Chat dengan {currentSellerKey || 'Penjual'}
      </h2>

      {isOpen ? (
        <div className="bg-white border-4 border-black h-full max-h-[80vh] shadow-brutal-lg flex flex-col">
          <div className="bg-yellow-300 border-b-4 border-black p-4 flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tighter">
              🏪 {currentSellerKey || 'Chat'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-red-500 font-black text-xs uppercase px-3 py-1 border border-black bg-white hover:bg-black hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 h-auto overflow-y-auto p-4 min-h-75">
            {currentMessages.length === 0 ? (
              <p className="text-center text-gray-400 uppercase text-sm font-black pt-10">
                Belum ada pesan. Mulai obrolan sekarang!
              </p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {currentMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`p-3 border-2 border-black shadow-brutal ${
                      msg.sender === 'user'
                        ? 'bg-black text-white ml-auto max-w-[80%]'
                        : 'bg-white text-black max-w-[80%]'
                    }`}
                  >
                    <p className="text-[9px] uppercase font-black opacity-60 mb-1">
                      {msg.sender === 'user' ? 'Anda' : currentSellerKey}
                    </p>
                    <p className="text-xs font-black">{msg.text}</p>
                    {msg.time && (
                      <p className="text-[10px] opacity-70 text-right mt-1">{msg.time}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-300 border-t-4 border-black p-4 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              placeholder={`Tanya ${currentSellerKey || 'penjual'}...`}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 border-2 border-black p-2 font-bold text-xs bg-white focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="bg-black text-white font-black px-5 py-2 uppercase text-xs border-2 border-black shadow-brutal hover:bg-white hover:text-black transition"
            >
              Kirim
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-black text-white font-black px-6 py-3 uppercase tracking-wider border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition"
          >
            Mulai Obrolan dengan {storeName || 'Penjual'}
          </button>
        </div>
      )}
    </div>
  );
}