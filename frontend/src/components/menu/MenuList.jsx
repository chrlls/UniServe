import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, AlertCircle, UtensilsCrossed,
  ShoppingBag, Plus, Minus, X, Utensils,
} from 'lucide-react';
import menuService from '../../services/menuService';
import categoryService from '../../services/categoryService';
import orderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';

export default function MenuList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchData() {
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery]);

  const isCustomer = user?.role === 'customer';

  async function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await orderService.create({
        payment_method: paymentMethod,
        items: cartItems.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
      });
      clearCart();
      setIsCartOpen(false);
      navigate('/orders');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDecrement(item) {
    if (item.quantity === 1) {
      removeFromCart(item.id);
    } else {
      updateQuantity(item.id, -1);
    }
  }

  const imageUrl = (item) =>
    item.image_path
      ? `${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:8000'}/storage/${item.image_path}`
      : null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Sticky header: search + cart trigger + category tabs */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isCustomer && (
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative shrink-0">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Cart
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                  <SheetTitle>Your Order</SheetTitle>
                  <SheetDescription>
                    {cartItems.length === 0
                      ? 'Your cart is empty'
                      : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
                  </SheetDescription>
                </SheetHeader>

                {cartItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-16 w-16 mb-4 opacity-20" />
                    <p className="font-medium">No items yet</p>
                    <p className="text-sm">Add some food to get started!</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="flex-1 -mx-6 px-6">
                      <div className="space-y-4 py-4">
                        {cartItems.map((item) => {
                          const url = imageUrl(item);
                          return (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                                {url
                                  ? <img src={url} alt={item.name} className="w-full h-full object-cover" />
                                  : <Utensils size={20} className="text-muted-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-sm text-primary font-semibold">
                                  ₱{(Number(item.price) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                  onClick={() => handleDecrement(item)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, 1)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                                onClick={() => removeFromCart(item.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₱{totalAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">₱{totalAmount.toFixed(2)}</span>
                      </div>

                      {/* Payment method */}
                      <div className="flex gap-2">
                        <Button size="sm" variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                          className="flex-1" onClick={() => setPaymentMethod('cash')}>
                          Cash
                        </Button>
                        <Button size="sm" variant={paymentMethod === 'gcash' ? 'default' : 'outline'}
                          className="flex-1" onClick={() => setPaymentMethod('gcash')}>
                          GCash
                        </Button>
                      </div>
                    </div>

                    <SheetFooter className="mt-3">
                      <Button className="w-full h-11" onClick={handlePlaceOrder} disabled={isSubmitting}>
                        {isSubmitting ? 'Placing Order...' : `Place Order · ₱${totalAmount.toFixed(2)}`}
                      </Button>
                    </SheetFooter>
                  </>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Category tabs */}
        <ScrollArea className="w-full">
          <Tabs value={selectedCategory === null ? '__all__' : String(selectedCategory)}
            onValueChange={(v) => setSelectedCategory(v === '__all__' ? null : Number(v))}>
            <TabsList className="h-9 w-max">
              <TabsTrigger value="__all__" className="text-sm px-4">All</TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={String(cat.id)} className="text-sm px-4">
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </ScrollArea>
      </div>

      {/* Content area */}
      <div className="flex-1 p-4">
        {loading ? (
          <LoadingSpinner message="Loading menu..." />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={48} className="text-destructive mb-4" />
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button size="sm" onClick={fetchData}>Retry</Button>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <UtensilsCrossed size={40} className="mb-4 opacity-30" />
            <p className="font-medium">No items found</p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menuItems.map((item) => {
              const isOutOfStock = !item.is_available || item.stock_quantity === 0;
              const url = imageUrl(item);
              const cartItem = cartItems.find((ci) => ci.id === item.id);

              return (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="relative aspect-[4/3] bg-muted">
                    {url ? (
                      <img
                        src={url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils size={36} className="text-muted-foreground opacity-40" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                    {item.category && (
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                        {item.category.name}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ₱{Number(item.price).toFixed(2)}
                      </span>
                      {!isOutOfStock && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {item.stock_quantity} left
                        </span>
                      )}
                    </div>

                    {isCustomer && !isOutOfStock && (
                      cartItem ? (
                        <div className="flex items-center justify-between">
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => handleDecrement(cartItem)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center font-semibold">{cartItem.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => addToCart(item)}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
