import API from './api';

const reviewService = {
  /** GET /reviews/ — daftar ulasan. Filter by product: /reviews/?product=<id> */
  getByProduct: (productId) => API.get(`/reviews/?product=${productId}`),

  /** GET /reviews/ — semua ulasan */
  getAll: () => API.get('/reviews/'),

  /** POST /reviews/ — buat ulasan baru. Body: {order_id, rating, comment} */
  create: (data) => API.post('/reviews/', data),

  /** DELETE /reviews/<id>/ — hapus ulasan (hanya pemilik) */
  delete: (id) => API.delete(`/reviews/${id}/`),
};

export default reviewService;