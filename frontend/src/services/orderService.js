import API from './api';

const orderService = {
  createCheckout: async (orderData) => {
    // Tentukan metode pembayaran yang sesuai enum Django ('midtrans' / 'cod')
    let selectedPayment = 'midtrans';
    const rawPayment = (orderData.paymentMethod || orderData.payment_method || '').toLowerCase();
    if (rawPayment.includes('cod') || rawPayment.includes('bayar di tempat')) {
      selectedPayment = 'cod';
    }

    const payload = {
      product_id: orderData.productId || orderData.product_id,
      quantity: Number(orderData.quantity || 1),
      payment_method: selectedPayment,
      shipping_address: orderData.address || orderData.shipping_address || 'Alamat tidak diisi',
    };

    try {
      // Panggil endpoint checkout Django
      const res = await API.post('/orders/checkout/', payload).catch(() =>
        API.post('/orders/', payload)
      );

      // Jika pembayaran Midtrans menghasilkan redirect_url
      if (res.data?.redirect_url) {
        window.location.href = res.data.redirect_url;
        return res.data;
      }

      return res.data;
    } catch (err) {
      const serverError = err.response?.data;
      console.warn('Checkout Backend Error:', serverError);

      if (err.response?.status === 503) {
        alert('⚠️ Server Key Midtrans di file .env backend belum diset! Silakan pilih pembayaran COD atau isi MIDTRANS_SERVER_KEY.');
      } else if (serverError?.error) {
        alert(`❌ Checkout Gagal: ${serverError.error}`);
      } else if (serverError?.product_id) {
        alert(`❌ Error Produk: ${serverError.product_id[0]}`);
      } else {
        alert('❌ Gagal melakukan checkout. Pastikan stok mencukupi.');
      }

      throw err;
    }
  },

  // Alias checkout untuk kompatibilitas CheckoutModal.jsx
  checkout: async (orderData) => orderService.createCheckout(orderData),

  // PENGAMBILAN DATA DENGAN EXTRACT ARRAY DARI DJANGO RESPONS
  getMyOrders: async () => {
    try {
      const res = await API.get('/orders/');
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.data || raw?.results || []);
      return { data: list };
    } catch {
      return { data: [] };
    }
  },

  // Alias getOrders agar OrderHistory.jsx tidak crash
  getOrders: async () => {
    try {
      const res = await API.get('/orders/');
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.data || raw?.results || []);
      return { data: list };
    } catch {
      return { data: [] };
    }
  },

  getStoreOrders: () => API.get('/orders/store-orders/').catch(() => ({ data: [] })),

  getOrderDetail: (id) => API.get(`/orders/${id}/`).catch(() => ({ data: null })),

  updateShipping: (id, shippingData) =>
    API.patch(`/orders/${id}/ship/`, shippingData),

  payOrder: (id) => API.post(`/orders/${id}/pay/`),

  // PERBAIKAN: Jika /success/ gagal (400/404), fallback update status via /ship/
  confirmCodPayment: async (id) => {
    try {
      return await API.post(`/orders/${id}/success/`);
    } catch {
      return await API.patch(`/orders/${id}/ship/`, { shipping_status: 'shipped' });
    }
  },
  
  markSuccess: async (id) => {
    try {
      return await API.post(`/orders/${id}/success/`);
    } catch {
      return await API.patch(`/orders/${id}/ship/`, { shipping_status: 'shipped' });
    }
  },
};

export default orderService;