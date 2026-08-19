import { useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'forgot') {
      alert(`Link instruksi reset password telah dikirim ke ${email}`);
      setMode('login');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        // Buat akun baru: backend butuh username, ambil dari bagian email sebelum '@'
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 30) || 'user';
        await API.post('/auth/register/', { email, password, username });
      }

      // Login untuk dapat token JWT
      const res = await API.post('/auth/login/', { email, password });
      const { access, refresh } = res.data;

      // Ambil profil user
      const profile = await API.get('/auth/me/', {
        headers: { Authorization: `Bearer ${access}` },
      });

      login(access, refresh, profile.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Email atau password salah.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setError('');
    setLoading(true);
    try {
      // Kirim credential (ID Token JWT dari Google) ke backend untuk diverifikasi
      const res = await API.post('/auth/google/', { token: credential });
      const { access_token, refresh_token, user } = res.data;

      login(access_token, refresh_token, user);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error ||
                  err.message ||
                  'Login Google gagal.';
      setError(msg);
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black p-8 max-w-md w-full relative shadow-brutal-lg">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-xl font-black bg-red-500 text-white px-2.5 py-0.5 border-2 border-black hover:bg-black transition"
        >
          ✕
        </button>

        <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 border-b-4 border-black pb-2">
          {mode === 'login' && 'Masuk Akun'}
          {mode === 'register' && 'Daftar Akun'}
          {mode === 'forgot' && 'Lupa Password'}
        </h3>

        {error && (
          <div className="bg-red-100 border-2 border-red-600 text-red-700 font-bold text-xs p-3 mb-4">
            {error}
          </div>
        )}

        {/* Tombol Login Google (Google Identity Services v2.0) */}
        {mode !== 'forgot' && (
          <>
            <GoogleLoginButton
              onSuccess={handleGoogleLogin}
              onError={(msg) => { setError(msg); setLoading(false); }}
            />

            <div className="flex items-center my-4">
              <div className="flex-1 border-b-2 border-black"></div>
              <span className="px-3 font-black text-[10px] uppercase bg-yellow-300 border-2 border-black mx-2 shadow-brutal">
                Atau Manual
              </span>
              <div className="flex-1 border-b-2 border-black"></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-xs focus:outline-none"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black uppercase">Kata Sandi</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-black uppercase text-red-600 hover:underline"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-xs focus:outline-none"
                required
                minLength={mode === 'register' ? 6 : undefined}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white font-black py-3 uppercase tracking-wider text-xs border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition active:translate-x-0.5 active:translate-y-0.5 disabled:bg-gray-300"
          >
            {loading && 'Memproses...'}
            {!loading && mode === 'login' && 'Masuk Sekarang'}
            {!loading && mode === 'register' && 'Buat Akun Sekarang'}
            {!loading && mode === 'forgot' && 'Kirim Link Reset'}
          </button>
        </form>

        {/* Navigasi Bawah */}
        <div className="mt-6 border-t-2 border-black pt-4 text-center">
          {mode === 'forgot' ? (
            <button 
              onClick={() => setMode('login')} 
              className="text-xs font-black uppercase underline hover:text-red-600"
            >
              ← Kembali ke Halaman Masuk
            </button>
          ) : (
            <p className="text-xs font-bold">
              {mode === 'register' ? 'Sudah punya akun?' : 'Belum punya akun?'} {' '}
              <button 
                onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }} 
                className="font-black underline uppercase text-red-600 hover:text-black"
              >
                {mode === 'register' ? 'Masuk di sini' : 'Daftar di sini'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}