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
    title: 'Total Revenue',
    hint: 'vs last period',
    format: 'currency',
    Icon: DollarSign,
    iconBg: 'bg-blue-500/5 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'total_orders',
    title: 'Total Orders',
    hint: 'orders recorded',
    format: 'number',
    Icon: ShoppingCart,
    iconBg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'average_order_value',
    title: 'Avg Order Value',
    hint: 'per transaction',
    format: 'currency',
    Icon: TrendingUp,
    iconBg: 'bg-violet-500/5 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'daily_revenue',
    title: "Today's Revenue",
    hint: 'live today',
    format: 'currency',
    Icon: Zap,
    iconBg: 'bg-amber-500/5 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    isLive: true,
  },
  {
    key: 'pending_orders',
    title: 'Pending Orders',
    hint: 'awaiting action',
    format: 'number',
    Icon: Clock,
    iconBg: 'bg-orange-500/5 dark:bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    isStatus: true,
  },
  {
    key: 'low_stock_count',
    title: 'Low Stock Items',
    hint: 'needs restock',
    format: 'number',
    Icon: Package,
    iconBg: 'bg-red-500/5 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    isWarning: true,
  },
];

function SummaryCard({ index = 0, title, hint, value, format, Icon, iconBg, iconColor, isWarning, isStatus, isLive }) {
  const display =
    format === 'currency'
      ? `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : Number(value || 0).toLocaleString();

  const accentClass = isWarning
    ? 'text-red-600 dark:text-red-400'
    : isStatus
      ? 'text-orange-600 dark:text-orange-400'
      : isLive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.08 + index * 0.07,
        type: 'spring',
        stiffness: 280,
        damping: 24,
      }}
    >
      <Card className="h-full rounded-2xl bg-card shadow-sm transition-all duration-300 ease-out hover:bg-card/95 hover:-translate-y-1 hover:shadow-md">
        <CardContent className="flex min-h-[116px] flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[1.75rem] font-bold leading-none tracking-tight">{display}</p>
            <p className={`flex items-center gap-1 text-xs font-medium ${accentClass}`}>
              {!isWarning && !isStatus && !isLive && <ArrowUpRight size={12} />}
              {hint}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const STATUS_BADGE = {
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending:   'bg-yellow-500/10  text-yellow-600  dark:text-yellow-400',
  preparing: 'bg-blue-500/10   text-blue-600   dark:text-blue-400',
  ready:     'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  cancelled: 'bg-red-500/10   text-red-600   dark:text-red-400',
};

const sectionMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const [summaryData, trendsData, categoryData, ordersData] = await Promise.all([
          reportService.getSalesSummary(),
          reportService.getOrderTrends(),
          reportService.getCategoryBreakdown(),
          orderService.getAll(),
        ]);

        const pendingCount = ordersData.filter(
          (o) => o.status === 'pending' || o.status === 'preparing'
        ).length;

        setSummary({ ...summaryData, pending_orders: pendingCount, low_stock_count: 0 });
        setTrends(trendsData);
        setCategories(categoryData);
        setRecentOrders(ordersData.slice(0, 5));

        // Low-stock fetch — silent-fail so a permission/network error never breaks the dashboard
        try {
          const { inventoryItems } = await inventoryService.getAll({ low_stock_only: true });
          setLowStockItems(inventoryItems ?? []);
          setSummary((prev) => prev ? { ...prev, low_stock_count: inventoryItems?.length ?? 0 } : prev);
        } catch {
          // intentionally silent — low-stock is non-critical
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
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="space-y-5"
    >
      {/* Header */}
      <motion.div
        variants={sectionMotion}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 26 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p className="text-xs font-medium text-muted-foreground">{dateStr}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{greeting}, {firstName}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Here&apos;s what&apos;s happening in your canteen today.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/cashier/pos')} className="gap-2 rounded-lg">
            <PlusCircle className="h-4 w-4" /> New Order
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/reports')} className="gap-2 rounded-lg">
            <BarChart2 className="h-4 w-4" /> View Reports
          </Button>
        </div>
      </motion.div>

      {/* KPI cards — 2 rows of 3 */}
      <motion.div
        variants={sectionMotion}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 26 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {SUMMARY_CARDS.map((card, index) => (
          <SummaryCard key={card.key} index={index} value={summary?.[card.key]} {...card} />
        ))}
      </motion.div>

      {/* Low-stock alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          variants={sectionMotion}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 26 }}
          className="flex items-start gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-amber-700 dark:text-amber-400">
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's are' : ' is'} running low on stock:&nbsp;
            </span>
            <span className="text-amber-700/80 dark:text-amber-400/80">
              {lowStockItems.map((i) => i.name).join(', ')}
            </span>
          </div>
          <Link to="/admin/inventory" className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline">
            Manage
          </Link>
        </motion.div>
      )}

      {/* Charts row */}
      <motion.div
        variants={sectionMotion}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.18, type: 'spring', stiffness: 300, damping: 26 }}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold">Daily Revenue</CardTitle>
            <CardDescription>Revenue per day over the reporting period</CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-1">
            <Suspense fallback={<ChartLoadingFallback />}>
              <SalesChart data={trends} />
            </Suspense>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
            <CardDescription>Revenue breakdown across menu categories</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-3 pt-1">
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
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold">Order Trends</CardTitle>
            <CardDescription>Order volume and revenue over time</CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-1">
            <Suspense fallback={<ChartLoadingFallback />}>
              <OrderTrendChart data={trends} />
            </Suspense>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent orders — activity feed */}
      {recentOrders.length > 0 && (
        <motion.div
          variants={sectionMotion}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.24, type: 'spring', stiffness: 300, damping: 26 }}
        >
          <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <span className="text-xs text-muted-foreground">{recentOrders.length} latest</span>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <ul className="space-y-2">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex cursor-default items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{order.customer?.name || 'Walk-in'}</p>
                    <p className="font-mono text-xs text-muted-foreground">{order.order_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">₱{Number(order.total_amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize shrink-0 ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}
                  >
                    {order.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pb-4 pt-3">
            <Link to="/admin/orders" className="text-xs text-primary hover:underline font-medium">
              View all orders →
            </Link>
          </CardFooter>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
