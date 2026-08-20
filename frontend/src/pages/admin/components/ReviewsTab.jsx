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
  formatDate,
  renderStars,
}) {
  return (
    <>
      {/* Ringkasan Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg flex flex-col items-center justify-center">
          <span className="text-xs font-black uppercase mb-2">Rata-rata Rating</span>
          <span className="text-5xl font-black">{avgRating}</span>
          <span className="text-2xl text-black/70 mt-1">★★★★★</span>
          <span className="text-[10px] font-bold text-gray-700 mt-1">
            dari {totalReviews} ulasan
          </span>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-brutal-lg">
          <span className="text-xs font-black uppercase mb-3 block">Distribusi Rating</span>
          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-black w-8">{star}★</span>
                <div className="flex-1 bg-gray-100 border-2 border-black h-4 relative">
                  <div className="bg-yellow-300 h-full" style={{ width: `${percent}%` }}></div>
                </div>
                <span className="text-[10px] font-black w-12 text-right">{count} ({percent}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Rating */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="text-[10px] font-black uppercase text-gray-500">Filter:</span>
        {['all', '5', '4', '3', '2', '1'].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`text-[10px] font-black uppercase px-3 py-1.5 border-2 border-black shadow-brutal transition ${
              filter === r ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'
            }`}
          >
            {r === 'all' ? 'Semua' : `${r} Bintang`}
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-3 mb-6">
        Daftar Ulasan ({reviews.length})
      </h2>

      {loading ? (
        <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Ulasan...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-gray-50 border-4 border-black p-12 text-center font-black text-gray-400 uppercase">
          Belum ada ulasan untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border-4 border-black p-5 shadow-brutal flex justify-between items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-black text-sm uppercase">{rev.username}</span>
                  <span className="text-yellow-500 text-sm">{renderStars(rev.rating)}</span>
                  <span className="text-[10px] font-black text-gray-500">
                    {formatDate(rev.created_at)}
                  </span>
                </div>

                <p className="text-xs font-bold text-gray-700 mb-2 leading-relaxed">"{rev.comment}"</p>

                <div className="flex items-center gap-2 flex-wrap">
                  {rev.product_name && (
                    <span className="text-[10px] font-black bg-gray-100 border border-black px-2 py-0.5 uppercase">
                      🛍️ {rev.product_name}
                    </span>
                  )}
                  {rev.store_name && (
                    <span className="text-[10px] font-black bg-purple-200 border border-black px-2 py-0.5 uppercase">
                      🏪 {rev.store_name}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteReview(rev.id)}
                disabled={deletingId === rev.id}
                className="bg-red-500 text-white font-black text-xs px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black transition disabled:opacity-50 shrink-0"
              >
                {deletingId === rev.id ? 'Menghapus...' : '🗑️ Hapus'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}