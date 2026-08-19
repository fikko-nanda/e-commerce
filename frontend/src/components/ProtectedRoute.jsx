import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useContext(AuthContext);

  // Jika belum login, lempar ke halaman depan
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Jika butuh role spesifik (misal: 'seller') tapi role user tidak sesuai
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}