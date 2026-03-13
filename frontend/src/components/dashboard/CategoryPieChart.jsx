import { PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export default function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-center py-8 text-muted-foreground">No data available</p>;
  }

  const chartData = data.map((d, i) => ({
    name: d.category,
    value: Number(d.revenue),
    percentage: d.percentage,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const chartConfig = Object.fromEntries(
    chartData.map((d) => [d.name, { label: d.name, color: d.fill }])
  );

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ChartContainer config={chartConfig} className="h-[200px] w-full max-w-[200px] flex-shrink-0">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) =>
                  `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })} (${Number(item.payload.percentage).toFixed(1)}%)`
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
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} stroke={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-col gap-2 text-xs min-w-0 flex-1">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.fill }} />
            <span className="text-muted-foreground truncate flex-1">{d.name}</span>
            <span className="font-medium flex-shrink-0">{Number(d.percentage).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
