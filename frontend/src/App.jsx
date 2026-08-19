import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import SellerDashboard from './pages/SellerDashboard';
import UserDashboard from './pages/UserDashboard';
import ChatDrawer from './components/ChatDrawer';
import Footer from './components/Footer';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-white">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/user/dashboard" element={<UserDashboard />} />
              </Routes>
            </main>
            <Footer />
            <ChatDrawer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}