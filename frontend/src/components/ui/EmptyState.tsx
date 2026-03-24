import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Button from './Button';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-light-hover dark:bg-dark-hover flex items-center justify-center text-light-muted dark:text-dark-muted mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
        {title}
      </h3>
      <p className="text-sm text-light-muted dark:text-dark-muted max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
