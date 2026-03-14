import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ChefHat,
  CheckCircle,
  Clock,
  Printer,
  XCircle,
} from 'lucide-react';
import orderService from '../../services/orderService';
import { useAuth } from '@/context/AuthContext';
import { useAccountPreferences } from '@/lib/preferences';
import LoadingSpinner from '../common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    badgeClass: 'border-0 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600',
    icon: Clock,
  },
  preparing: {
    label: 'Preparing',
    badgeClass: 'border-0 bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 hover:text-blue-600',
    icon: ChefHat,
  },
  ready: {
    label: 'Ready',
    badgeClass: 'border-0 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600',
    icon: CheckCircle,
  },
  completed: {
    label: 'Completed',
    badgeClass: 'border-0 bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'border-0 bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive',
    icon: XCircle,
  },
};

export default function OrderReceipt() {
  const { user } = useAuth();
  const { formatDateTime, t } = useAccountPreferences();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading order..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (!order) return null;

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const canPrint = user?.role === 'admin' || user?.role === 'cashier';
  const customerLabel = order.customer?.name || t('common.orderSource.walkIn');
  const sourceLabel = order.customer_id
    ? t('common.orderSource.online')
    : t('common.orderSource.walkIn');

  return (
    <div className="mx-auto max-w-2xl space-y-6 print:max-w-none print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 px-0">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {canPrint ? (
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="gap-2 print:hidden"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        ) : null}
      </div>

      <Card className="border-border/70 bg-card shadow-sm print:border-0 print:bg-transparent print:shadow-none">
        <CardContent className="space-y-6 p-6 print:space-y-5 print:p-0">
          <div className="space-y-2 text-center">
            <h1 className="font-mono text-2xl font-bold tracking-tight">
              {order.order_number}
            </h1>
            <Badge className={`pointer-events-none gap-1 px-3 py-1 text-sm font-medium transition-none ${config.badgeClass}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(order.ordered_at)}
            </p>
          </div>

          <div className="grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium text-foreground">{customerLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cashier</p>
              <p className="font-medium text-foreground">{order.cashier?.name || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment</p>
              <p className="font-medium capitalize text-foreground">{order.payment_method}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('common.orderSource.label')}</p>
              <p className="font-medium text-foreground">{sourceLabel}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium text-muted-foreground">Item</th>
                    <th className="py-2 text-center font-medium text-muted-foreground">Qty</th>
                    <th className="py-2 text-right font-medium text-muted-foreground">Price</th>
                    <th className="py-2 text-right font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-b-0">
                      <td className="py-3 text-foreground">
                        {item.menu_item?.name || `Item #${item.menu_item_id}`}
                      </td>
                      <td className="py-3 text-center text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 text-right text-muted-foreground">
                        PHP {Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        PHP {Number(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-2 border-border pt-4">
            <span className="text-lg font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">
              PHP {Number(order.total_amount).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
