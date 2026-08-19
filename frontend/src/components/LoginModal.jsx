import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'forgot') {
      alert(`Link instruksi reset password telah dikirim ke ${email}`);
      setMode('login');
      return;
    }

    login({ email, token: 'fake-jwt-token-2026' });
    alert(mode === 'register' ? 'Registrasi berhasil!' : 'Berhasil masuk!');
    onClose();
  };

  const handleGoogleLogin = () => {
    // Simulasi Login Google OAuth
    login({ email: 'user.google@gmail.com', token: 'google-oauth-token-2026' });
    alert('Berhasil masuk dengan Google!');
    onClose();
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

        {/* Tombol Login Google (Hanya tampil pada mode Login & Register) */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black font-black py-3 px-4 uppercase text-xs tracking-wider border-2 border-black shadow-brutal hover:bg-yellow-300 flex items-center justify-center gap-3 transition mb-4 active:translate-x-0.5 active:translate-y-0.5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              Lanjutkan dengan Google
            </button>

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
              />
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-black text-white font-black py-3 uppercase tracking-wider text-xs border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition active:translate-x-0.5 active:translate-y-0.5"
          >
            {mode === 'login' && 'Masuk Sekarang'}
            {mode === 'register' && 'Buat Akun Sekarang'}
            {mode === 'forgot' && 'Kirim Link Reset'}
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
                onClick={() => setMode(mode === 'register' ? 'login' : 'register')} 
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