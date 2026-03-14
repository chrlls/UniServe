import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function StatusPillSkeleton({ className }) {
  return <Skeleton className={cn('h-6 w-20 rounded-full', className)} />;
}

function TableRowSkeleton({ withThumb = true, compact = false }) {
  return (
    <div className="rounded-xl px-3 py-2">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {withThumb ? <Skeleton className="h-10 w-10 rounded-lg" /> : null}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <StatusPillSkeleton className="h-7 w-16" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>

      <div className={cn('hidden md:grid md:items-center md:gap-3', compact ? 'md:grid-cols-[minmax(120px,1.6fr)_0.9fr_0.7fr_0.8fr_70px]' : 'md:grid-cols-[minmax(160px,1.5fr)_0.9fr_0.6fr_0.7fr_0.8fr_90px]')}>
        <div className="flex items-center gap-3 min-w-0">
          {withThumb ? <Skeleton className="h-10 w-10 rounded-lg" /> : null}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-14" />
        <StatusPillSkeleton className="h-7 w-16" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 8, withThumb = true, compact = false }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-1 p-3">
        <div className="flex items-center justify-between px-3 py-2 md:hidden">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="hidden md:grid md:grid-cols-[minmax(160px,1.5fr)_0.9fr_0.6fr_0.7fr_0.8fr_90px] items-center gap-3 px-3 py-2 text-xs">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRowSkeleton key={index} withThumb={withThumb} compact={compact} />
        ))}
      </CardContent>
    </Card>
  );
}

function ToolbarSkeleton({ dropdowns = 3, withAction = true }) {
  return (
    <Card className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Skeleton className="h-9 xl:col-span-2 rounded-lg" />
        {Array.from({ length: dropdowns }).map((_, index) => (
          <Skeleton key={index} className="h-9 rounded-lg" />
        ))}
        {withAction ? <Skeleton className="h-9 rounded-lg" /> : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card className="h-full rounded-2xl bg-card shadow-sm">
      <CardContent className="flex min-h-[116px] flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartShapeSkeleton({ type = 'bars' }) {
  if (type === 'pie') {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-3">
        <Skeleton className="h-28 w-28 sm:h-40 sm:w-40 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="flex justify-between gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 pt-4 h-48">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton
          key={index}
          className="w-full rounded-md"
          style={{ height: `${34 + ((index % 5) * 12)}%` }}
        />
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ titleWidth = 'w-32', descriptionWidth = 'w-48', type = 'bars', showFooter = true, className }) {
  return (
    <Card className={cn('rounded-2xl shadow-sm', className)}>
      <CardHeader className="pb-1 space-y-2">
        <Skeleton className={cn('h-4', titleWidth)} />
        <Skeleton className={cn('h-3', descriptionWidth)} />
      </CardHeader>
      <CardContent className="pb-4 pt-1">
        <ChartShapeSkeleton type={type} />
      </CardContent>
      {type === 'pie' && showFooter ? (
        <CardFooter className="flex-wrap gap-2 pb-4 pt-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-16" />
          ))}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function PageHeaderSkeleton({ withActions = true, withDate = false, subtitleLines = 1 }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-2">
        {withDate ? <Skeleton className="h-3 w-52 rounded-lg" /> : null}
        <Skeleton className="h-8 w-56 rounded-lg" />
        {Array.from({ length: subtitleLines }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-72 rounded-lg" />
        ))}
      </div>
      {withActions ? (
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      ) : null}
    </div>
  );
}

function ActivityListSkeleton({ rows = 5 }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <ul className="space-y-2">
          {Array.from({ length: rows }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <StatusPillSkeleton />
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pb-4 pt-3">
        <Skeleton className="h-3 w-24" />
      </CardFooter>
    </Card>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton withDate subtitleLines={1} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCardSkeleton type="bars" />
        <ChartCardSkeleton type="pie" />
        <ChartCardSkeleton type="line" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActivityListSkeleton rows={5} />
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pb-4 pt-3">
            <Skeleton className="h-3 w-24" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function MenuManagementSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton withActions />

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-28 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      <TableSkeleton rows={8} withThumb={false} />
    </div>
  );
}

export function InventoryPageSkeleton() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton withActions />

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="rounded-xl">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <ToolbarSkeleton dropdowns={3} withAction={false} />
      <TableSkeleton rows={8} withThumb={false} />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-44" />
        </CardHeader>
        <CardContent className="space-y-3 pt-0 pb-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function OrderQueueSkeleton({ isCashier = false }) {
  const columns = isCashier ? 3 : 4;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPillSkeleton className="w-24" />
          <StatusPillSkeleton className="w-24" />
          <StatusPillSkeleton className="w-24" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className={cn('flex w-full gap-4', isCashier ? 'min-w-[1060px]' : 'min-w-[1440px]')}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex min-w-[21.5rem] flex-1 basis-0 flex-col">
              <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-border/60 bg-card/95 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <StatusPillSkeleton className="h-6 w-8 rounded-full" />
              </div>
              <div className="flex min-h-[32rem] flex-1 flex-col rounded-b-2xl border border-t-0 border-border/60 bg-card/80 p-3 shadow-sm">
                {Array.from({ length: 3 }).map((__, cardIndex) => (
                  <Card key={cardIndex} className="mb-3 overflow-hidden rounded-2xl border border-border/55 border-l-[3px] border-l-border bg-card/95 shadow-sm">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <StatusPillSkeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-11/12" />
                        <Skeleton className="h-3 w-8/12" />
                      </div>
                      <Skeleton className="h-px w-full" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-10 flex-1 rounded-xl" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-border/50 px-1 pt-2">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-8 w-8 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function POSPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="mb-4">
          <Skeleton className="h-7 w-32" />
        </div>

        <div className="mb-3 flex shrink-0 flex-col gap-3">
          <Skeleton className="h-9 w-full rounded-lg" />

          <div className="flex overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Card key={index} className="rounded-xl border border-border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-9 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card className="w-80 lg:w-96 flex flex-col shrink-0 overflow-hidden">
        <CardHeader className="px-4 py-3 border-b shrink-0">
          <Skeleton className="h-5 w-24" />
        </CardHeader>

        <CardContent className="p-4 space-y-3 flex-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-6 w-6 rounded-md" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
          ))}
        </CardContent>

        <CardContent className="p-4 space-y-3 border-t shrink-0">
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-5 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton type="bars" className="rounded-xl" />
        <ChartCardSkeleton type="pie" showFooter={false} className="rounded-xl" />
      </div>

      <ChartCardSkeleton type="line" className="rounded-xl" />

      <Card>
        <CardHeader className="pb-0">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <TableSkeleton rows={6} withThumb={false} compact />
        </CardContent>
      </Card>
    </div>
  );
}
