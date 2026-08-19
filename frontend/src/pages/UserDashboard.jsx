import { useEffect, useState } from 'react';
import API from '../services/api';

export default function UserDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-8">
        Riwayat Pesanan Saya
      </h2>

      {loading ? (
        <div className="text-center py-20 font-black text-gray-400 uppercase">Memuat Riwayat...</div>
      ) : orders.length === 0 ? (
        <div className="bg-yellow-100 border-4 border-black p-8 text-center font-black uppercase shadow-brutal">
          Belum ada riwayat transaksi pesanan.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border-4 border-black p-6 shadow-brutal flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono font-black bg-black text-white px-2 py-0.5 uppercase tracking-widest">
                  ID: #{order.id.slice(0, 8)}
                </span>
                <h4 className="font-black text-lg uppercase mt-2">{order.product_name}</h4>
                <p className="text-xs font-bold text-gray-600">
                  {order.store_name} | Jumlah: {order.quantity} pcs | Total: <span className="font-black text-black">Rp {Number(order.total_price).toLocaleString('id-ID')}</span>
                </p>
                <p className="text-xs font-bold text-gray-500 mt-1">
                  Pembayaran: <span className={`font-black uppercase ${
                    order.payment_status === 'paid' ? 'text-green-600' :
                    order.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{order.payment_status}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-black px-3 py-1.5 border-2 border-black uppercase shadow-brutal ${
                  order.shipping_status === 'delivered' ? 'bg-green-400' :
                  order.shipping_status === 'shipped' ? 'bg-blue-400 text-white' : 'bg-yellow-300'
                }`}>
                  {order.shipping_status || 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}