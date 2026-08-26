import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: sisipkan access token ke setiap request (KECUALI endpoint auth publik)
API.interceptors.request.use(
  (config) => {
    // 1. Abaikan token untuk endpoint login, register, dan refresh
    const isPublicAuthEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh') ||
      config.url?.includes('/auth/google');

    if (isPublicAuthEndpoint) {
      delete config.headers.Authorization;
      return config;
    }

    // 2. Cari token dari 'access_token' atau 'token'
    let token = localStorage.getItem('access_token') || localStorage.getItem('token');
    
    // Jika masih kosong, coba ambil dari objek user
    if (!token) {
      try {
        const warmartUser = JSON.parse(localStorage.getItem('warmart_user') || '{}');
        token = warmartUser.token || warmartUser.access_token || warmartUser.access;
      } catch {
        token = null;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: refresh token otomatis saat 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve(token)));
  failedQueue = [];
}

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const res = await axios.post('http://127.0.0.1:8000/api/v1/auth/refresh/', {
        refresh: refreshToken,
      });

      const newToken = res.data.access;
      localStorage.setItem('access_token', newToken);

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return API(originalRequest);
    } catch (err) {
      processQueue(err, null);
      console.warn('Akses ditolak / Refresh token expired (Mode Dev: Redirect diabaikan)');
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;