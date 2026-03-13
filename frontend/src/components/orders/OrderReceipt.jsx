import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Clock, CheckCircle, XCircle, ChefHat } from 'lucide-react';
import orderService from '../../services/orderService';
import LoadingSpinner from '../common/LoadingSpinner';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: 'rgba(234,179,8,0.1)',   color: '#eab308', icon: Clock },
  preparing: { label: 'Preparing', bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', icon: ChefHat },
  ready:     { label: 'Ready',     bg: 'rgba(74,222,128,0.1)',  color: '#4ade80', icon: CheckCircle },
  completed: { label: 'Completed', bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', icon: CheckCircle },
  cancelled: { label: 'Cancelled', bg: 'rgba(248,113,113,0.1)', color: '#f87171', icon: XCircle },
};

export default function OrderReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading order..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle size={48} style={{ color: 'var(--color-error)' }} className="mb-4" />
        <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!order) return null;

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm print:hidden"
          style={{ border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
        >
          <Printer size={16} /> Print
        </button>
      </div>

      {/* Receipt Card */}
      <div className="rounded-xl p-6 space-y-6" style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border-subtle)' }}>
        {/* Order info */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text)' }}>
            {order.order_number}
          </h1>
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            <StatusIcon size={14} />
            {config.label}
          </span>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {new Date(order.ordered_at).toLocaleString()}
          </p>
        </div>

        {/* Customer / Cashier info */}
        <div className="grid grid-cols-2 gap-4 text-sm" style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
          <div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Customer</p>
            <p className="font-medium" style={{ color: 'var(--color-text)' }}>{order.customer?.name || 'Walk-in'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Cashier</p>
            <p className="font-medium" style={{ color: 'var(--color-text)' }}>{order.cashier?.name || '—'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Payment</p>
            <p className="font-medium capitalize" style={{ color: 'var(--color-text)' }}>{order.payment_method}</p>
          </div>
        </div>

        {/* Items table */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Item</th>
                <th className="text-center py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Qty</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Price</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                  <td className="py-2" style={{ color: 'var(--color-text)' }}>{item.menu_item?.name || `Item #${item.menu_item_id}`}</td>
                  <td className="py-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>{item.quantity}</td>
                  <td className="py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>₱{Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-2 text-right font-medium" style={{ color: 'var(--color-text)' }}>₱{Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '2px solid var(--color-border-subtle)' }}>
          <span className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Total</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
            ₱{Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
