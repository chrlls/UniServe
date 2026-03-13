import { useState, useEffect } from 'react';
import { AlertCircle, Trophy, Download } from 'lucide-react';
import reportService from '../../services/reportService';
import SalesChart from './SalesChart';
import CategoryPieChart from './CategoryPieChart';
import OrderTrendChart from './OrderTrendChart';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [summary, setSummary] = useState(null);
  const [bestSelling, setBestSelling] = useState([]);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (dateRange.start_date) params.start_date = dateRange.start_date;
      if (dateRange.end_date) params.end_date = dateRange.end_date;

      const [summaryData, bestData, trendsData, catData] = await Promise.all([
        reportService.getSalesSummary(params),
        reportService.getBestSellingItems(params),
        reportService.getOrderTrends(params),
        reportService.getCategoryBreakdown(params),
      ]);
      setSummary(summaryData);
      setBestSelling(bestData);
      setTrends(trendsData);
      setCategories(catData);
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

  function handleDateSubmit(e) {
    e.preventDefault();
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
      ...bestSelling.map((item, i) => [i + 1, item.name, item.category || '', item.quantity_sold, item.revenue]),
      [],
      ['Category Breakdown'],
      ['Category', 'Revenue', 'Percentage'],
      ...categories.map((c) => [c.category, c.revenue, `${c.percentage}%`]),
      [],
      ['Daily Trends'],
      ['Date', 'Order Count', 'Revenue'],
      ...trends.map((t) => [t.date, t.order_count, t.revenue]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${summary.start_date}-to-${summary.end_date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const inputStyle = undefined; // removed — using Input component

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Reports</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {summary ? `${summary.start_date} to ${summary.end_date}` : 'Last 30 days'}
          </p>
        </div>

        {/* Date range filter */}
        <form onSubmit={handleDateSubmit} className="flex items-center gap-2">
          <Input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange((p) => ({ ...p, start_date: e.target.value }))}
            className="w-auto text-sm"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange((p) => ({ ...p, end_date: e.target.value }))}
            className="w-auto text-sm"
          />
          <Button type="submit" size="sm">Apply</Button>
        </form>
        {!loading && !error && summary && (
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download size={14} />
            Export CSV
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading reports..." />
      ) : error ? (
        <div className="flex flex-col items-center py-12">
          <AlertCircle size={48} className="mb-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={fetchReports} className="mt-4" size="sm">Retry</Button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₱${Number(summary.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                { label: 'Total Orders', value: Number(summary.total_orders || 0).toLocaleString() },
                { label: 'Avg Order Value', value: `₱${Number(summary.average_order_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                { label: 'Monthly Revenue', value: `₱${Number(summary.monthly_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
              ].map((card) => (
                <Card key={card.label}>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold mt-1">{card.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <SalesChart data={trends} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <CategoryPieChart data={categories} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <OrderTrendChart data={trends} />
            </CardContent>
          </Card>

          {/* Best selling items */}
          {bestSelling.length > 0 && (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-500" /> Best Selling Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-3">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="text-right">Qty Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bestSelling.map((item, idx) => (
                        <TableRow key={item.menu_item_id}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{item.category || '—'}</TableCell>
                          <TableCell className="text-right">{item.quantity_sold}</TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            ₱{Number(item.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
