import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAccountPreferences } from '@/lib/preferences';

const chartConfig = {
  order_count: { label: 'Orders', color: 'var(--chart-1)' },
};

export default function OrderTrendChart({ data }) {
  const { formatDate, formatNumber } = useAccountPreferences();

  if (!data || data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data available
      </p>
    );
  }

  const formatted = data.map((item) => ({
    ...item,
    shortDate: formatDate(item.date, { month: 'short', day: 'numeric' }),
  }));

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <LineChart data={formatted}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="shortDate"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            allowDecimals={false}
            width={36}
            tickFormatter={(value) => formatNumber(value)}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const orderCount = Number(value || 0);
                  const label = orderCount === 1 ? 'order' : 'orders';

                  return (
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatNumber(orderCount)}
                      </span>
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  );
                }}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="order_count"
            stroke="var(--color-order_count)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
