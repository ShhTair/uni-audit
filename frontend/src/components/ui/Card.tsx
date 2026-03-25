import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef, type ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  children: ReactNode;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'bg-surface-card border border-border-default',
  elevated:
    'bg-surface-card border border-border-default shadow-lg dark:shadow-2xl dark:shadow-black/20',
  outlined:
    'bg-transparent border border-border-default',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', children, hoverable = false, padding = 'md', className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl backdrop-blur-sm',
          variantClasses[variant],
          paddingClasses[padding],
          hoverable && 'cursor-pointer',
          className
        )}
        whileHover={
          hoverable
            ? {
                y: -2,
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.1)',
                transition: { duration: 0.2 },
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
