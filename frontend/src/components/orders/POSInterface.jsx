import { useState, useEffect } from 'react';
import { Search, Minus, Plus, Trash2, CreditCard, Banknote, AlertCircle, CheckCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import menuService from '../../services/menuService';
import categoryService from '../../services/categoryService';
import orderService from '../../services/orderService';
import MenuItemCard from '../menu/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { POSPageSkeleton } from '@/components/skeletons/AdminSkeletons';
import { useAccountPreferences } from '@/lib/preferences';

export default function POSInterface() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();
  const { formatNumber, t } = useAccountPreferences();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  function formatCurrency(value) {
    return `PHP ${formatNumber(value || 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMenu();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery]);

  async function fetchMenu() {
    try {
      setLoading(true);
      setError(null);
      const [items, cats] = await Promise.all([
        menuService.getAll({
          category_id: selectedCategory || undefined,
          search: searchQuery || undefined,
          is_available: true,
        }),
        categoryService.getAll(),
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const order = await orderService.create({
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      setOrderSuccess(order);
      fetchMenu();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderSuccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <CheckCircle size={64} className="text-primary" />
        <h2 className="text-2xl font-bold">{t('pos.orderPlaced')}</h2>
        <p className="text-lg font-mono text-primary">{orderSuccess.order_number}</p>
        <p className="text-muted-foreground">
          {t('pos.total')}: {formatCurrency(orderSuccess.total_amount)}
        </p>
        <Button onClick={() => setOrderSuccess(null)} className="mt-4">
          {t('pos.newOrder')}
        </Button>
      </div>
    );
  }

  if (loading) {
    return <POSPageSkeleton />;
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="mb-4">
          <h1 className="text-xl font-bold">{t('pos.title')}</h1>
        </div>

        <div className="mb-3 flex shrink-0 flex-col gap-3">
          <div className="relative w-full max-w-4xl">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('pos.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring/15"
            />
          </div>

          <div className="flex overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              <Button
                size="sm"
                variant={!selectedCategory ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                className="h-7 whitespace-nowrap rounded-full text-xs"
              >
                {t('pos.all')}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-7 whitespace-nowrap rounded-full text-xs"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center py-8">
              <AlertCircle size={32} className="text-destructive" />
              <p className="mt-2 text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {menuItems.map((item) => (
                <MenuItemCard key={item.id} item={item} showAddToCart onAddToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="flex w-80 shrink-0 flex-col overflow-hidden lg:w-96">
        <CardHeader className="shrink-0 border-b px-4 py-3">
          <h2 className="font-semibold leading-none">
            {t('pos.cart')}{' '}
            {totalItems > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {t('pos.cartItemsCount', { count: totalItems })}
              </span>
            )}
          </h2>
        </CardHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-3 p-4">
            {cartItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('pos.emptyCart')}
              </p>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/40 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-primary">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus size={12} />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                  <span className="w-20 text-right text-sm font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {cartItems.length > 0 && (
          <CardContent className="shrink-0 space-y-3 border-t p-4">
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                size="sm"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote size={15} /> {t('pos.payment.cash')}
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                size="sm"
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={15} /> {t('pos.payment.card')}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">{t('pos.total')}</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('pos.placingOrder') : t('pos.placeOrder')}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              size="sm"
              onClick={clearCart}
            >
              {t('pos.clearCart')}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
