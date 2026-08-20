import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';

import Navbar from './components/Navbar';
import ChatDrawer from './components/ChatDrawer';
import Footer from './components/Footer';

import Home from './pages/public/Home';
import ProductDetail from './pages/public/ProductDetail';
import NotFound from './pages/public/NotFound';
import StoreProfile from './pages/public/StoreProfile';

import SellerDashboard from './pages/seller/SellerDashboard';
import UserDashboard from './pages/user/UserDashboard';

function AppContent() {
  const { user } = useContext(AuthContext);
  const isLoggedIn = Boolean(user && (user.id || user.email || Object.keys(user).length > 0));

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/seller" element={<SellerDashboard />} />
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/store/:storeName" element={<StoreProfile />} />
          </Routes>
        </main>
        <Footer />
        
        {/* 🔴 ChatDrawer HANYA muncul jika user sudah login */}
        {isLoggedIn && <ChatDrawer />}
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ChatProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ChatProvider>
      </CartProvider>
    </AuthProvider>
  );
}