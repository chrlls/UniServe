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
  Search,
  Timer,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAccountPreferences } from '@/lib/preferences';
import orderService from '../../services/orderService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderQueueSkeleton } from '@/components/skeletons/AdminSkeletons';

const STATUS_CONFIG = {
  pending: {
    labelKey: 'orderQueue.pending',
    badgeClass: 'border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    cardAccent: 'border-l-amber-400 dark:border-l-amber-400',
  },
  preparing: {
    labelKey: 'orderQueue.preparing',
    badgeClass: 'border border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    cardAccent: 'border-l-blue-500 dark:border-l-blue-400',
  },
  ready: {
    labelKey: 'orderQueue.ready',
    badgeClass: 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    cardAccent: 'border-l-emerald-500 dark:border-l-emerald-400',
  },
  completed: {
    labelKey: 'orderQueue.completed',
    badgeClass: 'border border-border/50 bg-muted/50 text-muted-foreground',
    cardAccent: 'border-l-border',
  },
  cancelled: {
    labelKey: 'orderQueue.cancelled',
    badgeClass: 'border border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
    cardAccent: 'border-l-red-500 dark:border-l-red-400',
  },
};

const STATUS_ACTIONS = {
  pending: {
    next: 'preparing',
    labelKey: 'orderQueue.action.startPreparing',
    buttonClass: 'bg-foreground text-background hover:bg-foreground/90',
    icon: ChevronRight,
  },
  preparing: {
    next: 'ready',
    labelKey: 'orderQueue.action.markReady',
    buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700',
    icon: ChevronRight,
  },
  ready: {
    next: 'completed',
    labelKey: 'orderQueue.action.completeOrder',
    buttonClass: 'bg-blue-600 text-white hover:bg-blue-700',
    icon: CheckCircle2,
  },
};

const ADMIN_COLUMNS = ['pending', 'preparing', 'ready', 'completed'];
const CASHIER_COLUMNS = ['pending', 'preparing', 'ready'];

