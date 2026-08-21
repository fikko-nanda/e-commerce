export default function ReviewsTab({
  reviews,
  loading,
  deletingId,
  filter,
  setFilter,
  avgRating,
  totalReviews,
  ratingDistribution,
  onDeleteReview,
  renderStars,
  formatDate,
}) {
  return (
    <div className="space-y-6 mt-4">
      {/* Ringkasan Statistik Rating */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-300 border-4 border-black p-6 shadow-brutal">
        <div className="flex flex-col justify-center items-center border-b-2 md:border-b-0 md:border-r-2 border-black pb-4 md:pb-0">
          <span className="text-4xl font-black">★ {avgRating}</span>
          <span className="text-xs font-black uppercase mt-1">Rata-rata Rating</span>
          <span className="text-[10px] text-gray-700 font-bold">({totalReviews} Ulasan Total)</span>
        </div>

        <div className="md:col-span-2 space-y-1">
          <span className="block text-xs font-black uppercase mb-2">Distribusi Rating</span>
          {ratingDistribution.map((item) => (
            <div key={item.star} className="flex items-center gap-2 text-xs font-bold">
              <span className="w-16 font-black text-right">{item.star} Bintang</span>
              <div className="flex-1 bg-white border border-black h-3 overflow-hidden">
                <div
                  className="bg-black h-full"
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
              <span className="w-12 text-right font-mono text-[10px]">{item.count} ({item.percent}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daftar Ulasan */}
      <div className="bg-white border-4 border-black p-6 shadow-brutal">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black uppercase">Moderasi Ulasan</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
          >
            <option value="all">Semua Rating</option>
            <option value="5">5 Bintang</option>
            <option value="4">4 Bintang</option>
            <option value="3">3 Bintang</option>
            <option value="2">2 Bintang</option>
            <option value="1">1 Bintang</option>
          </select>
        </div>

        {loading ? (
          <div className="p-4 font-black text-xs uppercase">Memuat ulasan...</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-2 border-black p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 font-black tracking-widest">{renderStars(r.rating)}</span>
                    <span className="text-xs font-black">@{r.username}</span>
                    <span className="text-[10px] text-gray-500 font-bold">• {formatDate(r.created_at)}</span>
                  </div>
                  <p className="text-xs font-black text-purple-700">{r.product_name} ({r.store_name})</p>
                  <p className="text-xs font-bold italic text-gray-800">"{r.comment}"</p>
                </div>
                <div className="flex items-center">
                  <button
                    disabled={deletingId === r.id}
                    onClick={() => onDeleteReview(r.id)}
                    className="bg-red-500 text-white px-3 py-1.5 border border-black text-xs font-black uppercase hover:bg-black transition"
                  >
                    🗑 Hapus Ulasan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}