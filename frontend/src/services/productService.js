import API from './api';

const productService = {
  /** GET /products/ — daftar semua produk aktif. Support ?category=<kat> */
  getAll: (category) => {
    let url = '/products/';
    if (category && category !== 'all') {
      url += `?category=${category}`;
    }
    return API.get(url);
  },

  /** GET /products/?mine=true — daftar produk milik toko saya */
  getMyProducts: () => API.get('/products/?mine=true'),

  /** GET /products/<id>/ — detail satu produk */
  getDetail: (id) => API.get(`/products/${id}/`),

  /** POST /products/ — tambah produk baru (JSON atau FormData untuk gambar) */
  create: (data) => {
    const isFormData = data instanceof FormData;
    return API.post('/products/', data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {});
  },

  /** PUT /products/<id>/ — update produk (JSON atau FormData) */
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    return API.put(`/products/${id}/`, data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {});
  },

  /** DELETE /products/<id>/ — hapus produk */
  delete: (id) => API.delete(`/products/${id}/`),
};

export default productService;