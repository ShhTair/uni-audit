import { useMemo } from 'react';

/**
 * FloatingParticles — ambient animated dots floating across the page.
 * Inspired by Playground #29 but larger, brighter, and multi-colored.
 * Uses pure CSS animations, no JS runtime cost.
 */

const COLORS = [
  'rgba(120,119,255,0.35)',   // lavender
  'rgba(147,51,234,0.30)',    // purple
  'rgba(52,211,153,0.30)',    // emerald
  'rgba(59,130,246,0.25)',    // blue
  'rgba(236,72,153,0.20)',    // pink
  'rgba(255,197,49,0.22)',    // amber
];

const PARTICLE_COUNT = 18;

export function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const size = 3 + (i % 4) * 2;          // 3–9 px
      const left = 5 + ((i * 13) % 90);      // spread across width
      const top = 5 + ((i * 17) % 88);       // spread across height
      const delay = (i * 0.6) % 8;           // stagger animations
      const duration = 5 + (i % 4) * 2;      // 5–11s
      const color = COLORS[i % COLORS.length];

      return { size, left, top, delay, duration, color };
    });
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
