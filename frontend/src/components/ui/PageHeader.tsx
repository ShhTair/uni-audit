import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * PageHeader — Clean, minimal page heading.
 */
export function PageHeader({ title, description, subtitle, actions }: PageHeaderProps) {
  const desc = description || subtitle;
  return (
    <div className="mb-6 pb-5 border-b border-border-subtle">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold font-display text-foreground tracking-tight">{title}</h1>
          {desc && (
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{desc}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
