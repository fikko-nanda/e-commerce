import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services'; // Path diperbaiki dari ../services ke ../../services

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderService.getOrders();
      setOrders(res.data || res || []);
    } catch (err) {
      console.warn('Gagal mengambil riwayat pesanan, memuat data lokal/dummy:', err);
      // Fallback data dummy jika server belum siap
      const mockOrders = JSON.parse(localStorage.getItem('warmart_orders') || '[]');
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-center mb-6 border-b-4 border-black pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">📦 Riwayat Pesanan Saya</h1>
          <p className="text-xs font-bold text-gray-600 mt-1">Daftar transaksi dan status pembelian Anda</p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="bg-yellow-300 font-black text-xs uppercase px-4 py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
        >
          ← Kembali ke Profil
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center bg-white border-4 border-black shadow-brutal">
          <p className="font-black text-sm uppercase">Memuat data pesanan...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border-4 border-black p-12 text-center shadow-brutal">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-black text-lg uppercase text-gray-500 mb-2">Belum Ada Riwayat Transaksi</p>
          <p className="text-xs font-bold text-gray-600 mb-6">Anda belum pernah melakukan pemesanan produk apapun.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-yellow-300 font-black text-xs uppercase px-6 py-3 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
          >
            Mulai Belanja⚡
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <div key={order.id || idx} className="bg-white border-4 border-black p-5 shadow-brutal">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3 border-b-2 border-black pb-2">
                <span className="font-black text-xs uppercase bg-black text-white px-2.5 py-1">
                  ID Pesanan: #{order.id || `ORD-${idx + 1}`}
                </span>
                <span className="font-black text-xs uppercase bg-green-300 px-3 py-1 border border-black shadow-brutal">
                  {order.status || 'SELESAI'}
                </span>
              </div>

              <div className="flex justify-between items-center my-2">
                <div>
                  <h4 className="font-black text-base uppercase">{order.product_name || order.name || 'Produk WarMart'}</h4>
                  <p className="text-xs font-bold text-gray-600">Jumlah: {order.quantity || 1} item</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Bayar</p>
                  <p className="text-lg font-black bg-yellow-300 px-2 border border-black inline-block">
                    Rp {Number(order.total_price || order.price || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}