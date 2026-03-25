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
    'bg-card border border-border',
  elevated:
    'bg-card border border-border shadow-sm dark:shadow-md ',
  outlined:
    'bg-transparent border border-border',
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
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
