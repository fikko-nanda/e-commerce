import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { payWithMidtrans } from '../utils/loadSnap';

const INITIAL_USER_ORDERS = [
  {
    id: 'TRX-20260819-001',
    date: '19 Agu 2026',
    items: [{ name: 'OVERSIZED T-SHIRT BLACK VOL. 01', qty: 1, price: 189000 }],
    total: 189000,
    status: 'MENUNGGU PEMBAYARAN',
    snapToken: 'SANDBOX-DUMMY-SNAP-TOKEN-1',
  },
  {
    id: 'TRX-20260810-088',
    date: '10 Agu 2026',
    items: [{ name: 'CARGO PANTS TACTICAL BLACK', qty: 1, price: 279000 }],
    total: 279000,
    status: 'SELESAI',
    snapToken: null,
  },
];

export default function UserDashboard() {
  const { user } = useContext(AuthContext) || {};
  const [orders, setOrders] = useState(INITIAL_USER_ORDERS);

  const handlePay = (order) => {
    payWithMidtrans(
      order.snapToken,
      () => {
        setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: 'DIBAYAR' } : o)));
        alert('Pembayaran Sukses!');
      },
      () => alert('Pembayaran Gagal. Silakan coba lagi.')
    );
  };

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
        {orders.map((ord) => (
          <div key={ord.id} className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-3">
              <div>
                <span className="font-black text-xs uppercase mr-3">{ord.id}</span>
                <span className="text-xs font-bold text-gray-500">{ord.date}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 uppercase border border-black ${
                ord.status === 'SELESAI' ? 'bg-green-400 text-black' :
                ord.status === 'MENUNGGU PEMBAYARAN' ? 'bg-yellow-300 text-black' : 'bg-gray-200'
              }`}>
                {ord.status}
              </span>
            </div>

            <div className="space-y-2">
              {ord.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold">
                  <span>{it.name} (x{it.qty})</span>
                  <span>Rp {it.price.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t-2 border-black pt-3">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-500 block">Total Pembayaran</span>
                <span className="text-lg font-black">Rp {ord.total.toLocaleString('id-ID')}</span>
              </div>

              {ord.status === 'MENUNGGU PEMBAYARAN' && (
                <button
                  onClick={() => handlePay(ord)}
                  className="bg-black text-white font-black text-xs uppercase px-5 py-2.5 border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition"
                >
                  Bayar Sekarang 💳
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}