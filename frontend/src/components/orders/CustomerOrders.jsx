import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, ChefHat, Package, CheckCircle2, XCircle,
  ShoppingBag, AlertCircle, RefreshCw, ArrowRight,
} from 'lucide-react';
import orderService from '../../services/orderService';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const STATUS_CONFIG = {
  pending:   { label: 'Order Placed',     icon: Clock,         color: 'text-amber-500',        bgColor: 'bg-amber-500/10',        badgeClass: 'bg-amber-500/10 text-amber-600 border-0', step: 1 },
  preparing: { label: 'Preparing',        icon: ChefHat,       color: 'text-primary',           bgColor: 'bg-primary/10',          badgeClass: 'bg-primary/10 text-primary border-0',     step: 2 },
  ready:     { label: 'Ready for Pickup', icon: Package,       color: 'text-emerald-500',       bgColor: 'bg-emerald-500/10',      badgeClass: 'bg-emerald-500/10 text-emerald-600 border-0', step: 3 },
  completed: { label: 'Completed',        icon: CheckCircle2,  color: 'text-muted-foreground',  bgColor: 'bg-muted',               badgeClass: 'bg-muted text-muted-foreground border-0', step: 4 },
  cancelled: { label: 'Cancelled',        icon: XCircle,       color: 'text-destructive',       bgColor: 'bg-destructive/10',      badgeClass: 'bg-destructive/10 text-destructive border-0', step: 0 },
};

const TIMELINE_STEPS = [
  { key: 'pending',   label: 'Placed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready',     label: 'Ready' },
  { key: 'completed', label: 'Picked Up' },
];

function OrderTimeline({ status }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;

  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center py-3">
        <Badge className="bg-destructive/10 text-destructive border-0 gap-1">
          <XCircle className="h-3.5 w-3.5" />
          Order Cancelled
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3">
      {TIMELINE_STEPS.map((step, index) => {
        const isCompleted = currentStep > index + 1;
        const isCurrent = currentStep === index + 1;
        const cfg = STATUS_CONFIG[step.key];
        const Icon = cfg.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={[
                'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                isCompleted ? 'bg-primary/20 text-primary' : '',
                isCurrent ? `${cfg.bgColor} ${cfg.color}` : '',
                !isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : '',
              ].join(' ')}>
                {isCompleted
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${isCurrent ? cfg.color : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {index < TIMELINE_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-14 mx-1 sm:mx-2 mb-5 transition-colors ${currentStep > index + 1 ? 'bg-primary/40' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, showTimeline, onClick }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-mono">{order.order_number}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.ordered_at ?? order.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <Badge className={cfg.badgeClass}>
            <cfg.icon className="h-3 w-3 mr-1" />
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {showTimeline && <OrderTimeline status={order.status} />}

        <Separator />

        {/* Items summary */}
        <div className="space-y-1">
          {(order.items ?? []).slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}× {item.menu_item?.name ?? 'Item'}
              </span>
              <span>₱{Number(item.subtotal ?? (item.price * item.quantity)).toFixed(2)}</span>
            </div>
          ))}
          {(order.items?.length ?? 0) > 3 && (
            <p className="text-xs text-muted-foreground">
              +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground capitalize">{order.payment_method}</span>
          <span className="text-lg font-bold text-primary">
            ₱{Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  async function fetchOrders() {
    try {
      setError(null);
      const data = await orderService.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    // Poll every 30 seconds for real-time status updates
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status));
  const pastOrders = orders.filter((o) => ['completed', 'cancelled'].includes(o.status));

  if (loading) return <LoadingSpinner message="Loading your orders..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button size="sm" onClick={() => { setLoading(true); fetchOrders(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and view your order history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/menu')}>
            Order Again <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchOrders} title="Refresh orders">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            Active
            {activeOrders.length > 0 && (
              <Badge className="h-5 min-w-5 px-1 text-[10px]">{activeOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">No active orders</p>
              <p className="text-sm mt-1">Your in-progress orders will appear here.</p>
              <Button variant="link" className="mt-2" onClick={() => navigate('/menu')}>
                Browse the menu
              </Button>
            </div>
          ) : (
            activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showTimeline
                onClick={() => navigate(`/orders/${order.id}`)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {pastOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">No past orders</p>
              <p className="text-sm mt-1">Completed and cancelled orders will appear here.</p>
            </div>
          ) : (
            pastOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showTimeline={false}
                onClick={() => navigate(`/orders/${order.id}`)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
