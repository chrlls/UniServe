import { Utensils, ShoppingCart } from 'lucide-react';

export default function MenuItemCard({ item, onAddToCart, showAddToCart = false }) {
  const isOutOfStock = !item.is_available || item.stock_quantity === 0;
  const imageUrl = item.image_path
    ? `${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:8000'}/storage/${item.image_path}`
    : null;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group"
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(74,222,128,0.25)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: 'var(--color-input-bg)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils size={48} style={{ color: 'var(--color-border-subtle)' }} />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-500/20 text-red-400">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {item.category && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full self-start"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary-dark)' }}
          >
            {item.category.name}
          </span>
        )}

        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
          {item.name}
        </h3>

        {item.description && (
          <p
            className="text-xs line-clamp-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
            ₱{Number(item.price).toFixed(2)}
          </span>

          {!isOutOfStock && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {item.stock_quantity} left
            </span>
          )}
        </div>

        {showAddToCart && !isOutOfStock && (
          <button
            onClick={() => onAddToCart(item)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-primary-dark)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(74,222,128,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
