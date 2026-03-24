import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  subtitle?: string;
  className?: string;
}

export default function Header({
  title,
  breadcrumbs,
  actions,
  subtitle,
  className,
}: HeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-light-muted dark:text-dark-muted mb-2">
          <Link
            to="/"
            className="hover:text-light-text dark:hover:text-dark-text transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5" />
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="hover:text-light-text dark:hover:text-dark-text transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-light-text dark:text-dark-text font-medium">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
