export default function AnalyticsTab({ orders, products }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <span className="text-[10px] font-black uppercase text-gray-500">Pengunjung Toko (30 Hari)</span>
          <p className="text-2xl font-black mt-1">1,480 <span className="text-xs text-green-600 font-bold">+18%</span></p>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <span className="text-[10px] font-black uppercase text-gray-500">Tingkat Konversi</span>
          <p className="text-2xl font-black mt-1">3.4% <span className="text-xs text-green-600 font-bold">Bagus</span></p>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <span className="text-[10px] font-black uppercase text-gray-500">Pesanan Selesai</span>
          <p className="text-2xl font-black mt-1">{orders.length} Transaksi</p>
        </div>
      </div>

      <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
        <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2">🔥 Produk Terlaris Saya</h3>
        <div className="space-y-4">
          {products.slice(0, 4).map((prod, idx) => (
            <div key={prod.id} className="flex items-center justify-between gap-4 border-b pb-3 border-gray-200">
              <div className="flex items-center gap-3">
                <span className="bg-black text-white font-black w-6 h-6 flex items-center justify-center text-xs">#{idx + 1}</span>
                <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover border-2 border-black" />
                <div>
                  <p className="font-black text-xs uppercase line-clamp-1">{prod.name}</p>
                  <p className="text-[10px] font-bold text-gray-500">Terjual {prod.sold} pcs</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-xs">Rp {(prod.price * prod.sold).toLocaleString('id-ID')}</p>
                <span className="text-[9px] font-bold text-green-600">Total Performa</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}