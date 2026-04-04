import { Navigate } from 'react-router-dom';
import { ADMIN_TOKEN_KEY, ADMIN_DATA_KEY, USER_TOKEN_KEY, USER_DATA_KEY } from '../api/axios';

export default function ProtectedRoute({ children }) {
  // Accept admin token from either the dedicated admin slot OR the user slot (unified login)
  const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
  const userToken  = localStorage.getItem(USER_TOKEN_KEY);

  // Check role from stored data
  let isAdmin = false;
  try {
    const adminData = localStorage.getItem(ADMIN_DATA_KEY);
    if (adminData) isAdmin = JSON.parse(adminData)?.role === 'ADMIN';
  } catch {}
  if (!isAdmin) {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      if (userData) isAdmin = JSON.parse(userData)?.role === 'ADMIN';
    } catch {}
  }

  const hasToken = !!(adminToken || userToken);

  if (!hasToken || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
