/**
 * Skeleton loader вЂ” shimmer placeholder for async content
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-cf-md bg-surface-sunken ${className}`}
      aria-hidden
    />
  );
}

/** Row of stat skeletons (e.g. Dashboard 4 cards) */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-cf-xl p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-cf-lg" />
          <div className="flex-1 min-w-0 space-y-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** List of card skeletons (e.g. VM cards) */
export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-cf-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-cf-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-cf-md" />
            <Skeleton className="h-8 w-20 rounded-cf-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table skeleton (header + rows) */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card rounded-cf-xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-5 py-3 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-3 border-b border-border-subtle last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'max-w-35' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Detail page skeleton (title, info grid, content block) */
export function SkeletonDetail() {
  return (
    <div className="space-y-6">
      {/* Title area */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-cf-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-cf-lg p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      {/* Content block */}
      <div className="glass-card rounded-cf-xl p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-4 w-full ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-32 w-full ${className}`} />;
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-64 w-full ${className}`} />;
}
