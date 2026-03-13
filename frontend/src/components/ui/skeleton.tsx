import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted animate-pulse',
        'after:pointer-events-none after:absolute after:inset-0',
        'after:bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.45)_45%,transparent_100%)]',
        'after:bg-[length:220%_100%] after:animate-[shimmer_2.2s_ease-in-out_infinite]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
