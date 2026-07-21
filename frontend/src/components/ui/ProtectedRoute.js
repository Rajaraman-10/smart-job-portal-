import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ isAuthenticated, userType, allowedRole }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && allowedRole !== userType) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
