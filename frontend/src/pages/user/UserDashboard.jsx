import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { orderService } from '../../services';
import { payWithMidtrans } from '../../utils/loadSnap';
import ReviewModal from '../../components/ReviewModal';

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await orderService.getMyOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await orderService.getMyOrders();
        if (!cancelled) setOrders(res.data.data || []);
      } catch {
        if (!cancelled) console.error('Gagal memuat orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePay = async (order) => {
    try {
      const res = await orderService.pay(order.id);
      const snapToken = res.data.snap_token;
      payWithMidtrans(
        snapToken,
        () => {
          alert('Pembayaran Berhasil!');
          fetchOrders();
        },
        () => alert('Pembayaran Gagal. Silakan coba lagi.')
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memproses pembayaran.');
    }
  };

  const formatDate = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return isoStr; }
  };

  const statusBadge = (text, color) => (
    <span className={`text-[10px] font-black px-2 py-1 uppercase border border-black ${color}`}>
      {text}
    </span>
  );

  if (loading) {
    return <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Riwayat Transaksi...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg mb-8 flex items-center justify-between">
        <div>
          <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
            AKUN PEMBELI
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter mt-1">
            {user ? user.email : 'Pengguna Warmart'}
          </h1>
        </div>
        <div className="bg-white border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-brutal">
          Status: Member Aktif
        </div>
      </div>

      <h2 className="text-2xl font-black uppercase tracking-tighter border-b-4 border-black pb-3 mb-6">
        Riwayat Transaksi
      </h2>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-gray-50 border-4 border-black p-12 text-center font-black text-gray-400 uppercase">
            Belum ada transaksi. Yuk mulai belanja!
          </div>
        ) : orders.map((ord) => (
          <div key={ord.id} className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-3 flex-wrap gap-2">
              <div>
                <span className="font-black text-xs uppercase mr-3">#{ord.id.slice(0, 8)}</span>
                <span className="text-xs font-bold text-gray-500">{formatDate(ord.created_at)}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {statusBadge(`BAYAR: ${ord.payment_status?.toUpperCase()}`,
                  ord.payment_status === 'paid' ? 'bg-green-400 text-black' :
                  ord.payment_status === 'failed' ? 'bg-red-400 text-white' : 'bg-yellow-300 text-black'
                )}
                {statusBadge(`KIRIM: ${ord.shipping_status?.toUpperCase()}`,
                  ord.shipping_status === 'delivered' ? 'bg-green-400 text-black' :
                  ord.shipping_status === 'shipped' ? 'bg-blue-400 text-white' : 'bg-gray-200'
                )}
              </div>
            </div>

            <div className="flex justify-between text-xs font-bold items-center">
              <div className="flex items-center gap-3">
                {ord.product_image && <img src={ord.product_image} alt={ord.product_name} className="w-12 h-12 object-cover border-2 border-black" />}
                <div>
                  <span>{ord.product_name} (x{ord.quantity})</span>
                  <span className="block text-[10px] text-gray-500 mt-1">{ord.store_name}</span>
                </div>
              </div>
              <span>Rp {Number(ord.total_price).toLocaleString('id-ID')}</span>
            </div>

            {ord.courier_name && (
              <div className="text-xs font-bold text-gray-600 border-t-2 border-black pt-2">
                📦 Kurir: {ord.courier_name} {ord.tracking_number && `| No. Resi: ${ord.tracking_number}`}
              </div>
            )}

            <div className="flex justify-between items-center border-t-2 border-black pt-3 flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-500 block">Total Pembayaran</span>
                <span className="text-lg font-black">Rp {Number(ord.total_price).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex gap-2">
                {ord.payment_status === 'pending' && ord.payment_method === 'midtrans' && (
                  <button onClick={() => handlePay(ord)}
                    className="bg-black text-white font-black text-xs uppercase px-5 py-2.5 border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition">
                    Bayar Sekarang 💳
                  </button>
                )}
                {ord.payment_status === 'pending' && ord.payment_method === 'cod' && (
                  <span className="text-xs font-black uppercase text-gray-500 px-3 py-2.5">Bayar di Tempat</span>
                )}
                {ord.payment_status === 'paid' && ord.shipping_status !== 'delivered' && (
                  <button onClick={() => setReviewOrder(ord)}
                    className="bg-yellow-300 font-black text-xs uppercase px-5 py-2.5 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition">
                    ⭐ Beri Ulasan
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReviewModal
        orderId={reviewOrder?.id}
        productName={reviewOrder?.product_name}
        isOpen={!!reviewOrder}
        onClose={() => setReviewOrder(null)}
        onSuccess={fetchOrders}
      />
    </div>
  );
}