const COLUMN_META = {
  pending: {
    titleKey: 'orderQueue.pending',
    Icon: Clock,
    iconClass: 'text-amber-500',
    headerClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    countClass: 'border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  preparing: {
    titleKey: 'orderQueue.preparing',
    Icon: CookingPot,
    iconClass: 'text-blue-500',
    headerClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    countClass: 'border border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  ready: {
    titleKey: 'orderQueue.ready',
    Icon: PackageCheck,
    iconClass: 'text-emerald-500',
    headerClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    countClass: 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  completed: {
    titleKey: 'orderQueue.completed',
    Icon: CheckCircle2,
    iconClass: 'text-muted-foreground',
    headerClass: 'bg-muted/40 text-muted-foreground',
    countClass: 'border border-border/50 bg-muted/40 text-muted-foreground',
  },
};

const CARDS_PER_PAGE = 3;

function formatCurrency(formatNumber, value) {
  return `PHP ${formatNumber(value || 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function OrderCard({ order, onStatusUpdate, updatingId, formatTime, formatNumber, t }) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const primaryAction = STATUS_ACTIONS[order.status] || null;
  const isUpdating = updatingId === order.id;
  const displayedItems = order.items?.slice(0, 2) || [];
  const remainingItems = Math.max((order.items?.length || 0) - displayedItems.length, 0);
  const customerName = order.customer?.name || t('common.orderSource.walkIn');
  const orderSource = order.customer_id ? 'online' : 'walkIn';
  const orderSourceLabel = order.customer_id
    ? t('common.orderSource.online')
    : t('common.orderSource.walkIn');
  const paymentMethod = order.payment_method === 'card' ? 'card' : 'cash';
  const PrimaryActionIcon = primaryAction?.icon;

  return (
    <Card
      className={cn(
        'w-full cursor-pointer overflow-hidden rounded-2xl border border-border/55 bg-card/95 shadow-sm transition-colors duration-200 hover:bg-card',
        'border-l-[3px]',
        config.cardAccent,
      )}
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
              {order.order_number}
            </p>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-semibold text-foreground">
                {customerName}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'h-5 w-fit rounded-full px-2 text-[10px] font-medium',
                orderSource === 'online'
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-border bg-muted/60 text-muted-foreground',
              )}
            >
              {orderSourceLabel}
            </Badge>
          </div>

          <div className="shrink-0 text-right">
            <Badge variant="secondary" className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', config.badgeClass)}>
              {t(config.labelKey)}
            </Badge>
            <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatTime(order.ordered_at)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {displayedItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 text-muted-foreground">
                <span className="mr-1 font-semibold text-foreground">{item.quantity}x</span>
                <span className="break-words">{item.menu_item?.name || 'Item'}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatCurrency(formatNumber, item.line_total)}
              </span>
            </div>
          ))}

          {remainingItems > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
              onClick={(event) => event.stopPropagation()}
            >
              {t('orderQueue.moreItems', { count: remainingItems })}
            </button>
          )}
        </div>

        <div className="my-4 h-px bg-border/50" />

        <div className="flex items-end justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {paymentMethod === 'cash' ? (
              <Banknote className="h-4 w-4 text-emerald-500" />
            ) : (
              <CreditCard className="h-4 w-4 text-blue-500" />
            )}
            {paymentMethod === 'cash' ? t('orderQueue.payment.cash') : t('orderQueue.payment.card')}
          </span>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {formatCurrency(formatNumber, order.total_amount)}
          </span>
        </div>

        {primaryAction ? (
          <div className="mt-4 flex gap-2" onClick={(event) => event.stopPropagation()}>
            <Button
              size="sm"
              className={cn('h-10 flex-1 rounded-xl', primaryAction.buttonClass)}
              onClick={() => onStatusUpdate(order.id, primaryAction.next)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t(primaryAction.labelKey)}
                  {PrimaryActionIcon ? <PrimaryActionIcon className="ml-1.5 h-4 w-4" /> : null}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive"
              onClick={() => onStatusUpdate(order.id, 'cancelled')}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ colKey, orders, onStatusUpdate, updatingId, formatTime, formatNumber, t }) {
  const { Icon, titleKey, iconClass, headerClass, countClass } = COLUMN_META[colKey];
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(orders.length / CARDS_PER_PAGE));
  const hasPagination = totalPages > 1;
  const safePage = Math.min(page, totalPages);
  const paged = orders.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

  const completedInCol = colKey === 'completed' ? orders.filter((order) => order.status === 'completed').length : 0;
  const cancelledInCol = colKey === 'completed' ? orders.filter((order) => order.status === 'cancelled').length : 0;

  return (
    <div className="flex min-w-[21.5rem] flex-1 basis-0 flex-col">
      <div
        className={cn(
          'flex items-center justify-between rounded-t-2xl border border-b-0 px-4 py-3',
          'bg-card/95 backdrop-blur-sm',
          'border-border/60',
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', headerClass)}>
            <Icon className={cn('h-4 w-4', iconClass)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t(titleKey)}</p>
          </div>
        </div>
        <Badge variant="secondary" className={cn('rounded-full px-2.5 py-1 text-xs font-medium', countClass)}>
          {orders.length}
        </Badge>
      </div>

      <div
        className={cn(
          'flex min-h-[32rem] flex-1 flex-col rounded-b-2xl border border-t-0 bg-card/80 p-3 shadow-sm',
          'border-border/60',
        )}
      >
        {colKey === 'completed' && orders.length > 0 ? (
          <p className="px-1 pb-3 text-[11px] text-muted-foreground">
            {t('orderQueue.archiveSummary', {
              completed: completedInCol,
              cancelled: cancelledInCol,
            })}
          </p>
        ) : null}

        <ScrollArea className="min-h-0 flex-1 max-h-[calc(100vh-21rem)]">
          <div className="space-y-3 pr-2">
            {paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/30 px-4 py-14 text-center text-muted-foreground">
                <Icon className="mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">{t('orderQueue.noOrders')}</p>
              </div>
            ) : (
              paged.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={onStatusUpdate}
                  updatingId={updatingId}
                  formatTime={formatTime}
                  formatNumber={formatNumber}
                  t={t}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="mt-2 flex items-center justify-between border-t border-border/50 px-1 pt-2">
          <span className={cn('text-xs text-muted-foreground', !hasPagination && 'invisible')}>
            {t('orderQueue.pageOf', { page: safePage, total: totalPages })}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className={cn('h-8 w-8 rounded-xl', !hasPagination && 'invisible')}
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={!hasPagination || safePage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn('h-8 w-8 rounded-xl', !hasPagination && 'invisible')}
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={!hasPagination || safePage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderQueue() {
  const { user } = useAuth();
  const { formatTime, formatNumber, t } = useAccountPreferences();
  const isCashier = user?.role === 'cashier';
  const visibleColumns = isCashier ? CASHIER_COLUMNS : ADMIN_COLUMNS;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredOrders = normalizedSearchQuery
    ? orders.filter((order) => order.order_number?.toLowerCase().includes(normalizedSearchQuery))
    : orders;

  function getColOrders(colKey) {
    if (colKey === 'completed') {
      return filteredOrders.filter((order) => order.status === 'completed' || order.status === 'cancelled');
    }
    return filteredOrders.filter((order) => order.status === colKey);
  }

  if (loading) {
    return <OrderQueueSkeleton isCashier={isCashier} />;
  }

  const pendingCount = filteredOrders.filter((order) => order.status === 'pending').length;
  const preparingCount = filteredOrders.filter((order) => order.status === 'preparing').length;
  const readyCount = filteredOrders.filter((order) => order.status === 'ready').length;
  const activeCount = pendingCount + preparingCount + readyCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('orderQueue.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('orderQueue.activeOrders', { count: activeCount })}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          <div className="relative min-w-[16rem] flex-1 lg:w-72 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('orderQueue.searchPlaceholder')}
              className="h-10 rounded-xl border-0 bg-muted/55 pl-9 shadow-none"
            />
          </div>

          <Badge variant="outline" className="gap-1.5 rounded-full border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            {pendingCount} {t('orderQueue.pending')}
          </Badge>
          <Badge variant="outline" className="gap-1.5 rounded-full border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-300">
            <CookingPot className="h-3 w-3" />
            {preparingCount} {t('orderQueue.preparing')}
          </Badge>
          <Badge variant="outline" className="gap-1.5 rounded-full border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
            <PackageCheck className="h-3 w-3" />
            {readyCount} {t('orderQueue.ready')}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            {t('orderQueue.refresh')}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto pb-4">
        <div className={cn('flex w-full gap-4', isCashier ? 'min-w-[1060px]' : 'min-w-[1440px]')}>
          {visibleColumns.map((colKey) => (
            <KanbanColumn
              key={colKey}
              colKey={colKey}
              orders={getColOrders(colKey)}
              onStatusUpdate={handleStatusUpdate}
              updatingId={updatingId}
              formatTime={formatTime}
              formatNumber={formatNumber}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
