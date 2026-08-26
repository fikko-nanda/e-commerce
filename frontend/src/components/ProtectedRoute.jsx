import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, requiredRole }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="text-center py-20 font-black uppercase">Memuat status login...</div>;
  }

  // 1. Jika belum login sama sekali, redirect ke Login
  if (!user || (!user.id && !user.email && Object.keys(user).length === 0)) {
    return <Navigate to="/" replace />;
  }

  // Ambil role user saat ini (default ke 'buyer' jika tidak terdefinisi)
  const userRole = (user.role || (user.is_seller ? 'seller' : 'buyer')).toLowerCase();

  // 2. Cek proteksi role spesifik HANYA JIKA props allowedRoles / requiredRole dikirimkan
  if (requiredRole && userRole !== requiredRole.toLowerCase() && !user.is_superuser) {
    alert(`Akses ditolak! Halaman ini khusus ${requiredRole}.`);
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => role.toLowerCase() === userRole) || user.is_superuser;
    if (!hasAccess) {
      alert('Akses ditolak! Anda harus mendaftar sebagai seller terlebih dahulu.');
      return <Navigate to="/seller/register" replace />;
    }
  }

  // 3. Untuk rute buyer biasa seperti /user/orders, loloskan akses tanpa halangan
  return children;
}