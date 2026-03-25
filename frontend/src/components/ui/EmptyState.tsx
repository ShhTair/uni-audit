import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: any;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  children?: ReactNode;
  className?: string;
}

/**
 * Consistent empty state: icon, title, optional description, primary action.
 */
export function EmptyState({ icon: Icon, title, description, action, children, className = '' }: EmptyStateProps) {
  const ActionIcon = action?.icon;
  return (
    <div
      className={`rounded-lg border border-border bg-card p-8 text-center ${className}`}
      role="status"
      aria-label={title}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900/50 mx-auto mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-base font-semibold font-display text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 btn-primary py-2 px-5 rounded-lg text-sm inline-flex items-center gap-2"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" aria-hidden />}
          {action.label}
        </button>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
export default EmptyState;
