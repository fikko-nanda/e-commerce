import API from './api';

const authService = {
  /** POST /auth/register/ — daftar user baru. Return {user, access_token, refresh_token} */
  register: (data) => API.post('/auth/register/', data),

  /** POST /auth/login/ — login manual. Return {user, access_token, refresh_token} */
  login: (data) => API.post('/auth/login/', data),

  /** POST /auth/google/ — login via Google. Return {user, access_token, refresh_token} */
  googleLogin: (data) => API.post('/auth/google/', data),

  /** POST /auth/refresh/ — refresh access token. Return {access} */
  refresh: (refreshToken) => API.post('/auth/refresh/', { refresh: refreshToken }),

  /** GET /auth/me/ — profil user aktif */
  getMe: () => API.get('/auth/me/'),

  /** PATCH /auth/me/ — update profil user */
  updateMe: (data) => API.patch('/auth/me/', data),
};

export default authService;