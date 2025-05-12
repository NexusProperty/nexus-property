import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  requiredRole?: 'agent' | 'customer' | 'admin';
}

/**
 * A component that protects routes by checking authentication and optional role requirements
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  // Show a loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required, check if the user has the required role
  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to unauthorized page or dashboard depending on your app's flow
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has required role (if specified), render the protected content
  return <Outlet />;
};

export default ProtectedRoute; 