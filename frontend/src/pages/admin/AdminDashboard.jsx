import { useState } from 'react';

const DUMMY_SELLERS = [
  { id: 1, name: 'WARMART OFFICIAL', owner: 'Budi', status: 'VERIFIED', totalProducts: 12 },
  { id: 2, name: 'URBAN CORE', owner: 'Siti', status: 'MENUNGGU VERIFIKASI', totalProducts: 4 },
];

export default function AdminDashboard() {
  const [sellers, setSellers] = useState(DUMMY_SELLERS);

  const handleVerify = (id) => {
    setSellers(sellers.map((s) => (s.id === id ? { ...s, status: 'VERIFIED' } : s)));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="bg-black text-white border-4 border-black p-6 shadow-brutal-lg mb-8 flex justify-between items-center">
        <div>
          <span className="bg-yellow-300 text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
            SUPERADMIN PANEL
          </span>
          <h1 className="text-3xl font-black uppercase mt-1">WARMART PLATFORM CONTROL</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-yellow-300 border-4 border-black p-4 shadow-brutal">
          <span className="text-xs font-black uppercase">Total Penjual</span>
          <h3 className="text-3xl font-black mt-1">{sellers.length} Toko</h3>
        </div>
        <div className="bg-green-400 border-4 border-black p-4 shadow-brutal">
          <span className="text-xs font-black uppercase">GMV Platform</span>
          <h3 className="text-3xl font-black mt-1">Rp 128.500.000</h3>
        </div>
        <div className="bg-blue-400 border-4 border-black p-4 shadow-brutal">
          <span className="text-xs font-black uppercase">Pengguna Aktif</span>
          <h3 className="text-3xl font-black mt-1">1,240 User</h3>
        </div>
      </div>

      <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-3 mb-6">
        Manajemen Toko & Vendor
      </h2>

      <div className="space-y-4">
        {sellers.map((s) => (
          <div key={s.id} className="bg-white border-4 border-black p-5 shadow-brutal flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-base uppercase">{s.name}</h4>
                <span className={`text-[10px] font-black px-2 py-0.5 border border-black ${
                  s.status === 'VERIFIED' ? 'bg-green-400' : 'bg-yellow-300'
                }`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-600">Pemilik: {s.owner} | Total Produk: {s.totalProducts}</p>
            </div>

            {s.status === 'MENUNGGU VERIFIKASI' && (
              <button
                onClick={() => handleVerify(s.id)}
                className="bg-green-400 font-black text-xs uppercase px-4 py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
              >
                Verifikasi Toko ✅
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}