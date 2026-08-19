import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('buyer@example.com');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulasi Google OAuth sesuai API documentation
      const response = await API.post('/auth/google-auth/', {
        email: email,
        google_id: `google-user-${Date.now()}`
      });

      login(response.data.access_token, response.data.user);
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Login gagal:', error);
      alert('Gagal melakukan login. Pastikan server Django berjalan.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black p-8 max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-xl font-black hover:text-red-600"
        >
          ✕
        </button>

        <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Masuk ke WarMart</h3>
        <p className="text-sm font-semibold text-gray-500 mb-6">
          Simulasi instant login menggunakan Google OAuth.
        </p>

        <form onSubmit={handleGoogleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Email Pembeli</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-black p-3 text-sm font-bold focus:outline-none focus:bg-white"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white font-black py-3 uppercase tracking-wider hover:bg-gray-800 transition disabled:bg-gray-400"
          >
            {loading ? 'Memproses...' : 'Lanjut dengan Google'}
          </button>
        </form>
      </div>
    </div>
  );
}