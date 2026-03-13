import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// roleRedirects: where to send each role after login
const roleRedirects = {
  admin: '/admin/dashboard',
  cashier: '/cashier/pos',
  customer: '/menu',
};

/**
 * Wraps a route so it requires auth + an allowed role.
 * allowedRoles defaults to all roles (auth-only guard).
 */
export default function ProtectedRoute({ children, allowedRoles = ['admin', 'cashier', 'customer'] }) {
  const { user, loading } = useAuth();

  // Still checking token from localStorage — render nothing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen"
           style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their correct home instead of a raw 403
    return <Navigate to={roleRedirects[user.role] ?? '/login'} replace />;
  }

  return children;
}
