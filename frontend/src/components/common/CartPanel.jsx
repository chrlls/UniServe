import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import orderService from '../../services/orderService';

export default function CartPanel({ isOpen, onClose }) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    try {
      setSubmitting(true);
      setError(null);
      const order = await orderService.create({
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      onClose();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transform transition-transform duration-200 ease-in-out flex flex-col border-l ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="h-16 flex items-center justify-between px-6 border-b shrink-0"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface)' }}
        >
          <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
            My Cart ({totalItems})
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors cursor-pointer"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} style={{ color: 'var(--color-border-subtle)' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Your cart is empty. Browse the menu to add items.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-border-subtle)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
                    ₱{Number(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) {
                        removeFromCart(item.id);
                      } else {
                        updateQuantity(item.id, -1);
                      }
                    }}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                    style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                  >
                    {item.quantity <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                  </button>
                  <span className="text-sm font-semibold w-6 text-center" style={{ color: 'var(--color-text)' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                    style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="text-sm font-bold w-20 text-right" style={{ color: 'var(--color-text)' }}>
                  ₱{(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer — only when cart has items */}
        {cartItems.length > 0 && (
          <div
            className="border-t p-4 space-y-4 shrink-0"
            style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface)' }}
          >
            {error && (
              <p className="text-xs p-2 rounded-lg" style={{ color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                {error}
              </p>
            )}

            {/* Payment method */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pay with:</span>
              {['cash', 'card'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer"
                  style={{
                    backgroundColor: paymentMethod === method ? 'var(--color-accent)' : 'var(--color-input-bg)',
                    color: paymentMethod === method ? '#FFFFFF' : 'var(--color-text-secondary)',
                    border: `1px solid ${paymentMethod === method ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
                  }}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Total + actions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total</p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  ₱{totalAmount.toFixed(2)}
                </p>
              </div>
              <button
                onClick={clearCart}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
              >
                Clear All
              </button>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-accent)', color: '#FFFFFF' }}
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
