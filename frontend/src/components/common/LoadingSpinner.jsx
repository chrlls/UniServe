export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Two-ring spinner */}
      <div className="relative w-11 h-11">
        {/* Track ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: '3px solid var(--color-border-subtle)' }}
        />
        {/* Animated ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '3px solid transparent',
            borderTopColor: 'var(--color-accent)',
            borderRightColor: 'var(--color-accent)',
            opacity: 0.9,
          }}
        />
        {/* Glow dot */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full -translate-y-0.5"
          style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 0 6px var(--color-accent)' }}
        />
      </div>
      {message && (
        <p
          className="text-sm font-medium tracking-wide"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-16">
      {spinner}
    </div>
  );
}
