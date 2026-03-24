import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'h-4 rounded-md bg-light-border dark:bg-dark-border animate-pulse',
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5 space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-light-border dark:bg-dark-border animate-pulse" />
        <div className="space-y-2 flex-1">
          <SkeletonLine className="w-2/3" />
          <SkeletonLine className="w-1/3 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-4/5" />
        <SkeletonLine className="w-3/5" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine className="w-16 h-6 rounded-full" />
        <SkeletonLine className="w-20 h-6 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5',
        className
      )}
    >
      <SkeletonLine className="w-1/3 h-5 mb-6" />
      <div className="flex items-end gap-2 h-40">
        {[40, 65, 45, 80, 55, 70, 35, 90, 60, 75].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-light-border dark:bg-dark-border animate-pulse rounded-t-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-light-border dark:bg-dark-border animate-pulse rounded-md',
        className
      )}
    />
  );
}
