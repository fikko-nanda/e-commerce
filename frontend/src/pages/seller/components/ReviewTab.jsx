export default function ReviewTab({ reviews, replyInputs, setReplyInputs, handleReplyReview }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-8 text-center shadow-brutal">
        <p className="font-black text-sm uppercase text-gray-500">Belum ada ulasan dari pembeli.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-6">
      <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Ulasan Produk dari Pembeli</h2>
      <div className="space-y-4">
        {reviews.map((rev) => {
          const productName = rev.productName || rev.product_name || 'Produk WarMart';
          const buyerName = rev.buyer || rev.username || 'Pembeli';
          const reviewDate = rev.date || (rev.created_at ? rev.created_at.split('T')[0] : '');
          const replyText = rev.reply || rev.seller_reply || '';

          return (
            <div key={rev.id} className="border-2 border-black p-4 bg-gray-50 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-black text-xs uppercase bg-yellow-300 px-2 py-0.5 border border-black">
                    {productName}
                  </span>
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    Oleh: <span className="text-black font-black">{buyerName}</span> {reviewDate && `• ${reviewDate}`}
                  </p>
                </div>
                <div className="text-yellow-500 text-sm font-black">
                  {'⭐'.repeat(Math.max(1, Math.min(5, Number(rev.rating || 5))))}
                </div>
              </div>

              <p className="text-xs font-bold text-black bg-white p-2 border border-black">
                {rev.comment || '-'}
              </p>

              {replyText ? (
                <div className="bg-yellow-100 border-l-4 border-black p-2 text-xs font-bold ml-4">
                  <p className="font-black text-[10px] uppercase text-gray-700">Balasan Toko Anda:</p>
                  <p>{replyText}</p>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Tulis balasan ulasan..."
                    value={replyInputs[rev.id] || ''}
                    onChange={(e) => setReplyInputs({ ...replyInputs, [rev.id]: e.target.value })}
                    className="flex-1 border-2 border-black p-1.5 text-xs font-bold focus:bg-yellow-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleReplyReview(rev.id)}
                    className="bg-black text-white px-3 py-1.5 text-xs font-black uppercase border border-black hover:bg-yellow-300 hover:text-black transition cursor-pointer"
                  >
                    Kirim
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}