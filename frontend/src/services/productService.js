import api from './api';

// Products Service - API untuk Produk

export const productService = {
  // Get semua produk (public access)
  getAllProducts: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/products/?${params}`);
    return response.data;
  },

  // Get product detail by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },

  // Create product baru (seller only)
  createProduct: async (data) => {
    const response = await api.post('/products/', data);
    return response.data;
  },

  // Update product (seller only, owner)
  updateProduct: async (id, data) => {
    const response = await api.put(`/products/${id}/`, data);
    return response.data;
  },

  // Delete product (seller only, owner)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}/`);
    return response.data;
  },

  // Filter products by category
  getProductsByCategory: async (category) => {
    const response = await api.get(`/products/?category=${category}`);
    return response.data;
  },

  // Search products by name
  searchProducts: async (searchTerm) => {
    const response = await api.get(`/products/?name__icontains=${searchTerm}`);
    return response.data;
  },
};

export default productService;
