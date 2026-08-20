import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart = [], removeFromCart, updateQuantity, totalPrice = 0 } = useContext(CartContext) || {};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full border-l-4 border-black p-6 flex flex-col justify-between shadow-brutal-lg">
        <div>
          <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
            <h3 className="text-2xl font-black uppercase tracking-tighter">Keranjang Saya</h3>
            <button 
              onClick={onClose} 
              className="bg-red-500 text-white font-black px-3 py-1 border-2 border-black hover:bg-black transition"
            >
              ✕
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-16 font-black text-gray-400 uppercase bg-gray-50 border-2 border-black">
              Keranjang Masih Kosong
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.id} className="bg-yellow-100 border-2 border-black p-3 flex justify-between items-center shadow-brutal">
                  <div className="max-w-[180px]">
                    <h4 className="font-black text-xs uppercase line-clamp-1">{item.name}</h4>
                    <p className="text-xs font-bold text-gray-700">
                      Rp {Number(item.price).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-white font-black px-2 py-0.5 border border-black hover:bg-black hover:text-white"
                    >
                      -
                    </button>
                    <span className="font-black text-xs">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-white font-black px-2 py-0.5 border border-black hover:bg-black hover:text-white"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="bg-red-500 text-white font-black px-2 py-0.5 border border-black ml-2 hover:bg-black"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t-4 border-black pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-black uppercase text-xs">Total Pembayaran:</span>
            <span className="text-xl font-black bg-yellow-300 px-2 border-2 border-black shadow-brutal">
              Rp {totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
          <Link 
            to="/user/dashboard" 
            onClick={onClose}
            className="block text-center w-full bg-black text-white font-black py-3 uppercase tracking-wider border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition"
          >
            Lanjut Pesan →
          </Link>
        </div>
      </div>
    </div>
  );
}