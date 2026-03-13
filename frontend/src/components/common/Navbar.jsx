import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Menu, LogOut, ShoppingCart } from 'lucide-react';

export default function Navbar({ onMenuClick, onCartClick }) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  const roleLabel =
    user?.role === 'admin' ? 'Administrator' :
    user?.role === 'cashier' ? 'Cashier' : 'Customer';

  return (
    <nav
      className="h-16 px-4 flex items-center justify-between shrink-0"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left — hamburger + mobile logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg cursor-pointer transition-colors btn-ghost"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Desktop page label */}
        <div className="hidden lg:flex flex-col">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Campus Canteen
          </span>
          <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
            Management System
          </span>
        </div>

        {/* Mobile brand */}
        <div className="lg:hidden font-bold text-lg tracking-tight" style={{ color: 'var(--color-text)' }}>
          UniServe<span style={{ color: 'var(--color-accent)' }}>.</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Cart — customers only */}
        {user?.role === 'customer' && (
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-lg cursor-pointer transition-colors btn-ghost"
            aria-label="Open cart"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center animate-scale-in"
                style={{ backgroundColor: 'var(--color-accent)', color: '#FFFFFF' }}
              >
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </button>
        )}

        {/* Divider */}
        <div
          className="hidden sm:block h-6 w-px mx-1"
          style={{ backgroundColor: 'var(--color-border-subtle)' }}
        />

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{
              backgroundColor: 'var(--color-accent-dim)',
              color: 'var(--color-accent)',
              border: '1.5px solid var(--color-accent)',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {user?.name}
            </span>
            <span className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-lg cursor-pointer transition-all ml-1"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-error-bg)';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
