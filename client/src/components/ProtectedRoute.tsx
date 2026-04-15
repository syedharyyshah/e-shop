import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('user' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles = ['user', 'admin'] }: ProtectedRouteProps) {
  const location = useLocation();
  
  // Check for user token
  const userToken = localStorage.getItem('userToken');
  const adminToken = localStorage.getItem('adminToken');
  
  const isUserLoggedIn = !!userToken;
  const isAdminLoggedIn = !!adminToken;
  
  // If no one is logged in, redirect to login
  if (!isUserLoggedIn && !isAdminLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role permissions
  if (allowedRoles.includes('admin') && isAdminLoggedIn) {
    return <>{children}</>;
  }
  
  if (allowedRoles.includes('user') && isUserLoggedIn) {
    return <>{children}</>;
  }
  
  // If role doesn't match, redirect to appropriate login
  if (isAdminLoggedIn && !allowedRoles.includes('admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  if (isUserLoggedIn && !allowedRoles.includes('user')) {
    return <Navigate to="/" replace />;
  }
  
  return <Navigate to="/login" replace />;
}
