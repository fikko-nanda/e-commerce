import API from './api';

const reviewService = {
  // 1. Mengambil seluruh ulasan platform (Untuk Admin Dashboard)
  getAll: async () => {
    try {
      return await API.get('/reviews/');
    } catch (err) {
      console.warn('Gagal memuat seluruh ulasan:', err);
      return { data: [] };
    }
  },

  // 2. Mengambil ulasan khusus produk tertentu (Untuk Halaman Detail Produk)
  getByProduct: async (productId) => {
    try {
      return await API.get(`/reviews/?product=${productId}`);
    } catch {
      return { data: [] };
    }
  },

  // 3. Mengambil ulasan khusus toko milik seller yang login (Untuk Seller Dashboard)
  getStoreReviews: async () => {
    try {
      return await API.get('/reviews/?store_me=true');
    } catch (err) {
      console.warn('Gagal memuat ulasan toko:', err);
      return { data: [] };
    }
  },

  // 4. Balas ulasan pembeli
  replyReview: (reviewId, replyText) =>
    API.post(`/reviews/${reviewId}/reply/`, { reply: replyText }),

  // 5. Kirim ulasan baru
  createReview: (data) => API.post('/reviews/', data),

  // 6. Hapus ulasan (Untuk Moderasi Admin)
  delete: (reviewId) => API.delete(`/reviews/${reviewId}/`),
};

export default reviewService;