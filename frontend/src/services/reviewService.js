import api from './api';

// Reviews Service - API untuk Review Produk

export const reviewService = {
  // Get semua reviews (public)
  getAllReviews: async () => {
    const response = await api.get('/reviews/');
    return response.data;
  },

  // Get reviews by product ID
  getReviewsByProduct: async (productId) => {
    const response = await api.get(`/reviews/?product=${productId}`);
    return response.data;
  },

  // Create review baru
  createReview: async (data) => {
    const response = await api.post('/reviews/', data);
    return response.data;
  },

  // Update review (hanya owner)
  updateReview: async (id, data) => {
    const response = await api.put(`/reviews/${id}/`, data);
    return response.data;
  },

  // Delete review (hanya owner)
  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}/`);
    return response.data;
  },

  // Get my review for a specific product
  getMyReview: async (productId) => {
    const response = await api.get(`/reviews/?my_product=${productId}`);
    return response.data;
  },
};

export default reviewService;
