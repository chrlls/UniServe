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

export default function POSInterface() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

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
        items: cartItems.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
      });
      clearCart();
      setOrderSuccess(order);
      // Refresh menu to get updated stock
      fetchMenu();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <CheckCircle size={64} className="text-primary" />
        <h2 className="text-2xl font-bold">Order Placed!</h2>
        <p className="text-lg font-mono text-primary">{orderSuccess.order_number}</p>
        <p className="text-muted-foreground">Total: ₱{Number(orderSuccess.total_amount).toFixed(2)}</p>
        <Button onClick={() => setOrderSuccess(null)} className="mt-4">
          New Order
        </Button>
      </div>
    );
  }

  if (loading) {
    return <POSPageSkeleton />;
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Left: Menu Browser */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="mb-4">
          <h1 className="text-xl font-bold">POS Terminal</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 shrink-0">
          <Button
            size="sm"
            variant={!selectedCategory ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full text-xs whitespace-nowrap h-7"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-full text-xs whitespace-nowrap h-7"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center py-8">
              <AlertCircle size={32} className="text-destructive" />
              <p className="text-sm mt-2 text-destructive">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {menuItems.map((item) => (
                <MenuItemCard key={item.id} item={item} showAddToCart onAddToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <Card className="w-80 lg:w-96 flex flex-col shrink-0 overflow-hidden">
        {/* Cart header */}
        <CardHeader className="px-4 py-3 border-b shrink-0">
          <h2 className="font-semibold leading-none">
            Cart{' '}
            {totalItems > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({totalItems} items)</span>
            )}
          </h2>
        </CardHeader>

        {/* Cart items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cartItems.length === 0 ? (
              <p className="text-sm text-center py-8 text-muted-foreground">
                Tap items to add them to the cart
              </p>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-primary">₱{Number(item.price).toFixed(2)}</p>
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
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    ₱{(item.price * item.quantity).toFixed(2)}
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

        {/* Cart footer */}
        {cartItems.length > 0 && (
          <CardContent className="p-4 space-y-3 border-t shrink-0">
            {/* Payment method */}
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                size="sm"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote size={15} /> Cash
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                size="sm"
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={15} /> Card
              </Button>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">₱{totalAmount.toFixed(2)}</span>
            </div>

            {/* Place Order */}
            <Button
              className="w-full"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              size="sm"
              onClick={clearCart}
            >
              Clear Cart
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
