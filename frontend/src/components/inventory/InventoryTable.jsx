import { useState } from 'react';
import { Package, Pencil, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function InventoryTable({ items, recentLogs, onUpdateStock, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editReason, setEditReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function startEditing(item) {
    setEditingId(item.id);
    setEditQty(String(item.stock_quantity));
    setEditReason('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditQty('');
    setEditReason('');
  }

  async function saveStock(itemId) {
    if (!editReason.trim()) {
      alert('Please provide a reason for the stock change.');
      return;
    }
    setSubmitting(true);
    try {
      await onUpdateStock(itemId, {
        stock_quantity: Number(editQty),
        reason: editReason,
      });
      cancelEditing();
      onRefresh();
    } catch (err) {
      alert(err.message);
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
    <div className="space-y-6">
      {/* Items table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
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
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.category?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <div className="flex flex-col gap-1 items-end">
                          <Input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            min="0"
                            className="w-20 h-7 text-right text-sm"
                          />
                          <Input
                            type="text"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            placeholder="Reason..."
                            className="w-32 h-7 text-xs"
                          />
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
                        <Badge variant="destructive" className="text-xs">Low</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">OK</Badge>
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
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={cancelEditing}
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
      {recentLogs && recentLogs.length > 0 && (
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
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{log.menu_item?.name || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${LOG_TYPE_CLASS[log.change_type] || ''}`}
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
      )}
    </div>
  );
}
