import API from './api';

const reviewService = {
  getStoreReviews: () => API.get('/reviews/store-reviews/'),
  replyReview: (reviewId, replyText) =>
    API.post(`/reviews/${reviewId}/reply/`, { reply: replyText }),
};

export default reviewService;