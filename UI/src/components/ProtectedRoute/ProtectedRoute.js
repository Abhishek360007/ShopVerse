import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isTokenValid } from '../../utils/jwt-helper';

const ProtectedRoute = ({children}) => {
  const location = useLocation();
  if (!isTokenValid()) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/v1/login?redirect=${redirect}`} replace />;
  }
  return children;
}

export default ProtectedRoute
