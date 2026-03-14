import { Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAccountPreferences } from '@/lib/preferences';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export default function CategoryPieChart({ data }) {
  const { formatNumber } = useAccountPreferences();

  if (!data || data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data available
      </p>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.category,
    value: Number(item.revenue),
    percentage: item.percentage,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const chartConfig = Object.fromEntries(
    chartData.map((item) => [item.name, { label: item.name, color: item.fill }]),
  );

  return (
    <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row">
      <ChartContainer
        config={chartConfig}
        className="h-[200px] w-full max-w-[200px] shrink-0"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) =>
                  `PHP ${formatNumber(value, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} (${Number(item.payload.percentage).toFixed(1)}%)`
                }
                hideLabel
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={44}
            outerRadius={72}
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} stroke={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="flex min-w-0 flex-1 flex-col gap-2 text-xs">
        {chartData.map((item) => (
          <div key={item.name} className="flex min-w-0 items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: item.fill }}
            />
            <span className="flex-1 truncate text-muted-foreground">
              {item.name}
            </span>
            <span className="shrink-0 font-medium">
              {Number(item.percentage).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
