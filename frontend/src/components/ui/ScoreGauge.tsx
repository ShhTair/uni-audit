import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 64, stroke: 4, fontSize: 'text-sm', labelSize: 'text-[10px]' },
  md: { width: 96, stroke: 5, fontSize: 'text-xl', labelSize: 'text-xs' },
  lg: { width: 128, stroke: 6, fontSize: 'text-3xl', labelSize: 'text-sm' },
};

export default function ScoreGauge({
  score,
  size = 'md',
  label,
  showLabel = true,
  className,
}: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.width / 2;

  const motionScore = useMotionValue(0);
  const displayScore = useTransform(motionScore, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 1.2,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [score, motionScore]);

  const strokeDashoffset = useTransform(
    motionScore,
    [0, 100],
    [circumference, 0]
  );

  const getStrokeColor = (s: number) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#F97316';
    return '#EF4444';
  };

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          width={config.width}
          height={config.width}
          className="transform -rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-border-default"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className={cn('font-bold', config.fontSize, getScoreColor(score))}>
            {displayScore}
          </motion.span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          {label && (
            <p className={cn('font-medium text-foreground', config.labelSize)}>
              {label}
            </p>
          )}
          <p className={cn('text-muted-foreground', config.labelSize)}>
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
}
