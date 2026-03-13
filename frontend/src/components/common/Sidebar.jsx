import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Utensils, Users,
  ClipboardList, PieChart, X, ChefHat,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getLinksForRole = (role) => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard',  path: '/admin/dashboard',  icon: LayoutDashboard },
          { name: 'Menu',       path: '/admin/menu',       icon: Utensils },
          { name: 'Orders',     path: '/admin/orders',     icon: ClipboardList },
          { name: 'Inventory',  path: '/admin/inventory',  icon: ShoppingCart },
          { name: 'Users',      path: '/admin/users',      icon: Users },
          { name: 'Reports',    path: '/admin/reports',    icon: PieChart },
        ];
      case 'cashier':
        return [
          { name: 'POS Terminal', path: '/cashier/pos',    icon: ShoppingCart },
          { name: 'Order Queue',  path: '/cashier/orders', icon: ClipboardList },
          { name: 'Menu',         path: '/menu',            icon: Utensils },
        ];
      case 'customer':
      default:
        return [
          { name: 'Browse Menu', path: '/menu',    icon: Utensils },
          { name: 'My Orders',   path: '/orders',  icon: ClipboardList },
        ];
    }
  };

  const links = getLinksForRole(user?.role);

  function handleNav(path) {
    if (window.innerWidth < 1024) onClose();
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(path));
    } else {
      navigate(path);
    }
  }

  const roleLabel = user?.role === 'admin'
    ? 'Administrator'
    : user?.role === 'cashier'
    ? 'Cashier'
    : 'Customer';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ease-in-out`}
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderRight: '1px solid var(--color-border-subtle)',
          transform: isOpen ? 'translateX(0)' : undefined,
        }}
        data-open={isOpen}
        aria-hidden={!isOpen}
      >
        <style>{`
          @media (max-width: 1023px) {
            aside[data-open="false"] { transform: translateX(-100%); }
            aside[data-open="true"]  { transform: translateX(0); }
          }
        `}</style>

        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-5"
          style={{
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <button
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => handleNav(links[0]?.path ?? '/')}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}
            >
              <ChefHat size={16} style={{ color: '#FFFFFF' }} />
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--color-text)' }}>
              UniServe<span style={{ color: 'var(--color-accent)' }}>.</span>
            </span>
          </button>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg cursor-pointer transition-colors btn-ghost"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-1">
          <p
            className="px-3 text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Navigation
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path ||
              (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 w-full text-left"
                style={{
                  backgroundColor: isActive ? 'var(--color-accent-dim)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  borderLeft: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-primary-subtle)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon
                  size={17}
                  style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                />
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div
          className="p-3"
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: 'var(--color-border-subtle)', borderRadius: '0.75rem' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
              style={{
                backgroundColor: 'var(--color-accent-dim)',
                color: 'var(--color-accent)',
                border: '1.5px solid var(--color-accent)',
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm font-semibold leading-none truncate"
                style={{ color: 'var(--color-text)' }}
              >
                {user?.name}
              </span>
              <span
                className="text-xs mt-1 truncate"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

