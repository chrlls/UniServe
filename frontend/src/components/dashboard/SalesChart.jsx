import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
};

export default function SalesChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-center py-8 text-muted-foreground">No data available</p>;
  }

  const formatted = data.map((d) => ({
    ...d,
    shortDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={formatted}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="shortDate" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) =>
                `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              }
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
