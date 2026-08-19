import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoginModal from './LoginModal';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <nav className="bg-white border-b-4 border-black px-6 py-4 sticky top-0 z-50 flex items-center justify-between">
        <Link to="/" className="text-3xl font-black tracking-tighter">
          WAR<span className="text-gray-400">MART</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-sm hidden md:block hover:underline">Katalog</Link>
          {user ? (
            <>
              <Link to="/user/dashboard" className="font-bold text-sm hover:underline">
                {user.email}
              </Link>
              <button 
                onClick={logout} 
                className="bg-red-600 text-white text-xs font-bold px-4 py-2 uppercase hover:bg-red-700 transition"
              >
                Keluar
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="bg-black text-white text-sm font-bold px-5 py-2.5 uppercase tracking-wider hover:bg-gray-800 transition"
            >
              Masuk
            </button>
          )}
        </div>
      </nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}