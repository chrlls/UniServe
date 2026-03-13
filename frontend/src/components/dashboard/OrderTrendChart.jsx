import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  order_count: { label: 'Orders', color: 'var(--chart-1)' },
};

export default function OrderTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-center py-8 text-muted-foreground">No data available</p>;
  }

  const formatted = data.map((d) => ({
    ...d,
    shortDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
            width={28}
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
                        {orderCount.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  );
                }}
              />
            }
          />
          {/* Spec: line chart shows order volume only — revenue is already on the bar chart */}
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
