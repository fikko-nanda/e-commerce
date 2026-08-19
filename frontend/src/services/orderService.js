import api from './api';

// Orders Service - API untuk Order/Pesanan

export const orderService = {
  // Checkout / Buat pesanan baru
  checkout: async (data) => {
    const response = await api.post('/orders/checkout/', data);
    return response.data;
  },

  // Get all my orders (buyer)
  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders/');
    return response.data;
  },

  // Get order detail by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },

  // Get store's orders (seller view)
  getStoreOrders: async () => {
    const response = await api.get('/orders/store-orders/');
    return response.data;
  },

  // Update shipping status (seller)
  updateShippingStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/`, { shipping_status: status });
    return response.data;
  },

  // Cancel order (buyer)
  cancelOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/cancel/`);
    return response.data;
  },
};

export default orderService;
