import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart = [], removeFromCart, updateQuantity, totalPrice = 0, clearCart } = useContext(CartContext) || {};
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      await orderService.checkoutCart(cart, paymentMethod);
      clearCart();
      onClose();
      navigate('/user/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal melakukan checkout. Pastikan stok mencukupi.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
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

        {cart.length > 0 && (
          <div className="border-t-4 border-black pt-4">
            <div className="mb-3">
              <label className="block font-black text-[10px] uppercase mb-1">Metode Pembayaran:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border-2 border-black p-2 font-bold text-xs bg-white"
              >
                <option value="cod">Cash On Delivery (COD)</option>
                <option value="midtrans">Midtrans (QRIS/Transfer/GoPay)</option>
              </select>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="font-black uppercase text-xs">Total Pembayaran:</span>
              <span className="text-xl font-black bg-yellow-300 px-2 border-2 border-black shadow-brutal">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="block text-center w-full bg-black text-white font-black py-3 uppercase tracking-wider border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Bayar Sekarang →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
