import API from './api';

const reviewService = {
  getByProduct: async (productId) => {
    try {
      return await API.get(`/reviews/?product=${productId}`);
    } catch {
      return { data: [] };
    }
  },

  // Return array kosong langsung tanpa panggil API backend (mencegah 404 di console)
  getStoreReviews: async () => {
    return { data: [] };
  },

  replyReview: (reviewId, replyText) =>
    API.post(`/reviews/${reviewId}/reply/`, { reply: replyText }),

  createReview: (data) => API.post('/reviews/', data),
};

export default reviewService;