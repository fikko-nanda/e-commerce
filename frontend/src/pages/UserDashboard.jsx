import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal Review
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    API.get('/orders/')
      .then((res) => {
        const dataList = Array.isArray(res.data) 
          ? res.data 
          : (Array.isArray(res.data?.results) ? res.data.results : []);
        setOrders(dataList);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Gagal mengambil pesanan:', err);
        setOrders([]);
        setLoading(false);
      });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await API.post('/reviews/', {
        order: selectedOrder.id,
        product: selectedOrder.product,
        rating: Number(rating),
        comment: comment,
      });

      alert('Ulasan berhasil terkirim!');
      setSelectedOrder(null);
      setComment('');
      setRating(5);
      fetchOrders();
    } catch (err) {
      console.error('Gagal kirim ulasan:', err);
      alert(err.response?.data?.detail || 'Gagal mengirim ulasan.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 border-b-2 border-black pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Pesanan Saya</h2>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            Logged in as: <span className="text-black">{user?.email || 'Guest'}</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-gray-500">Memuat transaksi...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 font-bold text-gray-400">
          Belum ada riwayat pesanan.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border-2 border-black p-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                <span className="text-xs font-mono font-bold text-gray-500">ID: {order.id}</span>
                <span className="text-xs font-bold text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-black text-lg mb-1">
                    Produk Ref: {order.product}
                  </h4>
                  <p className="text-xs font-bold text-gray-500">
                    Jumlah: {order.quantity} | Total: <span className="text-black font-black">Rp {Number(order.total_price).toLocaleString('id-ID')}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Badge Payment Status */}
                  <span className={`text-[10px] font-bold px-2 py-1 uppercase ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.payment_status} ({order.payment_method})
                  </span>

                  {/* Badge Shipping Status */}
                  <span className="bg-gray-200 text-gray-800 text-[10px] font-bold px-2 py-1 uppercase">
                    Ship: {order.shipping_status}
                  </span>

                  {/* Tombol Ulasan (Hanya jika delivered) */}
                  {order.shipping_status === 'delivered' && (
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="bg-black text-white text-xs font-bold px-4 py-2 uppercase hover:bg-gray-800 transition"
                    >
                      Beri Ulasan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Review */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black p-8 max-w-md w-full relative">
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="absolute top-4 right-4 text-xl font-black"
            >
              ✕
            </button>
            <h3 className="text-xl font-black uppercase mb-4">Beri Ulasan Produk</h3>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Rating (1 - 5)</label>
                <select 
                  value={rating} 
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-black p-2 font-bold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4)</option>
                  <option value={3}>⭐⭐⭐ (3)</option>
                  <option value={2}>⭐⭐ (2)</option>
                  <option value={1}>⭐ (1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Komentar</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-sm"
                  placeholder="Tulis ulasan Anda..."
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-black text-white font-black py-3 uppercase tracking-wider hover:bg-gray-800 transition"
              >
                Kirim Ulasan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}