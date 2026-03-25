interface GeometricPatternProps {
  variant?: 'dots' | 'grid' | 'diagonal' | 'hexagons';
  opacity?: number;
  className?: string;
}

/**
 * Subtle geometric pattern overlay (SVG or CSS)
 * Low opacity (5-10%) for use under glass elements
 */
export function GeometricPattern({
  variant = 'dots',
  opacity = 0.08,
  className = '',
}: GeometricPatternProps) {
  const patterns = {
    dots: (
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    ),
    grid: (
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity={opacity}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    ),
    diagonal: (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 12px,
            rgba(255, 255, 255, ${opacity}) 12px,
            rgba(255, 255, 255, ${opacity}) 13px
          )`,
        }}
      />
    ),
    hexagons: (
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" x="0" y="0" width="56" height="97" patternUnits="userSpaceOnUse">
            <path
              d="M28 0l24 14v28l-24 14-24-14V14z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity={opacity}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
    ),
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none text-foreground-primary ${className}`}>
      {patterns[variant]}
    </div>
  );
}
