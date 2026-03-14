import { Utensils, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccountPreferences } from '@/lib/preferences';

export default function MenuItemCard({ item, onAddToCart, showAddToCart = false }) {
  const { formatNumber, t } = useAccountPreferences();
  const isOutOfStock = !item.is_available || item.stock_quantity === 0;
  const imageUrl = item.image_path
    ? `${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:8000'}/storage/${item.image_path}`
    : null;
  const priceLabel = `PHP ${formatNumber(item.price || 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = 'rgba(74,222,128,0.25)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'var(--color-border-subtle)';
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: 'var(--color-input-bg)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Utensils size={48} style={{ color: 'var(--color-border-subtle)' }} />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-400">
              {t('menu.outOfStock')}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {item.category && (
          <span
            className="self-start rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {item.category.name}
          </span>
        )}

        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {item.name}
        </h3>

        {item.description && (
          <p
            className="line-clamp-2 text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
            {priceLabel}
          </span>

          {!isOutOfStock && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {t('menu.stockLeft', { count: item.stock_quantity })}
            </span>
          )}
        </div>

        {showAddToCart && !isOutOfStock && (
          <Button
            onClick={() => onAddToCart(item)}
            className="mt-2 h-10 w-full rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              backgroundColor: 'var(--color-accent)',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = 'var(--color-accent-hover)';
              event.currentTarget.style.boxShadow = '0 4px 12px rgba(74,222,128,0.25)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'var(--color-accent)';
              event.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ShoppingCart size={16} />
            {t('menu.addToCart')}
          </Button>
        )}
      </div>
    </div>
  );
}
