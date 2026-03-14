import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAccountPreferences } from '@/lib/preferences';

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
};

export default function SalesChart({ data }) {
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
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={formatted}>
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
          tick={{ fontSize: 10 }}
          width={58}
          tickFormatter={(value) => {
            const amount = Number(value || 0);
            return `PHP ${
              amount >= 1000
                ? `${Math.round(amount / 1000)}k`
                : formatNumber(amount)
            }`;
          }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) =>
                `PHP ${formatNumber(value, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
