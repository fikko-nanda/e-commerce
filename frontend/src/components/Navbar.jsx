import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import LoginModal from './LoginModal';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { totalItems } = useContext(CartContext);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <nav className="bg-white border-b-4 border-black px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <Link to="/" className="text-3xl font-black tracking-tighter hover:opacity-80 transition">
          WAR<span className="bg-yellow-300 px-1 border-2 border-black shadow-brutal">MART</span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Tombol Pintas ke Seller Dashboard */}
          <Link 
            to="/seller" 
            className="bg-purple-400 font-black text-xs uppercase border-2 border-black px-3 py-2 shadow-brutal hover:bg-black hover:text-white transition"
          >
            🏬 Mode Penjual
          </Link>

          {/* Tombol Keranjang */}
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="font-black text-xs uppercase bg-yellow-300 border-2 border-black px-3 py-2 flex items-center gap-2 shadow-brutal"
          >
            🛒 Keranjang
            {totalItems > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 border border-black">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/user/dashboard" 
                className="font-black text-xs uppercase bg-gray-100 border-2 border-black px-3 py-2 shadow-brutal"
              >
                👤 {user.email.split('@')[0]}
              </Link>
              <button 
                onClick={logout} 
                className="bg-red-500 text-white text-xs font-black px-3 py-2 uppercase border-2 border-black shadow-brutal"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button 
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