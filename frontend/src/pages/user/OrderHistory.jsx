import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderService, reviewService } from '../../services';
import { useToast } from '../../context/ToastContext';

export default function OrderHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Beri Ulasan
  const [reviewModalOrder, setReviewModalOrder] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        const res = await orderService.getOrders();
        if (!cancelled) {
          const rawData = res?.data || res;
          let orderList = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.results)
            ? rawData.results
            : [];

          const queryParams = new URLSearchParams(location.search);
          const urlOrderId = queryParams.get('order_id');
          const trxStatus = queryParams.get('transaction_status');

          if (urlOrderId && (trxStatus === 'settlement' || trxStatus === 'capture')) {
            const cleanId = urlOrderId.split('-')[0];
            orderList = orderList.map((ord) => {
              if (String(ord.id) === String(cleanId) || String(ord.midtrans_order_id) === String(urlOrderId)) {
                return { ...ord, payment_status: 'paid', shipping_status: ord.shipping_status || 'shipped' };
              }
              return ord;
            });
          }

          setOrders(orderList);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Gagal mengambil data pesanan dari backend:', err);
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [location.search]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalOrder) return;

    try {
      const productId = reviewModalOrder.product?.id || reviewModalOrder.product_id || reviewModalOrder.id;

      await reviewService.createReview({
        order_id: reviewModalOrder.id,
        product_id: productId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });

      showToast('Ulasan berhasil dikirim ke Penjual!', 'success');

      // Update status is_reviewed secara lokal agar tombol berganti otomatis tanpa perlu refresh
      setOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === reviewModalOrder.id ? { ...ord, is_reviewed: true, has_review: true } : ord
        )
      );

      setReviewModalOrder(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      console.error('Error detail:', err?.response?.data);
      const errorMsg = err?.response?.data?.order_id?.[0] || 'Gagal mengirim ulasan.';
      showToast(errorMsg, 'error');
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
          className="bg-yellow-300 font-black text-xs uppercase px-4 py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
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
            className="bg-yellow-300 font-black text-xs uppercase px-6 py-3 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
          >
            Mulai Belanja⚡
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => {
            const productName = order.product?.name || order.product_name || order.name || 'Produk WarMart';
            
            const rawPay = (order.payment_status || '').toLowerCase();
            const rawShip = (order.shipping_status || '').toLowerCase();
            
            let displayStatus = 'PENDING';
            let statusColor = 'bg-yellow-300';

            if (rawPay === 'paid' || rawShip === 'shipped' || rawShip === 'delivered') {
              displayStatus = rawShip === 'shipped' ? 'DIKIRIM' : rawShip === 'delivered' ? 'SELESAI' : 'PAID';
              statusColor = rawShip === 'delivered' ? 'bg-green-400' : 'bg-green-300';
            } else if (rawPay === 'failed' || rawPay === 'expire') {
              displayStatus = 'GAGAL';
              statusColor = 'bg-red-300';
            }

            const trackingNo = order.tracking_number || order.resi || order.tracking_code;
            const courierName = order.courier_name || order.courier || 'J&T Express';

            // Pengecekan status apakah pesanan sudah pernah diulas
            const isAlreadyReviewed = order.is_reviewed || order.has_review || false;

            return (
              <div key={order.id || idx} className="bg-white border-4 border-black p-5 shadow-brutal">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3 border-b-2 border-black pb-2">
                  <span className="font-black text-xs uppercase bg-black text-white px-2.5 py-1">
                    ID Pesanan: #{order.id || `ORD-${idx + 1}`}
                  </span>
                  <span className={`font-black text-xs uppercase px-3 py-1 border border-black shadow-brutal ${statusColor}`}>
                    {displayStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center my-2">
                  <div>
                    <h4 className="font-black text-base uppercase">{productName}</h4>
                    <p className="text-xs font-bold text-gray-600">Jumlah: {order.quantity || 1} item</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase">Total Bayar</p>
                    <p className="text-lg font-black bg-yellow-300 px-2 border border-black inline-block">
                      Rp {Number(order.total_price || order.price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                {/* INFORMASI RESI PENGIRIMAN */}
                {trackingNo && (
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-black bg-yellow-50 p-3 border-2 border-black">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-500 block">
                          🚚 Kurir Pengiriman: {courierName}
                        </span>
                        <p className="text-xs font-black uppercase text-black mt-0.5">
                          Nomor Resi: <span className="bg-white px-2 py-0.5 border border-black select-all">{trackingNo}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(trackingNo);
                          alert('Nomor resi berhasil disalin!');
                        }}
                        className="bg-black text-white text-[10px] font-black uppercase px-2.5 py-1 border border-black hover:bg-yellow-300 hover:text-black transition cursor-pointer"
                      >
                        📋 Salin Resi
                      </button>
                    </div>
                  </div>
                )}

                {/* TOMBOL BERI ULASAN (Diperbarui dengan logika pengecekan isAlreadyReviewed) */}
                {displayStatus === 'SELESAI' && (
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-black flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-gray-600">Pesanan telah selesai diterima.</span>
                    {isAlreadyReviewed ? (
                      <span className="bg-gray-200 text-gray-700 font-black px-3 py-1.5 text-xs uppercase border-2 border-black">
                        ✓ SUDAH DIULAS
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewModalOrder(order)}
                        className="bg-yellow-300 text-black font-black px-3 py-1.5 text-xs uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
                      >
                        ⭐ Beri Ulasan
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL POP-UP INPUT ULASAN */}
      {reviewModalOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-brutal-lg space-y-4">
            <div className="flex justify-between items-center border-b-4 border-black pb-2">
              <h3 className="text-lg font-black uppercase">Beri Ulasan Produk</h3>
              <button type="button" onClick={() => setReviewModalOrder(null)} className="font-black text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Rating Bintang</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-white"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Sangat Puas)</option>
                  <option value={4}>⭐⭐⭐⭐ (Puas)</option>
                  <option value={3}>⭐⭐⭐ (Cukup)</option>
                  <option value={2}>⭐⭐ (Kurang)</option>
                  <option value={1}>⭐ (Buruk)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Komentar / Ulasan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Bagaimana kualitas produk ini?"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-black py-3 text-xs uppercase border-2 border-black hover:bg-yellow-300 hover:text-black transition cursor-pointer"
              >
                Kirim Ulasan Sekarang
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}