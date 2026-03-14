import { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion } from 'framer-motion';
import { AlertCircle, PackagePlus, Search, ListFilter, FilterX } from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import categoryService from '../../services/categoryService';
import InventoryTable from './InventoryTable';
import LowStockAlert from './LowStockAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AppModal, AppModalBody, AppModalFooter } from '@/components/ui/app-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { goeyToast } from '@/components/ui/goey-toast';
import { useAccountPreferences } from '@/lib/preferences';
import { InventoryPageSkeleton } from '@/components/skeletons/AdminSkeletons';

const ITEMS_PER_PAGE = 10;
const KPI_CARD_CLASS = 'rounded-2xl border-0 bg-card shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-card/95 hover:shadow-md';

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

export default function InventoryPage() {
  const { formatDateTime } = useAccountPreferences();
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: ITEMS_PER_PAGE,
    total: 0,
    from: null,
    to: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoaded = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkRestock, setShowBulkRestock] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkItemErrors, setBulkItemErrors] = useState({});
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSummary, setBulkSummary] = useState(null);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  const lowStockOnly = statusFilter === 'low-stock';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await categoryService.getAll();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!filtersInitialized) {
      setFiltersInitialized(true);
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategoryId, statusFilter, sortBy, filtersInitialized]);

  async function fetchData(options = {}) {
    const { silent = false } = options;
    // Only show the full skeleton on the very first load
    const showSkeleton = !silent && !hasLoaded.current;

    try {
      if (showSkeleton) {
        setLoading(true);
        setError(null);
      }

      const data = await inventoryService.getAll({
        search: debouncedSearch || undefined,
        category_id: selectedCategoryId !== 'all' ? Number(selectedCategoryId) : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        low_stock_only: lowStockOnly || undefined,
        sort: sortBy,
        page: currentPage,
        per_page: ITEMS_PER_PAGE,
      });

      setInventoryItems(data.inventoryItems);
      setRecentLogs(data.recentLogs);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      hasLoaded.current = true;
    } catch (err) {
      if (showSkeleton) {
        setError(err.message);
      } else {
        goeyToast.error(err.message || 'Unable to refresh inventory after update.');
      }
    } finally {
      if (showSkeleton) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategoryId, statusFilter, sortBy, currentPage]);

  function clearFilters() {
    setSearchQuery('');
    setSelectedCategoryId('all');
    setStatusFilter('all');
    setSortBy('updated-desc');
    setCurrentPage(1);
  }

  async function handleUpdateStock(menuItemId, payload) {
    await inventoryService.updateStock(menuItemId, payload);
    await fetchData({ silent: true });
    goeyToast.success('Stock updated successfully.');
  }

  const lowStockItems = inventoryItems.filter((i) => i.is_low_stock);

  function validateBulkQuantity(quantity) {
    if (!Number.isFinite(quantity)) return 'Enter a valid number.';
    if (quantity < 0) return 'Quantity cannot be negative.';
    return '';
  }

  function openBulkRestock() {
    setBulkError('');
    setBulkItemErrors({});
    setBulkItems(
      lowStockItems.map((i) => ({ menu_item_id: i.id, name: i.name, quantity: 50 }))
    );
    setBulkReason('Regular restock');
    setShowBulkRestock(true);
  }

  async function handleBulkRestock(e) {
    e.preventDefault();
    const nextItemErrors = {};

    bulkItems.forEach((item) => {
      const errorMessage = validateBulkQuantity(item.quantity);
      if (errorMessage) {
        nextItemErrors[item.menu_item_id] = errorMessage;
      }
    });

    setBulkItemErrors(nextItemErrors);

    if (Object.keys(nextItemErrors).length > 0) {
      setBulkError('Fix invalid quantities before submitting.');
      return;
    }

    const validItems = bulkItems.filter((i) => i.quantity > 0);

    if (validItems.length === 0) {
      setBulkError('Add at least one item with quantity greater than 0.');
      return;
    }

    if (!bulkReason.trim()) {
      setBulkError('Please provide a reason for this bulk restock.');
      return;
    }

    setBulkError('');
    setBulkSubmitting(true);
    try {
      await inventoryService.bulkRestock(
        validItems.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
        })),
        bulkReason,
      );

      const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);
      setBulkSummary({
        itemCount: validItems.length,
        totalQuantity,
        reason: bulkReason.trim(),
        at: new Date().toISOString(),
      });

      setShowBulkRestock(false);
      setBulkItemErrors({});
      await fetchData({ silent: true });
      goeyToast.success(`Restocked ${validItems.length} item${validItems.length === 1 ? '' : 's'} successfully.`);
    } catch (err) {
      const message = err.message || 'Bulk restock failed. Please try again.';
      setBulkError(message);
      goeyToast.error(message);
    } finally {
      setBulkSubmitting(false);
    }
  }

  if (loading) {
    return <InventoryPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle size={48} className="mb-4 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchData} className="mt-4" size="sm">Retry</Button>
      </div>
    );
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategoryId !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'updated-desc';

  const outOfStockCount = inventoryItems.filter((item) => item.stock_quantity === 0).length;
  const healthyStockCount = inventoryItems.length - lowStockItems.length;
  const selectedBulkItems = bulkItems.filter((item) => item.quantity > 0);
  const selectedBulkTotalQuantity = selectedBulkItems.reduce((sum, item) => sum + item.quantity, 0);
  const kpiCards = [
    { label: 'Total Items', value: pagination.total, valueClassName: '' },
    { label: 'Low Stock', value: lowStockItems.length, valueClassName: 'text-destructive' },
    { label: 'Healthy Stock', value: healthyStockCount, valueClassName: 'text-emerald-600' },
    { label: 'Out of Stock', value: outOfStockCount, valueClassName: 'text-destructive' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm mt-1 text-muted-foreground" aria-live="polite">
            {pagination.total} items · {lowStockItems.length} low stock on this page
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant={lowStockOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(lowStockOnly ? 'all' : 'low-stock')}
          >
            Low stock only
          </Button>
          {lowStockItems.length > 0 && (
            <Button onClick={openBulkRestock} size="sm" className="gap-2">
              <PackagePlus size={16} /> Bulk Restock
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card, index) => (
          <motion.div key={card.label} {...getKpiCardMotion(index)}>
            <Card className={KPI_CARD_CLASS}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${card.valueClassName}`}>{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Label htmlFor="inventory-search" className="sr-only">Search inventory</Label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="inventory-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item or category..."
                className="pl-9"
              />
            </div>

            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter by stock status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="low-stock">Low stock</SelectItem>
                <SelectItem value="out-of-stock">Out of stock</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListFilter size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sort by</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger aria-label="Sort inventory" className="h-8 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated-desc">Recently updated</SelectItem>
                  <SelectItem value="updated-asc">Least recently updated</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="stock-asc">Stock (low to high)</SelectItem>
                  <SelectItem value="stock-desc">Stock (high to low)</SelectItem>
                  <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                  <SelectItem value="low-stock-first">Low stock first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              aria-label="Clear all inventory filters"
            >
              <FilterX size={14} /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {bulkSummary && (
        <Card role="status" aria-live="polite">
          <CardContent className="p-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-emerald-700">Bulk restock completed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bulkSummary.itemCount} item{bulkSummary.itemCount === 1 ? '' : 's'} · +{bulkSummary.totalQuantity} units · {bulkSummary.reason}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(bulkSummary.at)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Low stock alert */}
      <LowStockAlert
        items={lowStockItems}
        onViewLowStock={() => setStatusFilter('low-stock')}
      />

      {/* Table */}
      <InventoryTable
        items={inventoryItems}
        recentLogs={recentLogs}
        onUpdateStock={handleUpdateStock}
        lowStockOnly={lowStockOnly}
        onSeeAll={() => setShowAllActivity(true)}
        pagination={pagination}
        onPageChange={setCurrentPage}
      />

      {/* All Activity Modal */}
      <AppModal
        isOpen={showAllActivity}
        onClose={() => setShowAllActivity(false)}
        title="All Recent Activity"
        size="md"
        scrollBehavior="inside"
      >
        <AppModalBody>
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const LOG_TYPE_CLASS = {
                deduct: 'bg-destructive/10 text-destructive border-destructive/20',
                restock: 'bg-success/10 text-success border-success/20',
                adjustment: 'bg-primary/10 text-primary border-primary/20',
              };
              return (
                <div key={log.id} className="rounded-md border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{log.menu_item?.name || '—'}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${LOG_TYPE_CLASS[log.change_type] || ''}`}>
                      {log.change_type}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className={`font-mono text-xs ${log.quantity_change >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {log.quantity_change >= 0 ? '+' : ''}{log.quantity_change}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(log.created_at)}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{log.reason || 'No reason provided.'}</p>
                </div>
              );
            })}
          </div>
        </AppModalBody>
      </AppModal>

      {/* Bulk Restock Modal */}
      <AppModal
        isOpen={showBulkRestock}
        onClose={() => { if (!bulkSubmitting) setShowBulkRestock(false); }}
        title="Bulk Restock"
        size="lg"
        isDismissable={!bulkSubmitting}
        scrollBehavior="inside"
      >
        <AppModalBody>
          <form id="bulk-restock-form" onSubmit={handleBulkRestock} className="space-y-4" aria-busy={bulkSubmitting}>
            <p id="bulk-restock-help" className="text-xs text-muted-foreground">
              Set quantity per item and provide a reason. Use 0 to skip an item.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="bulkReason">Reason</Label>
              <Input
                id="bulkReason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                disabled={bulkSubmitting}
                aria-describedby="bulk-restock-help"
              />
            </div>

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {selectedBulkItems.length > 0
                ? `${selectedBulkItems.length} selected · ${selectedBulkTotalQuantity} total units to restock`
                : 'No items selected yet. Set quantity above 0 for at least one item.'}
            </div>

            {bulkError && (
              <p className="text-sm text-destructive" role="alert" aria-live="assertive">
                {bulkError}
              </p>
            )}
            <ScrollArea className="h-60">
              <div className="space-y-2 pr-3">
                {bulkItems.map((item, idx) => (
                  <div key={item.menu_item_id} className="space-y-1">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                      <span className="flex-1 text-sm">{item.name}</span>
                      <Input
                        type="number"
                        value={item.quantity}
                        aria-label={`Restock quantity for ${item.name}`}
                        aria-invalid={Boolean(bulkItemErrors[item.menu_item_id])}
                        aria-describedby={bulkItemErrors[item.menu_item_id] ? `bulk-item-error-${item.menu_item_id}` : undefined}
                        onChange={(e) => {
                          const parsedValue = Number(e.target.value);
                          const updated = [...bulkItems];
                          updated[idx] = { ...updated[idx], quantity: parsedValue };
                          setBulkItems(updated);

                          const errorMessage = validateBulkQuantity(parsedValue);
                          setBulkItemErrors((prev) => {
                            if (!errorMessage && !prev[item.menu_item_id]) return prev;
                            const next = { ...prev };
                            if (errorMessage) {
                              next[item.menu_item_id] = errorMessage;
                            } else {
                              delete next[item.menu_item_id];
                            }
                            return next;
                          });

                          if (bulkError) setBulkError('');
                        }}
                        min="0"
                        disabled={bulkSubmitting}
                        className="w-20 h-8 text-right text-sm"
                      />
                    </div>
                    {bulkItemErrors[item.menu_item_id] && (
                      <p
                        id={`bulk-item-error-${item.menu_item_id}`}
                        className="text-[11px] text-destructive pl-2"
                        role="alert"
                        aria-live="assertive"
                      >
                        {bulkItemErrors[item.menu_item_id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </form>
        </AppModalBody>

        <AppModalFooter>
          <Button type="button" variant="destructive" onClick={() => setShowBulkRestock(false)} disabled={bulkSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="bulk-restock-form" disabled={bulkSubmitting || selectedBulkItems.length === 0}>
            {bulkSubmitting
              ? 'Processing restock...'
              : selectedBulkItems.length > 0
                ? `Restock ${selectedBulkItems.length} item${selectedBulkItems.length === 1 ? '' : 's'}`
                : 'Restock selected'}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
