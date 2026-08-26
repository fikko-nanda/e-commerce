import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';

import Navbar from './components/Navbar';
import ChatDrawer from './components/ChatDrawer';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/public/Home';
import ProductDetail from './pages/public/ProductDetail';
import NotFound from './pages/public/NotFound';
import StoreProfile from './pages/public/StoreProfile';

import SellerDashboard from './pages/seller/SellerDashboard';
import RegisterSeller from './pages/seller/RegisterSeller';

import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';
import OrderHistory from './pages/user/OrderHistory';
import UserChat from './pages/user/UserChat';
import AdminDashboard from './pages/admin/AdminDashboard';

function AppContent() {
  const { user } = useContext(AuthContext) || {};

  const isLoggedIn = Boolean(
    user && (user.id || user.email || Object.keys(user).length > 0)
  );

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/store/:storeName" element={<StoreProfile />} />

            {/* USER ROUTES */}
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/chat" element={<UserChat />} />
            <Route
              path="/user/orders"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />

            {/* SELLER ROUTES */}
            <Route path="/seller/register" element={<RegisterSeller />} />
            <Route
              path="/seller/*"
              element={
                <ProtectedRoute allowedRoles={['seller', 'admin']}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ROUTES */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 NOT FOUND */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />

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