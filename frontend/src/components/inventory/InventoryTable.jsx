import { useState } from 'react';
import { Check, Loader2, Package, Pencil, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function InventoryTable({
  items,
  recentLogs,
  onUpdateStock,
  lowStockOnly = false,
  onSeeAll,
  pagination,
  onPageChange,
}) {
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
    deduct: 'bg-destructive/10 text-destructive border-destructive/20',
    restock: 'bg-success/10 text-success border-success/20',
    adjustment: 'bg-primary/10 text-primary border-primary/20',
  };

  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  const pageNumbers = getPageNumbers(pagination?.currentPage ?? 1, pagination?.lastPage ?? 1);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <Card className="xl:min-h-[560px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Current Stock</CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
          <p id="inventory-stock-table-help" className="sr-only">
            Use the edit button in each row to adjust stock quantity and provide a reason.
          </p>

          <ScrollArea className="flex-1 min-h-0">
            <div className="overflow-x-auto">
                  <Table aria-describedby="inventory-stock-table-help" className="table-fixed">
                    <colgroup>
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '15%' }} />
                    </colgroup>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[22%]">Item</TableHead>
                        <TableHead className="w-[18%] hidden sm:table-cell">Category</TableHead>
                        <TableHead className="w-[15%] text-right">Stock</TableHead>
                        <TableHead className="w-[15%] text-right hidden md:table-cell">Threshold</TableHead>
                        <TableHead className="w-[15%] text-center">Status</TableHead>
                        <TableHead className="w-[15%] text-right">Action</TableHead>
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
                          <TableCell className="w-[22%] font-medium">{item.name}</TableCell>
                          <TableCell className="w-[18%] hidden sm:table-cell text-muted-foreground">
                            {item.category?.name || '—'}
                          </TableCell>
                          <TableCell className="w-[15%] text-right">
                            {editingId === item.id ? (
                              <div className="flex flex-col gap-1 items-end">
                                <Input
                                  id={`stock-qty-${item.id}`}
                                  type="number"
                                  value={editQty}
                                  onChange={(event) => {
                                    setEditQty(event.target.value);
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
                                  onChange={(event) => {
                                    setEditReason(event.target.value);
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
                          <TableCell className="w-[15%] text-right hidden md:table-cell text-muted-foreground">
                            {item.low_stock_threshold}
                          </TableCell>
                          <TableCell className="w-[15%] text-center">
                            {item.is_low_stock ? (
                              <Badge variant="destructive" className="text-xs">Low stock</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-success border-success/30">Healthy</Badge>
                            )}
                          </TableCell>
                          <TableCell className="w-[15%] text-right">
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
          </ScrollArea>

          {pagination?.lastPage > 1 && (
            <div className="border-t px-4 py-3">
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} items
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (pagination.currentPage > 1) onPageChange(pagination.currentPage - 1);
                        }}
                        className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>

                    {pageNumbers.map((pageNumber, index) => (
                      <PaginationItem key={`${pageNumber}-${index}`}>
                        {pageNumber === '...' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={pagination.currentPage === pageNumber}
                            onClick={(event) => {
                              event.preventDefault();
                              onPageChange(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (pagination.currentPage < pagination.lastPage) onPageChange(pagination.currentPage + 1);
                        }}
                        className={pagination.currentPage === pagination.lastPage ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="xl:min-h-[560px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><Package size={16} /> Recent Activity</span>
            {recentLogs && recentLogs.length > 0 && onSeeAll && (
              <button
                onClick={onSeeAll}
                className="text-xs font-normal text-muted-foreground hover:text-primary transition-colors"
              >
                See all
              </button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
          {(!recentLogs || recentLogs.length === 0) ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No recent inventory activity yet.
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0 pr-1">
              <div className="space-y-2">
              {recentLogs.slice(0, 7).map((log) => (
                  <div key={log.id} className="rounded-md border border-border bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {log.menu_item?.name || '—'}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium capitalize ${LOG_TYPE_CLASS[log.change_type] || ''}`}
                      >
                        {log.change_type}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className={`font-mono text-xs ${log.quantity_change >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {log.quantity_change >= 0 ? '+' : ''}
                        {log.quantity_change}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {log.reason || 'No reason provided.'}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
