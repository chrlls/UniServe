import { Spinner } from '@/components/ui/spinner';

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  const wrapperClass = fullScreen
    ? 'min-h-screen w-full flex items-center justify-center bg-background'
    : 'w-full py-10 flex items-center justify-center';

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 shadow-sm">
        <Spinner className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}
