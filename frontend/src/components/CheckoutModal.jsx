import { useState } from 'react';
import { orderService } from '../services';
import { payWithMidtrans } from '../utils/loadSnap';

export default function CheckoutModal({ product, isOpen, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const totalPrice = Number(product.price) * quantity;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await orderService.checkout({
        product_id: product.id,
        quantity: Number(quantity),
        payment_method: paymentMethod,
      });

      setLoading(false);

      if (paymentMethod === 'midtrans' && response.data.snap_token) {
        payWithMidtrans(
          response.data.snap_token,
          () => {
            alert('Pembayaran Berhasil!');
            onSuccess();
            onClose();
          },
          () => alert('Pembayaran Gagal!')
        );
      } else {
        alert('Pesanan berhasil dibuat!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Gagal membuat pesanan.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black p-8 max-w-lg w-full relative shadow-brutal-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl font-black bg-red-500 text-white px-2.5 py-0.5 border-2 border-black hover:bg-black">
          ✕
        </button>
        
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 border-b-4 border-black pb-2">
          Checkout Produk
        </h3>
        
        <div className="bg-yellow-300 p-4 border-2 border-black mb-6 shadow-brutal">
          <h4 className="font-black text-sm uppercase">{product.name}</h4>
          <p className="text-xs font-bold text-black/70">Harga Satuan: Rp {Number(product.price).toLocaleString('id-ID')}</p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-1">Jumlah</label>
            <input 
              type="number" 
              min="1" 
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Metode Pembayaran</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none"
            >
              <option value="midtrans">Midtrans Gateway (QRIS/Gopay/Transfer)</option>
              <option value="cod">Bayar di Tempat (COD)</option>
            </select>
          </div>

          <div className="border-t-4 border-black pt-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-500 block">TOTAL BAYAR</span>
              <span className="text-2xl font-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-black text-white font-black px-6 py-3 uppercase tracking-wider border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition disabled:bg-gray-300"
            >
              {loading ? 'Memproses...' : 'Bayar Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
