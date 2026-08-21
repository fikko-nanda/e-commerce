import API from './api';

const productService = {
  getAll: (params) => API.get('/products/', { params }),
  getById: (id) => API.get(`/products/${id}/`),
  getMyProducts: () => API.get('/products/my-products/'),
  create: (formData) =>
    API.post('/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    API.put(`/products/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => API.delete(`/products/${id}/`),
};

export default productService;