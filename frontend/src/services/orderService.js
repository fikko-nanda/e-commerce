import API from './api';

const orderService = {
  getStoreOrders: () => API.get('/orders/seller-orders/'),
  updateShipping: (orderId, data) =>
    API.patch(`/orders/${orderId}/shipping/`, data),
  createOrder: (data) => API.post('/orders/', data),
  getMyOrders: () => API.get('/orders/my-orders/'),
};

export default orderService;