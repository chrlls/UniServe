import { LineChart, Line, XAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

const chartConfig = {
  order_count: { label: 'Orders',  color: 'var(--chart-1)' },
  revenue:     { label: 'Revenue', color: 'var(--chart-2)' },
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
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <LineChart data={formatted}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="shortDate" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) =>
                name === 'revenue'
                  ? `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : value
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="order_count" stroke="var(--color-order_count)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="revenue"     stroke="var(--color-revenue)"     strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
