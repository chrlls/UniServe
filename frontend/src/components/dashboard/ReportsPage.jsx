import { lazy, Suspense, useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion } from 'framer-motion';
import { AlertCircle, CalendarDays, Download } from 'lucide-react';
import reportService from '../../services/reportService';
import { Button } from '@/components/ui/button';
import { useAccountPreferences } from '@/lib/preferences';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsPageSkeleton } from '@/components/skeletons/AdminSkeletons';

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
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="flex justify-between gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-10" />
        ))}
      </div>
    </div>
  );
}

function parseDateValue(value) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateValue(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReportsPage() {
  const {
    formatDate,
    formatNumber,
    getLastNDaysRange,
    getWeekToDateRange,
  } = useAccountPreferences();
  const [dateRange, setDateRange] = useState(() => {
    return getLastNDaysRange(7);
  });
  const [summary, setSummary] = useState(null);
  const [bestSelling, setBestSelling] = useState([]);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  async function fetchReports(overrideDates = null) {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      const activeDates = overrideDates ?? dateRange;
      if (activeDates.start_date) params.start_date = activeDates.start_date;
      if (activeDates.end_date) params.end_date = activeDates.end_date;

      const [summaryData, bestData, trendsData, categoryData] = await Promise.all([
        reportService.getSalesSummary(params),
        reportService.getBestSellingItems(params),
        reportService.getOrderTrends(params),
        reportService.getCategoryBreakdown(params),
      ]);

      setSummary(summaryData);
      setBestSelling(bestData);
      setTrends(trendsData);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDateSubmit(event) {
    event.preventDefault();
    fetchReports();
  }

  function exportCSV() {
    if (!summary || !bestSelling.length) return;

    const rows = [
      ['Report Period', summary.start_date, summary.end_date],
      ['Total Revenue', summary.total_revenue],
      ['Total Orders', summary.total_orders],
      ['Average Order Value', summary.average_order_value],
      [],
      ['Best Selling Items'],
      ['Rank', 'Item', 'Category', 'Qty Sold', 'Revenue'],
      ...bestSelling.map((item, index) => [index + 1, item.name, item.category || '', item.quantity_sold, item.revenue]),
      [],
      ['Category Breakdown'],
      ['Category', 'Revenue', 'Percentage'],
      ...categories.map((category) => [category.category, category.revenue, `${category.percentage}%`]),
      [],
      ['Daily Trends'],
      ['Date', 'Order Count', 'Revenue'],
      ...trends.map((trend) => [trend.date, trend.order_count, trend.revenue]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${summary.start_date}-to-${summary.end_date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDateSelect(field, selectedDate) {
    if (!selectedDate) return;

    const nextValue = toDateValue(selectedDate);

    setDateRange((previous) => {
      const nextRange = { ...previous, [field]: nextValue };

      if (
        field === 'start_date' &&
        nextRange.end_date &&
        nextValue > nextRange.end_date
      ) {
        nextRange.end_date = nextValue;
      }

      if (
        field === 'end_date' &&
        nextRange.start_date &&
        nextValue < nextRange.start_date
      ) {
        nextRange.start_date = nextValue;
      }

      return nextRange;
    });

    if (field === 'start_date') {
      setStartPickerOpen(false);
    } else {
      setEndPickerOpen(false);
    }
  }

  function handleDateQuickAction(field, action) {
    if (action === 'clear') {
      setDateRange((previous) => ({ ...previous, [field]: '' }));
    }

    if (action === 'today') {
      handleDateSelect(field, parseDateValue(getLastNDaysRange(1).end_date));
    }

    if (field === 'start_date') {
      setStartPickerOpen(false);
    } else {
      setEndPickerOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start sm:gap-4">
        <div className="sm:min-w-0">
          <h1 className="text-2xl font-bold">Sales Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary
              ? `${formatDate(summary.start_date, { month: 'short', day: 'numeric', year: 'numeric' })} to ${formatDate(summary.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Last 7 days'}
          </p>
        </div>

        <form onSubmit={handleDateSubmit} className="flex flex-col items-start gap-2 sm:justify-self-center sm:flex-row sm:items-center">
          <div className="flex items-center gap-1">
            {[
              { label: 'WTD', preset: 'week' },
              { label: '7D', days: 7 },
              { label: '14D', days: 14 },
              { label: '30D', days: 30 },
            ].map(({ label, days, preset }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs text-foreground hover:text-foreground"
                onClick={() => {
                  const nextDates = preset === 'week'
                    ? getWeekToDateRange()
                    : getLastNDaysRange(days);
                  setDateRange(nextDates);
                  fetchReports(nextDates);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 min-w-[148px] justify-between rounded-xl bg-muted/45 px-3 font-normal text-foreground shadow-none hover:bg-muted/45 hover:text-foreground focus-visible:border-transparent focus-visible:ring-0 focus-visible:bg-muted/45 data-[state=open]:bg-muted/45"
                >
                  <span>
                    {dateRange.start_date
                      ? formatDate(dateRange.start_date, {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })
                      : 'Start date'}
                  </span>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto border-0 p-0 shadow-lg">
                <Calendar
                  mode="single"
                  selected={parseDateValue(dateRange.start_date)}
                  onSelect={(date) => handleDateSelect('start_date', date)}
                  captionLayout="dropdown"
                  fromYear={2024}
                  toYear={2035}
                  initialFocus
                  className="[&_button[data-slot=button]]:shadow-none [&_button[data-slot=button]:hover]:bg-transparent [&_button[data-slot=button]:hover]:text-foreground"
                  classNames={{
                    dropdown_root: 'relative rounded-md border-0 bg-muted/45 shadow-none',
                    button_previous: 'size-[--cell-size] border-0 bg-transparent p-0 shadow-none hover:bg-transparent',
                    button_next: 'size-[--cell-size] border-0 bg-transparent p-0 shadow-none hover:bg-transparent',
                  }}
                />
                <div className="flex items-center justify-between px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs shadow-none hover:bg-transparent"
                    onClick={() => handleDateQuickAction('start_date', 'clear')}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs shadow-none hover:bg-transparent"
                    onClick={() => handleDateQuickAction('start_date', 'today')}
                  >
                    Today
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-sm text-muted-foreground">to</span>
            <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 min-w-[148px] justify-between rounded-xl bg-muted/45 px-3 font-normal text-foreground shadow-none hover:bg-muted/45 hover:text-foreground focus-visible:border-transparent focus-visible:ring-0 focus-visible:bg-muted/45 data-[state=open]:bg-muted/45"
                >
                  <span>
                    {dateRange.end_date
                      ? formatDate(dateRange.end_date, {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })
                      : 'End date'}
                  </span>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto border-0 p-0 shadow-lg">
                <Calendar
                  mode="single"
                  selected={parseDateValue(dateRange.end_date)}
                  onSelect={(date) => handleDateSelect('end_date', date)}
                  captionLayout="dropdown"
                  fromYear={2024}
                  toYear={2035}
                  initialFocus
                  className="[&_button[data-slot=button]]:shadow-none [&_button[data-slot=button]:hover]:bg-transparent [&_button[data-slot=button]:hover]:text-foreground"
                  classNames={{
                    dropdown_root: 'relative rounded-md border-0 bg-muted/45 shadow-none',
                    button_previous: 'size-[--cell-size] border-0 bg-transparent p-0 shadow-none hover:bg-transparent',
                    button_next: 'size-[--cell-size] border-0 bg-transparent p-0 shadow-none hover:bg-transparent',
                  }}
                />
                <div className="flex items-center justify-between px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs shadow-none hover:bg-transparent"
                    onClick={() => handleDateQuickAction('end_date', 'clear')}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs shadow-none hover:bg-transparent"
                    onClick={() => handleDateQuickAction('end_date', 'today')}
                  >
                    Today
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button type="submit" size="sm">Apply</Button>
          </div>
        </form>

        <div className="sm:flex sm:justify-self-end">
          {!loading && !error && summary ? (
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download size={14} />
              Export CSV
            </Button>
          ) : (
            <div className="hidden h-9 min-w-[122px] sm:block" aria-hidden="true" />
          )}
        </div>
      </div>

      {loading ? (
        <ReportsPageSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center py-12">
          <AlertCircle size={48} className="mb-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={fetchReports} className="mt-4" size="sm">Retry</Button>
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Revenue', value: `PHP ${formatNumber(summary.total_revenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                { label: 'Total Orders', value: formatNumber(summary.total_orders || 0) },
                { label: 'Avg Order Value', value: `PHP ${formatNumber(summary.average_order_value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                { label: 'Monthly Revenue', value: `PHP ${formatNumber(summary.monthly_revenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              ].map((card, index) => (
                <motion.div key={card.label} {...getKpiCardMotion(index)}>
                  <Card className={KPI_CARD_CLASS}>
                    <CardContent className="p-5">
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-lg font-bold">{card.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <motion.div className="h-full" {...CONTENT_CARD_MOTION} transition={{ ...CONTENT_CARD_MOTION.transition, delay: 0.1 }}>
              <Card className={`${SURFACE_CARD_CLASS} flex h-full flex-col`}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-base font-semibold">Daily Revenue</CardTitle>
                  <CardDescription>Revenue per day over the reporting period</CardDescription>
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
                  <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
                  <CardDescription>Revenue breakdown across menu categories</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 justify-center pb-3 pt-1">
                  <Suspense fallback={<ChartLoadingFallback className="py-8" />}>
                    <CategoryPieChart data={categories} />
                  </Suspense>
                </CardContent>
                <CardFooter className="flex-wrap gap-x-4 gap-y-1 pb-4 pt-3 text-xs text-muted-foreground">
                  {categories.slice(0, 4).map((category) => (
                    <span key={category.category}>
                      {category.category}: {Number(category.percentage).toFixed(1)}%
                    </span>
                  ))}
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div className="h-full" {...CONTENT_CARD_MOTION} transition={{ ...CONTENT_CARD_MOTION.transition, delay: 0.2 }}>
              <Card className={`${SURFACE_CARD_CLASS} flex h-full flex-col`}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-base font-semibold">Order Trends</CardTitle>
                  <CardDescription>Order volume and revenue over time</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-4 pt-1">
                  <Suspense fallback={<ChartLoadingFallback />}>
                    <OrderTrendChart data={trends} />
                  </Suspense>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {bestSelling.length > 0 && (
            <Card className="rounded-2xl border-0 bg-card shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Best Selling Items</CardTitle>
              </CardHeader>
              <CardContent className="mt-3 p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="[&_tr]:border-b-0">
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="text-right">Qty Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bestSelling.map((item, index) => (
                        <TableRow key={item.menu_item_id} className="border-border/20">
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{item.category || '-'}</TableCell>
                          <TableCell className="text-right">{item.quantity_sold}</TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            {`PHP ${formatNumber(item.revenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
