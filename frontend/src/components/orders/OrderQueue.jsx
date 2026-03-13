import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CookingPot,
  CreditCard,
  PackageCheck,
  RefreshCw,
  Timer,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import orderService from '../../services/orderService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderQueueSkeleton } from '@/components/skeletons/AdminSkeletons';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-0',
    cardBorder: 'border-l-amber-400',
  },
  preparing: {
    label: 'Preparing',
    badgeClass: 'bg-blue-50 text-blue-700 border-0',
    cardBorder: 'border-l-blue-400',
  },
  ready: {
    label: 'Ready for Pickup',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-0',
    cardBorder: 'border-l-emerald-400',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-muted text-muted-foreground border-0',
    cardBorder: 'border-l-border',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-red-50 text-red-700 border-0',
    cardBorder: 'border-l-red-400',
  },
};

const STATUS_ACTIONS = {
  pending: {
    next: 'preparing',
    label: 'Start Preparing',
    buttonClass: 'bg-foreground hover:bg-foreground/90 text-background',
    icon: ChevronRight,
  },
  preparing: {
    next: 'ready',
    label: 'Mark Ready',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon: ChevronRight,
  },
  ready: {
    next: 'completed',
    label: 'Complete Order',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: CheckCircle2,
  },
};

// Admin: 4 columns (including completed/cancelled archive).
// Cashier: 3 active-work columns only — they don't need to see the archive.
const ADMIN_COLUMNS   = ['pending', 'preparing', 'ready', 'completed'];
const CASHIER_COLUMNS = ['pending', 'preparing', 'ready'];

const COLUMN_META = {
  pending: {
    title: 'Pending',
    Icon: Clock,
    color: 'text-amber-600',
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-200',
    laneBg: 'bg-muted/50',
    countBg: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  preparing: {
    title: 'Preparing',
    Icon: CookingPot,
    color: 'text-blue-600',
    headerBg: 'bg-blue-50',
    headerBorder: 'border-blue-200',
    laneBg: 'bg-muted/50',
    countBg: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  ready: {
    title: 'Ready for Pickup',
    Icon: PackageCheck,
    color: 'text-emerald-600',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    laneBg: 'bg-muted/50',
    countBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  completed: {
    title: 'Completed',
    Icon: CheckCircle2,
    color: 'text-muted-foreground',
    headerBg: 'bg-muted/50',
    headerBorder: 'border-border',
    laneBg: 'bg-muted/30',
    countBg: 'bg-muted/50 text-muted-foreground border border-border',
  },
};

const CARDS_PER_PAGE = 3;

function formatOrderTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OrderCard({ order, onStatusUpdate, updatingId }) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const primaryAction = STATUS_ACTIONS[order.status] || null;
  const isUpdating = updatingId === order.id;
  const displayedItems = order.items?.slice(0, 2) || [];
  const remainingItems = Math.max((order.items?.length || 0) - displayedItems.length, 0);
  const customerName = order.customer?.name || 'Walk-in';
  const paymentMethod = order.payment_method === 'card' ? 'card' : 'cash';
  const PrimaryActionIcon = primaryAction?.icon;

  return (
    <Card
      className={cn(
        'w-full bg-card border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer',
        'border-l-4',
        config.cardBorder,
      )}
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <CardContent className="p-4 pt-4">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">{order.order_number}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{customerName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <Badge variant="secondary" className={cn('text-xs font-normal', config.badgeClass)}>
              {config.label}
            </Badge>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground justify-end">
              <Timer className="h-3 w-3" />
              {formatOrderTime(order.ordered_at)}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          {displayedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground truncate">
                <span className="text-foreground font-medium">{item.quantity}x</span>{' '}
                {item.menu_item?.name || 'Item'}
              </span>
              <span className="text-muted-foreground shrink-0">₱{Number(item.line_total).toFixed(2)}</span>
            </div>
          ))}
          {remainingItems > 0 && (
            <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              +{remainingItems} more item{remainingItems > 1 ? 's' : ''}
            </button>
          )}
        </div>

        <div className="border-t border-dashed border-border my-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {paymentMethod === 'cash' ? (
                <Banknote className="h-4 w-4 text-emerald-600" />
              ) : (
                <CreditCard className="h-4 w-4 text-blue-600" />
              )}
              <span className="capitalize">{paymentMethod}</span>
            </span>
            <span className="text-lg font-semibold text-foreground">₱{Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {primaryAction && (
          <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className={cn('flex-1 h-9', primaryAction.buttonClass)}
              onClick={() => onStatusUpdate(order.id, primaryAction.next)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {primaryAction.label}
                  {PrimaryActionIcon ? <PrimaryActionIcon className="h-4 w-4 ml-1" /> : null}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive h-9 px-3"
              onClick={() => onStatusUpdate(order.id, 'cancelled')}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ colKey, orders, onStatusUpdate, updatingId }) {
  const { Icon, title, color, headerBg, headerBorder, laneBg, countBg } = COLUMN_META[colKey];
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(orders.length / CARDS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = orders.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

  const completedInCol = colKey === 'completed' ? orders.filter(o => o.status === 'completed').length : 0;
  const cancelledInCol = colKey === 'completed' ? orders.filter(o => o.status === 'cancelled').length : 0;

  return (
    <div className="flex-1 basis-0 min-w-[22rem] flex flex-col">
      <div className={cn('flex items-center justify-between p-3 rounded-t-xl border border-b-0', headerBg, headerBorder)}>
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className={cn('font-medium text-sm', color)}>{title}</span>
          <Badge
            variant="secondary"
            className={cn('ml-auto h-6 min-w-[24px] text-xs font-medium', countBg)}
          >
            {orders.length}
          </Badge>
        </div>
      </div>

      <div className={cn('flex-1 border border-t-0 rounded-b-xl p-3 flex flex-col', headerBorder, laneBg)}>
        {colKey === 'completed' && orders.length > 0 ? (
          <p className="px-1 pb-2 text-[11px] text-muted-foreground">
            {completedInCol} done · {cancelledInCol} cancelled
          </p>
        ) : null}

        <ScrollArea className="w-full flex-1 min-h-[28rem] max-h-[calc(100vh-21rem)]">
          <div className="w-full space-y-3 pr-2">
            {paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Icon className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No orders</p>
              </div>
            ) : (
              paged.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={onStatusUpdate}
                  updatingId={updatingId}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 px-1 border-t border-border mt-2">
            <span className="text-xs text-muted-foreground">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderQueue() {
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';
  const visibleColumns = isCashier ? CASHIER_COLUMNS : ADMIN_COLUMNS;

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await orderService.getAll({});
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

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

  function handleRefresh() {
    setRefreshing(true);
    fetchOrders();
  }

  // "completed" column catches both completed and cancelled orders
  function getColOrders(colKey) {
    if (colKey === 'completed') return orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
    return orders.filter(o => o.status === colKey);
  }

  if (loading) return <OrderQueueSkeleton isCashier={isCashier} />;

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const activeCount = pendingCount + preparingCount + readyCount;

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Order Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activeCount} active order{activeCount !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 mr-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
              <Clock className="h-3 w-3" />
              {pendingCount} Pending
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5">
              <CookingPot className="h-3 w-3" />
              {preparingCount} Preparing
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5">
              <PackageCheck className="h-3 w-3" />
              {readyCount} Ready
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
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

      <div className="flex gap-4 overflow-x-auto pb-4">
        <div className={cn('flex w-full gap-4', isCashier ? 'min-w-[1080px]' : 'min-w-[1480px]')}>
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
