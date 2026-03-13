import { useState, useEffect } from 'react';
import { AlertCircle, PackagePlus } from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import InventoryTable from './InventoryTable';
import LowStockAlert from './LowStockAlert';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showBulkRestock, setShowBulkRestock] = useState(false);
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getAll({ low_stock_only: lowStockOnly || undefined });
      setInventoryItems(data.inventoryItems);
      setRecentLogs(data.recentLogs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

  async function handleUpdateStock(menuItemId, payload) {
    await inventoryService.updateStock(menuItemId, payload);
  }

  const lowStockItems = inventoryItems.filter((i) => i.is_low_stock);

  function openBulkRestock() {
    setBulkItems(
      lowStockItems.map((i) => ({ menu_item_id: i.id, name: i.name, quantity: 50 }))
    );
    setBulkReason('Regular restock');
    setShowBulkRestock(true);
  }

  async function handleBulkRestock(e) {
    e.preventDefault();
    setBulkSubmitting(true);
    try {
      await inventoryService.bulkRestock(
        bulkItems.filter((i) => i.quantity > 0).map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
        })),
        bulkReason,
      );
      setShowBulkRestock(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading inventory..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle size={48} className="mb-4 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchData} className="mt-4" size="sm">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {inventoryItems.length} items · {lowStockItems.length} low stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={lowStockOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLowStockOnly(!lowStockOnly)}
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

      {/* Low stock alert */}
      <LowStockAlert
        items={lowStockItems}
        onViewLowStock={() => setLowStockOnly(true)}
      />

      {/* Table */}
      <InventoryTable
        items={inventoryItems}
        recentLogs={recentLogs}
        onUpdateStock={handleUpdateStock}
        onRefresh={fetchData}
      />

      {/* Bulk Restock Dialog */}
      <Dialog open={showBulkRestock} onOpenChange={setShowBulkRestock}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bulk Restock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBulkRestock} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bulkReason">Reason</Label>
              <Input
                id="bulkReason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
              />
            </div>
            <ScrollArea className="h-60">
              <div className="space-y-2 pr-3">
                {bulkItems.map((item, idx) => (
                  <div key={item.menu_item_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                    <span className="flex-1 text-sm">{item.name}</span>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...bulkItems];
                        updated[idx] = { ...updated[idx], quantity: Number(e.target.value) };
                        setBulkItems(updated);
                      }}
                      min="0"
                      className="w-20 h-8 text-right text-sm"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBulkRestock(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={bulkSubmitting}>
                {bulkSubmitting ? 'Restocking...' : 'Restock All'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
