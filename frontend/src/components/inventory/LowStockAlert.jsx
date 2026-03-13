import { AlertTriangle } from 'lucide-react';

export default function LowStockAlert({ items, onViewLowStock }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl"
      style={{ backgroundColor: 'var(--color-error-bg)', border: '1px solid rgba(248,113,113,0.2)' }}
    >
      <AlertTriangle size={20} style={{ color: 'var(--color-error)' }} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
          {items.length} item{items.length !== 1 ? 's' : ''} running low on stock
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {items.slice(0, 3).map((i) => i.name).join(', ')}
          {items.length > 3 ? ` and ${items.length - 3} more` : ''}
        </p>
      </div>
      {onViewLowStock && (
        <button
          onClick={onViewLowStock}
          className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: 'var(--color-error)' }}
        >
          View All
        </button>
      )}
    </div>
  );
}
