import API from './api';

const orderService = {
  /** POST /orders/checkout/ — buat pesanan baru. Return {order, snap_token, redirect_url} */
  checkout: (data) => API.post('/orders/checkout/', data),

  /** GET /orders/ — daftar pesanan pembeli yang login */
  getMyOrders: () => API.get('/orders/'),

  /** GET /orders/store-orders/ — daftar pesanan masuk ke toko seller */
  getStoreOrders: () => API.get('/orders/store-orders/'),

  /** GET /orders/<id>/ — detail satu pesanan */
  getDetail: (id) => API.get(`/orders/${id}/`),

  /** PATCH /orders/<id>/ship/ — seller update resi & status pengiriman */
  updateShipping: (id, data) => API.patch(`/orders/${id}/ship/`, data),

  /** POST /orders/<id>/pay/ — regenerate snap token Midtrans untuk order pending */
  pay: (id) => API.post(`/orders/${id}/pay/`),
};

export default orderService;