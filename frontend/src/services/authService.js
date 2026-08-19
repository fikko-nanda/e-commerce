import api from './api';

// Auth Service - API untuk Authentication (Login, Register, Profile)

export const authService = {
  // Register akun baru
  register: async (data) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  // Login dengan email/password
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  // Refresh token JWT
  refreshToken: async () => {
    const response = await api.post('/auth/refresh/');
    return response.data;
  },

  // Get profile user yang sedang login
  getProfile: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // Update profile user
  updateProfile: async (data) => {
    const response = await api.put('/auth/me/', data);
    return response.data;
  },

  // Google Login (optional)
  googleLogin: async (token) => {
    const response = await api.post('/auth/google/', { token });
    return response.data;
  },

  // Logout (hapus token dari localStorage)
  logout: () => {
    localStorage.removeItem('access_token');
  },
};

export default authService;
