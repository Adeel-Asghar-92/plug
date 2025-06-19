// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (adminOnly && user.email !== process.env.REACT_APP_ADMIN_EMAIL) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;