import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import GoogleTranslate from './GoogleTranslate';
import LoginModal from './LoginModal';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext) || {};
  const { totalItems = 0 } = useContext(CartContext) || {};
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsProfileOpen(false);
    if (logout) logout();
    navigate('/');
  };

  return (
    <>
      <nav className="bg-white border-b-4 border-black px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <Link to="/" className="text-3xl font-black tracking-tighter hover:opacity-80 transition">
          WAR<span className="bg-yellow-300 px-1 border-2 border-black shadow-brutal">MART</span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Tombol Kustom Auto-Translate */}
          <GoogleTranslate />

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="bg-red-500 text-white font-black text-xs uppercase border-2 border-black px-3 py-2 shadow-brutal hover:bg-black transition"
            >
              🛡️ Admin
            </Link>
          )}

          <Link
            to="/seller"
            className="bg-purple-400 font-black text-xs uppercase border-2 border-black px-3 py-2 shadow-brutal hover:bg-black hover:text-white transition"
          >
            🏬 Mode Penjual
          </Link>

          <button 
            type="button"
            onClick={() => setIsCartOpen(true)} 
            className="font-black text-xs uppercase bg-yellow-300 border-2 border-black px-3 py-2 flex items-center gap-2 shadow-brutal hover:bg-black hover:text-yellow-300 transition cursor-pointer"
          >
            🛒 Keranjang
            {totalItems > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 border border-black">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="font-black text-xs uppercase bg-gray-100 border-2 border-black px-3 py-2 shadow-brutal hover:bg-yellow-300 transition flex items-center gap-2 cursor-pointer"
              >
                👤 {user.first_name || user.username || user.email?.split('@')[0]}
              </button>

              {isProfileOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white border-4 border-black shadow-brutal-lg z-50"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <div className="p-3 border-b-2 border-black bg-yellow-100">
                    <p className="text-[10px] font-black uppercase text-gray-600">Email Akun</p>
                    <p className="text-xs font-black truncate">{user.email}</p>
                  </div>

                  <Link 
                    to="/user/orders" 
                    className="block px-4 py-2.5 text-xs font-black uppercase hover:bg-yellow-300 border-b-2 border-black transition"
                  >
                    📦 Pesanan Saya & Lacak
                  </Link>

                  <Link 
                    to="/user/dashboard" 
                    className="block px-4 py-2.5 text-xs font-black uppercase hover:bg-yellow-300 border-b-2 border-black transition"
                  >
                    📊 Dashboard Saya
                  </Link>

                  <Link 
                    to="/profile" 
                    className="block px-4 py-2.5 text-xs font-black uppercase hover:bg-yellow-300 border-b-2 border-black transition"
                  >
                    ⚙️ Pengaturan Profil
                  </Link>

                  <button 
                    type="button"
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-2.5 text-xs font-black uppercase text-red-600 hover:bg-red-500 hover:text-white transition cursor-pointer"
                  >
                    🚪 Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="bg-black text-white text-xs font-black px-4 py-2 uppercase border-2 border-black shadow-brutal hover:bg-yellow-400 hover:text-black transition"
            >
              Masuk
            </button>
          )}
        </div>
      </nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}