import { useState } from 'react';
import { reviewService } from '../services';

export default function ReviewModal({ orderId, productName, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await reviewService.create({
        order_id: orderId,
        rating: Number(rating),
        comment,
      });

      alert('Ulasan berhasil dikirim!');
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.order_id?.[0] || err.response?.data?.error || 'Gagal mengirim ulasan.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black p-6 max-w-md w-full relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl font-black bg-red-500 text-white px-2.5 py-0.5 border-2 border-black hover:bg-black">✕</button>

        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Beri Ulasan Produk</h3>
        {productName && <p className="text-xs font-bold text-gray-600 mb-4">{productName}</p>}

        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 px-3 py-2 text-xs font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Rating Bintang</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none"
            >
              <option value="5">⭐⭐⭐⭐⭐ (Sangat Puas)</option>
              <option value="4">⭐⭐⭐⭐ (Bagus)</option>
              <option value="3">⭐⭐⭐ (Cukup)</option>
              <option value="2">⭐⭐ (Kurang)</option>
              <option value="1">⭐ (Sangat Kecewa)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Ulasan Anda</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda menggunakan produk ini..."
              className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-black py-3 uppercase hover:bg-gray-800 transition disabled:bg-gray-400 border-2 border-black shadow-brutal"
          >
            {loading ? 'Kirim...' : 'Kirim Ulasan'}
          </button>
        </form>
      </div>
    </div>
  );
}
