import { createContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [loading, setLoading] = useState(true);
  const [initiated, setInitiated] = useState(false); // Track if validation has run

  // Validate token on mount (hanya sekali saat aplikasi load)
  useEffect(() => {
    if (initiated) return; // Skip jika sudah dijalankan
    setInitiated(true);

    const savedToken = localStorage.getItem('access_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    
    API.get('/auth/me/')
      .then((res) => {
        setUser(res.data);
        setToken(savedToken);
      })
      .catch((err) => {
        // Ignore 401 errors during init - user may not be logged in yet
        if (err.response?.status !== 401) {
          console.error('Auth context fetch failed:', err);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};