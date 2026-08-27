import { createContext, useState, useEffect, useRef } from 'react';

export const AuthContext = createContext(null);

function getStoredToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('token') || null;
}

// Decode JWT payload (tanpa verifikasi, hanya baca exp)
function decodeExp(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    return payload.exp ? payload.exp * 1000 : null; // detik -> ms
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  });

  const [token, setToken] = useState(() => getStoredToken());
  const logoutRef = useRef(null);

  // Sinkronkan state token jika localStorage berubah (mis. interceptor refresh)
  useEffect(() => {
    const sync = () => setToken(getStoredToken());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('warmart_user');
    localStorage.removeItem('warmart_chat_unread');
    if (logoutRef.current) {
      clearTimeout(logoutRef.current);
      logoutRef.current = null;
    }
  };

  // Auto-logout saat token habis (dari exp JWT)
  useEffect(() => {
    const t = getStoredToken();
    if (!t) return;

    const exp = decodeExp(t);
    if (!exp) return;

    const now = Date.now();
    if (exp <= now) {
      logout();
      return;
    }

    const delay = exp - now;
    logoutRef.current = setTimeout(() => logout(), delay);

    return () => {
      if (logoutRef.current) {
        clearTimeout(logoutRef.current);
        logoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
