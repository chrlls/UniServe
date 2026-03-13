import { useState } from 'react';
import { Package, Pencil, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function InventoryTable({ items, recentLogs, onUpdateStock, lowStockOnly = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function startEditing(item) {
    setEditingId(item.id);
    setEditQty(String(item.stock_quantity));
    setEditReason('');
    setEditError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditQty('');
    setEditReason('');
    setEditError('');
  }

  async function saveStock(itemId) {
    const parsedQty = Number(editQty);

    if (!Number.isInteger(parsedQty) || parsedQty < 0) {
      setEditError('Enter a valid quantity (0 or greater).');
      return;
    }

    if (!editReason.trim()) {
      setEditError('Please provide a reason for the stock change.');
      return;
    }

    setEditError('');
    setSubmitting(true);
    try {
      await onUpdateStock(itemId, {
        stock_quantity: parsedQty,
        reason: editReason,
      });
      cancelEditing();
    } catch (err) {
      setEditError(err.message || 'Failed to update stock.');
      toast.error(err.message || 'Failed to update stock.');
    } finally {
      setSubmitting(false);
    }
  }

  const LOG_TYPE_CLASS = {
    deduct:     'bg-red-500/10 text-red-400 border-red-500/20',
    restock:    'bg-green-500/10 text-green-400 border-green-500/20',
    adjustment: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div className="space-y-5">
      {/* Items table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Current Stock</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p id="inventory-stock-table-help" className="sr-only">
            Use the edit button in each row to adjust stock quantity and provide a reason.
          </p>
          <div className="overflow-x-auto">
            <Table aria-describedby="inventory-stock-table-help">
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Threshold</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      {lowStockOnly
                        ? 'No low-stock items found right now.'
                        : 'No inventory items available yet.'}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/40 focus-within:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.category?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <div className="flex flex-col gap-1 items-end">
                          <Input
                            id={`stock-qty-${item.id}`}
                            type="number"
                            value={editQty}
                            onChange={(e) => {
                              setEditQty(e.target.value);
                              if (editError) setEditError('');
                            }}
                            min="0"
                            autoFocus
                            aria-label={`Stock quantity for ${item.name}`}
                            aria-invalid={Boolean(editError)}
                            aria-describedby={editError ? `stock-edit-error-${item.id}` : undefined}
                            className="w-20 h-7 text-right text-sm border-slate-300 focus-visible:ring-blue-400/25 focus-visible:border-blue-400"
                          />
                          <Input
                            id={`stock-reason-${item.id}`}
                            type="text"
                            value={editReason}
                            onChange={(e) => {
                              setEditReason(e.target.value);
                              if (editError) setEditError('');
                            }}
                            placeholder="Reason..."
                            aria-label={`Reason for stock change for ${item.name}`}
                            aria-invalid={Boolean(editError)}
                            aria-describedby={editError ? `stock-edit-error-${item.id}` : undefined}
                            className="w-40 h-7 text-xs border-slate-300 focus-visible:ring-blue-400/25 focus-visible:border-blue-400"
                          />
                          {editError && (
                            <p
                              id={`stock-edit-error-${item.id}`}
                              className="text-[11px] text-destructive max-w-[160px] text-right"
                              role="alert"
                              aria-live="assertive"
                            >
                              {editError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className={item.is_low_stock ? 'text-destructive font-medium' : 'font-medium'}>
                          {item.stock_quantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                      {item.low_stock_threshold}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.is_low_stock ? (
                        <Badge variant="destructive" className="text-xs">Low stock</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">Healthy</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary"
                            onClick={() => saveStock(item.id)}
                            disabled={submitting}
                            aria-label={`Save stock changes for ${item.name}`}
                          >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={cancelEditing}
                            aria-label={`Cancel stock editing for ${item.name}`}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => startEditing(item)}
                          aria-label={`Edit stock for ${item.name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package size={16} /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="hidden sm:table-cell">Reason</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!recentLogs || recentLogs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No recent inventory activity yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentLogs?.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs">{log.menu_item?.name || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium capitalize ${LOG_TYPE_CLASS[log.change_type] || ''}`}
                      >
                        {log.change_type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs ${log.quantity_change >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {log.quantity_change >= 0 ? '+' : ''}{log.quantity_change}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[200px]">
                      {log.reason || '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
