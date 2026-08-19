import { useState } from 'react';
import API from '../services/api';

export default function ReviewModal({ productId, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/reviews/', {
        product: productId,
        rating: Number(rating),
        comment,
      });

      alert('Ulasan berhasil dikirim!');
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Gagal mengirim ulasan:', err);
      alert('Gagal mengirim ulasan. Pastikan Anda belum pernah mengulas produk ini.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black p-6 max-w-md w-full relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl font-black">✕</button>
        
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Beri Ulasan Produk</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Rating Bintang</label>
            <select 
              value={rating} 
              onChange={(e) => setRating(e.target.value)}
              className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm"
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
              className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white font-black py-3 uppercase hover:bg-gray-800 transition disabled:bg-gray-400"
          >
            {loading ? 'Kirim...' : 'Kirim Ulasan'}
          </button>
        </form>
      </div>
    </div>
  );
}