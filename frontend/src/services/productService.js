import API from './api';

const productService = {
  getAll: (params) => {
    const query = typeof params === 'string' 
      ? (params !== 'all' ? { category: params } : {}) 
      : params;
    return API.get('/products/', { params: query }).catch(() => ({ data: [] }));
  },

  // Alias untuk kemudahan panggilan
  getProducts: (params) => {
    const query = typeof params === 'string' 
      ? (params !== 'all' ? { category: params } : {}) 
      : params;
    return API.get('/products/', { params: query }).catch(() => ({ data: [] }));
  },

  getById: (id) => API.get(`/products/${id}/`).catch(() => ({ data: null })),
  getDetail: (id) => API.get(`/products/${id}/`).catch(() => ({ data: null })),

  getMyProducts: async () => {
    try {
      const res = await API.get('/products/?mine=true');
      const rawList = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.results || res.data?.data || []);
      
      return { data: rawList };
    } catch (err) {
      console.warn('Gagal memuat produk seller dari backend, fallback ke local storage:', err);
      const localProducts = JSON.parse(localStorage.getItem('warmart_local_products') || '[]');
      return { data: localProducts };
    }
  },

  create: async (formData) => {
    try {
      return await API.post('/products/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      if (err.response?.status === 403) {
        alert('🚫 AKSES DITOLAK: Toko Anda perlu disetujui (AKTIF) oleh Admin untuk mengunggah produk.');
      }
      throw err;
    }
  },

  update: (id, formData) =>
    API.put(`/products/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id) => API.delete(`/products/${id}/`),
  deleteProduct: (id) => API.delete(`/products/${id}/`),
};

export default productService;