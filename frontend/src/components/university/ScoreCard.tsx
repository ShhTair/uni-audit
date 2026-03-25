import { motion } from 'framer-motion';
import { cn, getScoreColor, getScoreBgColor } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ScoreCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  colorByScore?: number;
  className?: string;
}

export default function ScoreCard({
  icon,
  label,
  value,
  suffix,
  colorByScore,
  className,
}: ScoreCardProps) {
  return (
    <motion.div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border border-border bg-card',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          colorByScore !== undefined
            ? `${getScoreBgColor(colorByScore)}/10`
            : 'bg-primary/10'
        )}
      >
        <span
          className={cn(
            colorByScore !== undefined
              ? getScoreColor(colorByScore)
              : 'text-primary'
          )}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">
          {label}
        </p>
        <p
          className={cn(
            'text-xl font-bold',
            colorByScore !== undefined
              ? getScoreColor(colorByScore)
              : 'text-foreground'
          )}
        >
          {value}
          {suffix && (
            <span className="text-sm font-normal text-muted-foreground ml-0.5">
              {suffix}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
