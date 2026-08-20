export default function AdminStats({ totalStores, activeStores, totalUsers, totalReviews, avgRating }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-yellow-300 border-4 border-black p-4 shadow-brutal">
        <span className="text-[10px] font-black uppercase">Total Toko</span>
        <h3 className="text-2xl font-black mt-1">{totalStores}</h3>
        <span className="text-[10px] font-bold text-gray-700">{activeStores} aktif</span>
      </div>
      <div className="bg-blue-400 border-4 border-black p-4 shadow-brutal">
        <span className="text-[10px] font-black uppercase">Total User</span>
        <h3 className="text-2xl font-black mt-1">{totalUsers}</h3>
      </div>
      <div className="bg-green-400 border-4 border-black p-4 shadow-brutal">
        <span className="text-[10px] font-black uppercase">GMV Platform</span>
        <h3 className="text-2xl font-black mt-1">Rp 128jt</h3>
      </div>
      <div className="bg-purple-400 border-4 border-black p-4 shadow-brutal">
        <span className="text-[10px] font-black uppercase">Total Ulasan</span>
        <h3 className="text-2xl font-black mt-1">{totalReviews}</h3>
        <span className="text-[10px] font-bold text-gray-700">avg {avgRating}★</span>
      </div>
    </div>
  );
}