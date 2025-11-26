import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';

function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) {
  const { state } = useAuth();
  const location = useLocation();

  // If authentication is required but user is not authenticated
  if (requireAuth && !state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but doesn't have the required role
  if (state.isAuthenticated && state.user && allowedRoles.length > 0) {
    if (!allowedRoles.includes(state.user.role)) {
      // Redirect to appropriate dashboard based on user's actual role
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
