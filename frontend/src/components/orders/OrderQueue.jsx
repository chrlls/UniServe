import { useState, useEffect } from 'react';
import { Clock, ChefHat, Package, CheckCircle2, XCircle, AlertCircle, RefreshCw, PackageOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import orderService from '../../services/orderService';
import LoadingSpinner from '../common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   badgeClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', cardBorder: 'border-l-yellow-500', icon: Clock },
  preparing: { label: 'Preparing', badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',       cardBorder: 'border-l-blue-500',   icon: ChefHat },
  ready:     { label: 'Ready',     badgeClass: 'bg-green-500/10 text-green-500 border-green-500/20',    cardBorder: 'border-l-green-500',  icon: Package },
  completed: { label: 'Completed', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',    cardBorder: 'border-l-slate-400',  icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',          cardBorder: 'border-l-red-400',    icon: XCircle },
};

const STATUS_ACTIONS = {
  pending:   [{ next: 'preparing', label: 'Start Preparing', variant: 'outline' }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  preparing: [{ next: 'ready',     label: 'Mark Ready',      variant: 'outline' }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  ready:     [{ next: 'completed', label: 'Complete',        variant: 'default' }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
};

// Admin: 4 columns (including completed/cancelled archive).
// Cashier: 3 active-work columns only — they don't need to see the archive.
const ADMIN_COLUMNS  = ['pending', 'preparing', 'ready', 'completed'];
const CASHIER_COLUMNS = ['pending', 'preparing', 'ready'];

const COLUMN_META = {
  pending:   { title: 'Pending',          Icon: Clock,        color: 'text-yellow-500', borderTop: 'border-t-yellow-500' },
  preparing: { title: 'Preparing',        Icon: ChefHat,      color: 'text-blue-500',   borderTop: 'border-t-blue-500'   },
  ready:     { title: 'Ready for Pickup', Icon: Package,      color: 'text-green-500',  borderTop: 'border-t-green-500'  },
  completed: { title: 'Completed',        Icon: CheckCircle2, color: 'text-slate-400',  borderTop: 'border-t-slate-400'  },
};

function OrderCard({ order, onStatusUpdate, updatingId }) {
  const navigate = useNavigate();
  const config  = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const actions = STATUS_ACTIONS[order.status] || [];

  return (
    <Card
      className={`border-l-4 ${config.cardBorder} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-sm font-semibold leading-tight">{order.order_number}</span>
          <Badge variant="outline" className={`capitalize text-xs gap-1 shrink-0 ${config.badgeClass}`}>
            <StatusIcon size={10} />
            {config.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{order.customer?.name || 'Walk-in'}</span>
          <span className="shrink-0 ml-2">
            {new Date(order.ordered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="text-xs space-y-0.5 text-muted-foreground">
          {order.items?.slice(0, 2).map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="truncate">{item.quantity}× {item.menu_item?.name || 'Item'}</span>
              <span className="ml-2">₱{Number(item.line_total).toFixed(2)}</span>
            </div>
          ))}
          {order.items?.length > 2 && (
            <p className="text-muted-foreground/60">+{order.items.length - 2} more</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t">
          <span className="text-xs text-muted-foreground capitalize">
            {order.payment_method === 'card' ? 'Card' : 'Cash'}
          </span>
          <span className="font-bold text-sm">₱{Number(order.total_amount).toFixed(2)}</span>
        </div>

        {actions.length > 0 && (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {actions.map((action) => (
              <Button
                key={action.next}
                variant={action.variant}
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => onStatusUpdate(order.id, action.next)}
                disabled={updatingId === order.id}
              >
                {updatingId === order.id ? '…' : action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ colKey, orders, onStatusUpdate, updatingId }) {
  const { Icon, color, title, borderTop } = COLUMN_META[colKey];

  return (
    <div className={`flex flex-col border-t-2 ${borderTop}`}>
      <div className="flex items-center gap-2 py-3 px-1">
        <Icon size={16} className={color} />
        <span className="font-semibold text-sm">{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">{orders.length}</Badge>
      </div>
      <div className="space-y-2.5 pb-4">
        {orders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
              <PackageOpen size={20} className="text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No orders</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={onStatusUpdate}
              updatingId={updatingId}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function OrderQueue() {
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';
  const visibleColumns = isCashier ? CASHIER_COLUMNS : ADMIN_COLUMNS;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  async function fetchOrders() {
    try {
      setError(null);
      const data = await orderService.getAll({});
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleStatusUpdate(orderId, newStatus) {
    setUpdatingId(orderId);
    try {
      await orderService.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  // "completed" column catches both completed and cancelled orders
  function getColOrders(colKey) {
    if (colKey === 'completed') return orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
    return orders.filter(o => o.status === colKey);
  }

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  const activeCount = orders.filter(o => ['pending', 'preparing'].includes(o.status)).length;
  const gridClass   = isCashier ? 'grid-cols-3 min-w-[720px]' : 'grid-cols-4 min-w-[960px]';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} active order{activeCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="h-8 px-3 gap-1.5">
            <Clock size={13} className="text-yellow-500" />
            {orders.filter(o => o.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline" className="h-8 px-3 gap-1.5">
            <ChefHat size={13} className="text-blue-500" />
            {orders.filter(o => o.status === 'preparing').length} Preparing
          </Badge>
          <Badge variant="outline" className="h-8 px-3 gap-1.5">
            <Package size={13} className="text-green-500" />
            {orders.filter(o => o.status === 'ready').length} Ready
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLoading(true); fetchOrders(); }}
            className="gap-2"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl text-sm bg-destructive/10 border border-destructive/25 text-destructive">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Kanban board — overflow-x scroll on small screens */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className={`grid gap-4 ${gridClass}`}>
          {visibleColumns.map((colKey) => (
            <KanbanColumn
              key={colKey}
              colKey={colKey}
              orders={getColOrders(colKey)}
              onStatusUpdate={handleStatusUpdate}
              updatingId={updatingId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
