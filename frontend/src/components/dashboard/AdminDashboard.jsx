import { lazy, Suspense, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion } from 'framer-motion';
import {
  AlertCircle, ArrowUpRight, PlusCircle, BarChart2,
  ShoppingCart, AlertTriangle, DollarSign, TrendingUp,
  Zap, Clock, Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAccountPreferences } from '@/lib/preferences';
import reportService from '../../services/reportService';
import inventoryService from '../../services/inventoryService';
import orderService from '../../services/orderService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardPageSkeleton } from '@/components/skeletons/AdminSkeletons';

const SalesChart = lazy(() => import('./SalesChart'));
const CategoryPieChart = lazy(() => import('./CategoryPieChart'));
const OrderTrendChart = lazy(() => import('./OrderTrendChart'));

const KPI_CARD_CLASS = 'rounded-2xl border-0 bg-card shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-card/95 hover:shadow-md';
const SURFACE_CARD_CLASS = 'rounded-2xl bg-card shadow-sm';
const CONTENT_CARD_MOTION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
};

function getKpiCardMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.28,
      delay: 0.06 + (index * 0.045),
      ease: [0.22, 1, 0.36, 1],
    },
  };
}

function ChartLoadingFallback({ className = 'py-12' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid h-44 grid-cols-10 items-end gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton
            key={index}
            className="w-full rounded-md"
            style={{ height: `${36 + ((index % 5) * 11)}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-10" />
        ))}
      </div>
    </div>
  );
}

const SUMMARY_CARDS = [
  {
    key: 'total_revenue',
    titleKey: 'dashboard.kpi.totalRevenue.title',
    hintKey: 'dashboard.kpi.totalRevenue.hint',
    format: 'currency',
    Icon: DollarSign,
    iconBg: 'bg-blue-500/5 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'total_orders',
    titleKey: 'dashboard.kpi.totalOrders.title',
    hintKey: 'dashboard.kpi.totalOrders.hint',
    format: 'number',
    Icon: ShoppingCart,
    iconBg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'average_order_value',
    titleKey: 'dashboard.kpi.averageOrderValue.title',
    hintKey: 'dashboard.kpi.averageOrderValue.hint',
    format: 'currency',
    Icon: TrendingUp,
    iconBg: 'bg-violet-500/5 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'daily_revenue',
    titleKey: 'dashboard.kpi.todaysRevenue.title',
    hintKey: 'dashboard.kpi.todaysRevenue.hint',
    format: 'currency',
    Icon: Zap,
    iconBg: 'bg-amber-500/5 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    isLive: true,
  },
  {
    key: 'pending_orders',
    titleKey: 'dashboard.kpi.pendingOrders.title',
    hintKey: 'dashboard.kpi.pendingOrders.hint',
    format: 'number',
    Icon: Clock,
    iconBg: 'bg-orange-500/5 dark:bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    isStatus: true,
  },
  {
    key: 'low_stock_count',
    titleKey: 'dashboard.kpi.lowStockItems.title',
    hintKey: 'dashboard.kpi.lowStockItems.hint',
    format: 'number',
    Icon: Package,
    iconBg: 'bg-red-500/5 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    isWarning: true,
  },
];

function SummaryCard({ index = 0, titleKey, hintKey, value, format, Icon, iconBg, iconColor, isWarning, isStatus, isLive }) {
  const { formatNumber, t } = useAccountPreferences();
  const display =
    format === 'currency'
      ? `PHP ${formatNumber(value || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : formatNumber(value || 0);

  const accentClass = isWarning
    ? 'text-red-600 dark:text-red-400'
    : isStatus
      ? 'text-orange-600 dark:text-orange-400'
      : isLive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground';

  return (
    <motion.div {...getKpiCardMotion(index)}>
      <Card className={`h-full ${KPI_CARD_CLASS}`}>
        <CardContent className="flex min-h-[116px] flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-muted-foreground">{t(titleKey)}</p>
            </div>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[1.75rem] font-bold leading-none tracking-tight">{display}</p>
            <p className={`flex items-center gap-1 text-xs font-medium ${accentClass}`}>
              {!isWarning && !isStatus && !isLive && <ArrowUpRight size={12} />}
              {t(hintKey)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const STATUS_BADGE = {
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-yellow-500/10  text-yellow-600  dark:text-yellow-400',
  preparing: 'bg-blue-500/10   text-blue-600   dark:text-blue-400',
  ready: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  cancelled: 'bg-red-500/10   text-red-600   dark:text-red-400',
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { formatDate, formatNumber, formatRelativeTime, getCurrentHour, t } = useAccountPreferences();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const [summaryData, trendsData, categoryData, bestSellingData, ordersData] = await Promise.all([
          reportService.getSalesSummary(),
          reportService.getOrderTrends(),
          reportService.getCategoryBreakdown(),
          reportService.getBestSellingItems(),
          orderService.getAll(),
        ]);

        const pendingCount = ordersData.filter(
          (o) => o.status === 'pending' || o.status === 'preparing',
        ).length;

        setSummary({ ...summaryData, pending_orders: pendingCount, low_stock_count: 0 });
        setTrends(trendsData);
        setCategories(categoryData);
        setBestSelling(bestSellingData.slice(0, 5));
        setRecentOrders(ordersData.slice(0, 5));

        // Low-stock fetch: silent-fail so a permission/network error never breaks the dashboard.
        try {
          const { inventoryItems } = await inventoryService.getAll({ low_stock_only: true });
          setLowStockItems(inventoryItems ?? []);
          setSummary((prev) => (prev ? { ...prev, low_stock_count: inventoryItems?.length ?? 0 } : prev));
        } catch {
          // Intentionally silent: low-stock is non-critical.
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const hour = getCurrentHour();
  const greeting = hour < 12
    ? t('dashboard.greeting.morning')
    : hour < 17
      ? t('dashboard.greeting.afternoon')
      : t('dashboard.greeting.evening');
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const dateStr = formatDate(new Date(), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{dateStr}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{greeting}, {firstName}!</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/cashier/pos')} className="gap-2 rounded-lg">
            <PlusCircle className="h-4 w-4" /> {t('dashboard.actions.newOrder')}
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/reports')} className="gap-2 rounded-lg">
            <BarChart2 className="h-4 w-4" /> {t('dashboard.actions.viewReports')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {SUMMARY_CARDS.map((card, index) => {
          const { key: cardKey, ...cardProps } = card;
          return (
            <SummaryCard key={cardKey} index={index} value={summary?.[cardKey]} {...cardProps} />
          );
        })}
      </div>

      {lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-amber-700 dark:text-amber-400">
              {t('dashboard.lowStockAlert', { count: lowStockItems.length })}&nbsp;
            </span>
            <span className="text-amber-700/80 dark:text-amber-400/80">
              {lowStockItems.map((i) => i.name).join(', ')}
            </span>
          </div>
          <Link to="/admin/inventory" className="shrink-0 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400">
            {t('dashboard.manage')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div className="h-full" {...CONTENT_CARD_MOTION} transition={{ ...CONTENT_CARD_MOTION.transition, delay: 0.1 }}>
          <Card className={`${SURFACE_CARD_CLASS} flex h-full flex-col`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold">{t('dashboard.charts.dailyRevenue.title')}</CardTitle>
              <CardDescription>{t('dashboard.charts.dailyRevenue.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4 pt-1">
              <Suspense fallback={<ChartLoadingFallback />}>
                <SalesChart data={trends} />
              </Suspense>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div className="h-full" {...CONTENT_CARD_MOTION} transition={{ ...CONTENT_CARD_MOTION.transition, delay: 0.15 }}>
          <Card className={`${SURFACE_CARD_CLASS} flex h-full flex-col`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold">{t('dashboard.charts.salesByCategory.title')}</CardTitle>
              <CardDescription>{t('dashboard.charts.salesByCategory.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 justify-center pb-3 pt-1">
              <Suspense fallback={<ChartLoadingFallback className="py-8" />}>
                <CategoryPieChart data={categories} />
              </Suspense>
            </CardContent>
            <CardFooter className="flex-wrap gap-x-4 gap-y-1 pb-4 pt-3 text-xs text-muted-foreground">
              {categories.slice(0, 4).map((c) => (
                <span key={c.category}>{c.category}: {Number(c.percentage).toFixed(1)}%</span>
              ))}
            </CardFooter>
          </Card>
        </motion.div>
        <motion.div className="h-full" {...CONTENT_CARD_MOTION} transition={{ ...CONTENT_CARD_MOTION.transition, delay: 0.2 }}>
          <Card className={`${SURFACE_CARD_CLASS} flex h-full flex-col`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold">{t('dashboard.charts.orderTrends.title')}</CardTitle>
              <CardDescription>{t('dashboard.charts.orderTrends.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4 pt-1">
              <Suspense fallback={<ChartLoadingFallback />}>
                <OrderTrendChart data={trends} />
              </Suspense>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {(recentOrders.length > 0 || bestSelling.length > 0) && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {recentOrders.length > 0 && (
            <motion.div {...CONTENT_CARD_MOTION} transition={{ ...CONTENT_CARD_MOTION.transition, delay: 0.24 }}>
              <Card className={`${SURFACE_CARD_CLASS} flex h-full flex-col`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{t('dashboard.recentOrders.title')}</CardTitle>
                    <span className="text-xs text-muted-foreground">{t('dashboard.recentOrders.latest', { count: recentOrders.length })}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 px-3 pb-3 pt-0">
                  <ul className="space-y-2">
                    {recentOrders.map((order) => {
                      const sourceLabel = order.customer_id
                        ? t('common.orderSource.online')
                        : t('common.orderSource.walkIn');
                      const customerLabel = order.customer?.name || t('common.orderSource.walkIn');
                      const isOnline = Boolean(order.customer_id);

                      return (
                      <li key={order.id} className="flex cursor-default items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{customerLabel}</p>
                            <Badge
                              variant="outline"
                              className={`h-5 shrink-0 rounded-full px-2 text-[10px] font-medium ${
                                isOnline
                                  ? 'border-primary/20 bg-primary/10 text-primary'
                                  : 'border-border bg-muted/60 text-muted-foreground'
                              }`}
                            >
                              {sourceLabel}
                            </Badge>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">{order.order_number}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">PHP {Number(order.total_amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(order.created_at)}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`capitalize shrink-0 ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}
                        >
                          {order.status}
                        </Badge>
                      </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter className="pb-4 pt-3">
                  <Link to="/admin/orders" className="text-xs font-medium text-primary hover:underline">
                    {t('dashboard.recentOrders.viewAll')}
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {bestSelling.length > 0 && (
            <motion.div {...CONTENT_CARD_MOTION} transition={{ ...CONTENT_CARD_MOTION.transition, delay: 0.28 }}>
              <Card className={`${SURFACE_CARD_CLASS} flex h-full flex-col`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{t('dashboard.bestSelling.title')}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 px-3 pb-3 pt-0">
                  <ul className="space-y-2">
                    {bestSelling.map((item, index) => (
                      <li key={item.menu_item_id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category || '-'}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">
                            PHP {formatNumber(item.revenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('dashboard.bestSelling.sold', { count: formatNumber(item.quantity_sold) })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pb-4 pt-3">
                  <Link to="/admin/reports" className="text-xs font-medium text-primary hover:underline">
                    {t('dashboard.bestSelling.viewAll')}
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
