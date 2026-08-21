export default function AdminStats({
  totalStores,
  activeStores,
  totalUsers,
  totalReviews,
  avgRating,
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-yellow-300 border-4 border-black p-4 shadow-brutal">
        <span className="block text-xs font-black uppercase">Toko Aktif / Total</span>
        <span className="text-2xl font-black">{activeStores} / {totalStores}</span>
      </div>
      <div className="bg-purple-400 text-black border-4 border-black p-4 shadow-brutal">
        <span className="block text-xs font-black uppercase">Total Pengguna</span>
        <span className="text-2xl font-black">{totalUsers}</span>
      </div>
      <div className="bg-blue-300 text-black border-4 border-black p-4 shadow-brutal">
        <span className="block text-xs font-black uppercase">Total Ulasan</span>
        <span className="text-2xl font-black">{totalReviews}</span>
      </div>
      <div className="bg-green-400 text-black border-4 border-black p-4 shadow-brutal">
        <span className="block text-xs font-black uppercase">Rata-Rata Rating</span>
        <span className="text-2xl font-black">★ {avgRating}</span>
      </div>
    </div>
  );
}