import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   PLAYGROUND — 44 CSS effects, patterns, animations & illustrations
   Synced with landing design: soft glass, no harsh borders, rounded-2xl
   ═══════════════════════════════════════════════════════════ */

function Card({ title, children, span }: { title: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white/[0.06] overflow-hidden group ${span ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <div className="px-4 py-2 border-b border-white/[0.08]">
        <h3 className="text-[11px] text-foreground-muted/80 font-medium">{title}</h3>
      </div>
      <div className="p-0">{children}</div>
    </div>
  );
}

export default function PlaygroundPage() {
  const [theme, setTheme] = useState("dark"); const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark"); useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  const [hoveredEffect, setHoveredEffect] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header — synced with landing: compact pill nav */}
      <header className="sticky top-0 z-30 glass-frosted border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-12">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-foreground-muted/60 hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="text-[11px]">Назад</span>
            </Link>
            <div className="w-px h-4 bg-white/[0.06]" />
            <h1 className="text-xs font-medium font-display text-foreground/80">Playground — CSS Effects & Patterns</h1>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/[0.04] transition-colors" aria-label="Сменить тему">
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-foreground-muted/50" /> : <Moon className="h-3.5 w-3.5 text-foreground-muted/50" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ═══ BACKGROUND PATTERNS ═══ */}
        <p className="text-[10px] text-foreground-muted/60 tracking-widest uppercase mb-4">Паттерны фона</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {[
            { n: 1, title: 'Dot Pattern', cls: 'bg-dots' },
            { n: 2, title: 'Grid Pattern', cls: 'bg-grid' },
            { n: 3, title: 'Circuit Pattern', cls: 'bg-circuit' },
            { n: 4, title: 'Constellation', cls: 'bg-constellation' },
            { n: 5, title: 'Hexagon Pattern', cls: 'bg-hexagons' },
            { n: 6, title: 'Mesh Pattern', cls: 'bg-mesh' },
            { n: 7, title: 'Diagonal Stripes', cls: 'bg-diagonal' },
            { n: 8, title: 'Topographic', cls: 'bg-topo' },
            { n: 9, title: 'Crosshatch', cls: 'bg-crosshatch' },
            { n: 10, title: 'Concentric Rings', cls: 'bg-rings' },
            { n: 11, title: 'Grid Lines', cls: 'bg-grid-pattern' },
            { n: 12, title: 'Checkerboard', cls: 'bg-checkerboard' },
            { n: 13, title: 'Zigzag', cls: 'bg-zigzag' },
            { n: 14, title: 'Diamond Grid', cls: 'bg-diamond' },
            { n: 15, title: 'Waves', cls: 'bg-waves' },
            { n: 16, title: 'Brick Wall', cls: 'bg-brick' },
            { n: 17, title: 'Carbon Fiber', cls: 'bg-carbon' },
            { n: 18, title: 'Noise Grain', cls: 'bg-noise' },
          ].map(({ n, title, cls }) => (
            <Card key={n} title={`${n}. ${title}`}>
              <div className={`h-36 ${cls} bg-background relative flex items-center justify-center`}>
                <span className="text-[10px] text-foreground-muted/60 bg-background/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full">.{cls}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* ═══ GLASS EFFECTS ═══ */}
        <p className="text-[10px] text-foreground-muted/60 tracking-widest uppercase mb-4">Стеклянные эффекты</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          <Card title="19. Glass Levels">
            <div className="h-48 bg-dots bg-background p-4 flex flex-col gap-1.5 justify-center">
              {['glass-subtle', 'glass', 'glass-card', 'glass-hero', 'glass-frosted', 'glass-heavy'].map((g) => (
                <div key={g} className={`${g} rounded-xl px-3 py-1.5 text-[10px] text-foreground/80`}>{g}</div>
              ))}
            </div>
          </Card>
          <Card title="20. Superhuman Glass">
            <div className="h-48 bg-constellation bg-background p-4 flex items-center justify-center">
              <div className="glass-sh rounded-2xl p-4 w-full max-w-[200px]">
                <p className="text-[11px] text-foreground/80 text-center">.glass-sh</p>
                <div className="glass-sh-inner rounded-xl p-2 mt-2">
                  <p className="text-[10px] text-foreground-muted/60 text-center">.glass-sh-inner</p>
                </div>
              </div>
            </div>
          </Card>
          <Card title="21. Glass Panel">
            <div className="h-48 bg-grid bg-background p-4 flex items-center justify-center">
              <div className="glass-panel rounded-2xl p-4 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-error" />
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <div className="h-2 w-2 rounded-full bg-success" />
                </div>
                <div className="h-3 w-3/4 bg-white/[0.08] rounded mb-1.5" />
                <div className="h-3 w-1/2 bg-white/[0.06] rounded" />
              </div>
            </div>
          </Card>
        </div>

        {/* ═══ ANIMATIONS & INTERACTIONS ═══ */}
        <p className="text-[10px] text-foreground-muted/60 tracking-widest uppercase mb-4">Анимации & интерактив</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          <Card title="22. Pulse Ring">
            <div className="h-48 bg-background flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-brand-primary/15 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-3 rounded-full bg-brand-primary/8 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="relative h-12 w-12 rounded-full bg-brand-primary/8 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full bg-brand-primary/60 animate-pulse" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="23. Hover Effects">
            <div className="h-48 bg-background p-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Lift', cls: 'hover:-translate-y-1' },
                { label: 'Scale', cls: 'hover:scale-105' },
                { label: 'Glow', cls: 'hover:shadow-lg hover:shadow-brand-primary/20' },
                { label: 'Rotate', cls: 'hover:rotate-2' },
              ].map((e) => (
                <div key={e.label} className={`bg-white/[0.06] rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 ${e.cls}`}>
                  <span className="text-[10px] text-foreground-muted/60">{e.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="24. Orbit Animation">
            <div className="h-48 bg-background flex items-center justify-center">
              <div className="relative h-24 w-24">
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-brand-primary/40" />
                {/* Orbit 1 */}
                <div className="absolute inset-0 rounded-full border border-white/[0.04] animate-spin" style={{ animationDuration: '8s' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-purple-400/60" />
                </div>
                {/* Orbit 2 */}
                <div className="absolute inset-2 rounded-full border border-white/[0.03] animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="25. Breathing Blob">
            <div className="h-48 bg-background flex items-center justify-center overflow-hidden">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-primary/30 to-purple-500/30 animate-pulse blur-xl" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-primary/20 to-purple-500/20 animate-pulse blur-lg" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-primary/40 to-purple-500/40 animate-pulse" style={{ animationDuration: '4s' }} />
              </div>
            </div>
          </Card>

          <Card title="26. Typing Dots">
            <div className="h-48 bg-background flex items-center justify-center">
              <div className="flex gap-1.5 bg-white/[0.03] rounded-full px-4 py-2.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-2 w-2 rounded-full bg-foreground-muted/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
                ))}
              </div>
            </div>
          </Card>

          <Card title="27. Progress Ring">
            <div className="h-48 bg-background flex items-center justify-center">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" className="text-white/[0.04]" strokeWidth="3" />
                  <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" className="text-brand-primary/60" strokeWidth="3" strokeDasharray="220" strokeDashoffset="55" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="3s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground/60">75%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="28. Shimmer Loading">
            <div className="h-48 bg-background p-4 flex flex-col gap-2 justify-center">
              <div className="h-4 rounded-lg bg-gradient-to-r from-white/[0.04] via-white/[0.10] to-white/[0.04] animate-shimmer" />
              <div className="h-4 w-3/4 rounded-lg bg-gradient-to-r from-white/[0.04] via-white/[0.10] to-white/[0.04] animate-shimmer" style={{ animationDelay: '0.15s' }} />
              <div className="h-4 w-1/2 rounded-lg bg-gradient-to-r from-white/[0.04] via-white/[0.10] to-white/[0.04] animate-shimmer" style={{ animationDelay: '0.3s' }} />
              <div className="h-8 w-full rounded-xl bg-gradient-to-r from-white/[0.04] via-white/[0.10] to-white/[0.04] animate-shimmer mt-2" style={{ animationDelay: '0.45s' }} />
            </div>
          </Card>

          <Card title="29. Floating Particles">
            <div className="h-48 bg-background relative overflow-hidden flex items-center justify-center">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-brand-primary/30 animate-float"
                  style={{
                    width: `${4 + (i % 3) * 3}px`,
                    height: `${4 + (i % 3) * 3}px`,
                    left: `${10 + (i * 7) % 80}%`,
                    top: `${15 + (i * 11) % 70}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: `${3 + (i % 3)}s`,
                  }}
                />
              ))}
              <span className="text-[10px] text-foreground-muted/60 relative z-10">Particles</span>
            </div>
          </Card>

          <Card title="30. Morphing Shape">
            <div className="h-48 bg-background flex items-center justify-center">
              <div
                className="h-16 w-16 bg-gradient-to-br from-brand-primary/30 to-purple-500/30 animate-morph"
              />
            </div>
          </Card>
        </div>

        {/* ═══ GRADIENTS & COLOR ═══ */}
        <p className="text-[10px] text-foreground-muted/60 tracking-widest uppercase mb-4">Градиенты & цвет</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          <Card title="31. Brand Gradient & Glow">
            <div className="h-36 bg-background flex items-center justify-center gap-3 p-4">
              <div className="h-14 w-14 rounded-2xl bg-brand-gradient shadow-lg shadow-brand-primary/20 flex items-center justify-center text-white font-display font-semibold text-lg">Z</div>
              <div className="h-14 w-14 rounded-full bg-brand-gradient animate-pulse shadow-lg shadow-brand-primary/30 flex items-center justify-center text-white font-display font-medium text-sm">AI</div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-400/60 to-brand-primary/60 shadow-lg shadow-purple-500/20 flex items-center justify-center text-white font-display font-medium text-[11px]">Zeph</div>
            </div>
          </Card>

          <Card title="32. Gradient Mesh">
            <div className="h-36 relative overflow-hidden rounded-b-2xl">
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-600/20 via-transparent to-brand-primary/20 blur-2xl" />
              <div className="absolute -inset-4 bg-gradient-to-tl from-blue-500/10 via-transparent to-rose-500/10 blur-2xl" />
              <div className="relative h-full flex items-center justify-center">
                <span className="text-[10px] text-foreground-muted/60">Gradient Mesh</span>
              </div>
            </div>
          </Card>

          <Card title="33. Aurora Glow">
            <div className="h-36 bg-background relative overflow-hidden flex items-center justify-center">
              <div className="absolute bottom-0 left-0 right-0 h-3/4">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 via-purple-500/5 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/8 via-transparent to-transparent animate-pulse" style={{ animationDuration: '6s' }} />
              </div>
              <span className="text-[10px] text-foreground-muted/60 relative z-10">Aurora</span>
            </div>
          </Card>

          <Card title="34. Conic Gradient">
            <div className="h-36 bg-background flex items-center justify-center">
              <div className="h-20 w-20 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(6,214,160,0.3), rgba(147,51,234,0.3), rgba(59,130,246,0.3), rgba(6,214,160,0.3))' }} />
            </div>
          </Card>

          <Card title="35. Color Strips">
            <div className="h-36 bg-background p-4 flex items-center gap-1">
              {['bg-brand-primary/40', 'bg-purple-400/40', 'bg-blue-400/40', 'bg-emerald-400/40', 'bg-amber-400/40', 'bg-rose-400/40', 'bg-sky-400/40', 'bg-indigo-400/40'].map((c, i) => (
                <div key={i} className={`flex-1 h-full rounded-lg ${c} transition-all hover:flex-[2]`} />
              ))}
            </div>
          </Card>

          <Card title="36. Radial Burst">
            <div className="h-36 bg-background flex items-center justify-center overflow-hidden">
              <div className="h-28 w-28 rounded-full" style={{
                background: 'radial-gradient(circle, rgba(6,214,160,0.2) 0%, transparent 50%), radial-gradient(circle at 30% 30%, rgba(147,51,234,0.15) 0%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.15) 0%, transparent 40%)',
              }} />
            </div>
          </Card>
        </div>

        {/* ═══ ILLUSTRATIONS & SVG ═══ */}
        <p className="text-[10px] text-foreground-muted/60 tracking-widest uppercase mb-4">Иллюстрации & SVG</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          <Card title="37. Waveform">
            <div className="h-36 bg-background flex items-end justify-center gap-[2px] p-4 pb-6">
              {Array.from({ length: 32 }).map((_, i) => {
                const h = 15 + Math.sin(i * 0.4) * 40 + Math.cos(i * 0.7) * 20;
                return (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-brand-primary/30 animate-pulse"
                    style={{ height: `${Math.max(4, h)}%`, animationDelay: `${i * 0.05}s`, animationDuration: '2s' }}
                  />
                );
              })}
            </div>
          </Card>

          <Card title="38. Node Graph">
            <div className="h-36 bg-background relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 144">
                {/* Edges */}
                <line x1="60" y1="40" x2="150" y2="72" stroke="currentColor" className="text-brand-primary/30" strokeWidth="1" />
                <line x1="150" y1="72" x2="240" y2="50" stroke="currentColor" className="text-purple-400/30" strokeWidth="1" />
                <line x1="150" y1="72" x2="100" y2="110" stroke="currentColor" className="text-blue-400/30" strokeWidth="1" />
                <line x1="100" y1="110" x2="200" y2="105" stroke="currentColor" className="text-emerald-400/30" strokeWidth="1" />
                <line x1="240" y1="50" x2="200" y2="105" stroke="currentColor" className="text-amber-400/30" strokeWidth="1" />
                {/* Nodes */}
                <circle cx="60" cy="40" r="4" className="fill-brand-primary/60" />
                <circle cx="150" cy="72" r="5" className="fill-purple-400/60" />
                <circle cx="240" cy="50" r="4" className="fill-blue-400/60" />
                <circle cx="100" cy="110" r="3.5" className="fill-emerald-400/60" />
                <circle cx="200" cy="105" r="4" className="fill-amber-400/60" />
              </svg>
            </div>
          </Card>

          <Card title="39. Pie Chart">
            <div className="h-36 bg-background flex items-center justify-center">
              <svg className="h-20 w-20" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-brand-primary/30" strokeWidth="8" strokeDasharray="113 283" strokeLinecap="round" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-purple-400/30" strokeWidth="8" strokeDasharray="85 283" strokeDashoffset="-113" strokeLinecap="round" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-blue-400/30" strokeWidth="8" strokeDasharray="85 283" strokeDashoffset="-198" strokeLinecap="round" transform="rotate(-90 50 50)" />
              </svg>
            </div>
          </Card>

          <Card title="40. Sparkline">
            <div className="h-36 bg-background flex items-center justify-center p-6">
              <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(6,214,160)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="rgb(6,214,160)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 Q20,55 40,45 T80,30 T120,50 T160,20 T200,35" fill="none" stroke="currentColor" className="text-brand-primary/50" strokeWidth="1.5" />
                <path d="M0,60 Q20,55 40,45 T80,30 T120,50 T160,20 T200,35 V80 H0 Z" fill="url(#spark-fill)" />
              </svg>
            </div>
          </Card>

          <Card title="41. Isometric Cube">
            <div className="h-36 bg-background flex items-center justify-center">
              <svg className="h-20 w-24" viewBox="0 0 100 80">
                {/* Top face */}
                <polygon points="50,10 90,30 50,50 10,30" fill="currentColor" className="text-brand-primary/20" />
                {/* Right face */}
                <polygon points="90,30 90,55 50,75 50,50" fill="currentColor" className="text-brand-primary/10" />
                {/* Left face */}
                <polygon points="10,30 50,50 50,75 10,55" fill="currentColor" className="text-brand-primary/15" />
                {/* Edges */}
                <polygon points="50,10 90,30 50,50 10,30" fill="none" stroke="currentColor" className="text-brand-primary/30" strokeWidth="0.5" />
                <polygon points="90,30 90,55 50,75 50,50" fill="none" stroke="currentColor" className="text-brand-primary/20" strokeWidth="0.5" />
                <polygon points="10,30 50,50 50,75 10,55" fill="none" stroke="currentColor" className="text-brand-primary/25" strokeWidth="0.5" />
              </svg>
            </div>
          </Card>

          <Card title="42. Radar Chart">
            <div className="h-36 bg-background flex items-center justify-center">
              <svg className="h-24 w-24" viewBox="0 0 100 100">
                {/* Grid */}
                {[40, 30, 20, 10].map((r) => (
                  <polygon key={r} points={`50,${50-r} ${50+r*0.87},${50-r*0.5} ${50+r*0.87},${50+r*0.5} 50,${50+r} ${50-r*0.87},${50+r*0.5} ${50-r*0.87},${50-r*0.5}`} fill="none" stroke="currentColor" className="text-white/[0.04]" strokeWidth="0.5" />
                ))}
                {/* Data */}
                <polygon points="50,15 82,35 78,70 50,85 25,65 22,30" fill="currentColor" className="text-brand-primary/10" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
          </Card>
        </div>

        {/* ═══ MICRO INTERACTIONS ═══ */}
        <p className="text-[10px] text-foreground-muted/60 tracking-widest uppercase mb-4">Микровзаимодействия</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          <Card title="43. Toggle Switch">
            <ToggleDemo />
          </Card>

          <Card title="44. Ripple Button">
            <div className="h-36 bg-background flex items-center justify-center">
              <RippleButton />
            </div>
          </Card>
        </div>

        {/* ═══ PALETTE & TYPE ═══ */}
        <p className="text-[10px] text-foreground-muted/60 tracking-widest uppercase mb-4">Палитра & типографика</p>
        <div className="grid grid-cols-1 gap-3 mb-10">
          {/* Color palette */}
          <div className="rounded-2xl bg-white/[0.06] p-6">
            <p className="text-[11px] text-foreground-muted/80 font-medium mb-4">Цветовая палитра</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { name: 'Brand', cls: 'bg-brand-primary' },
                { name: 'Purple', cls: 'bg-purple-400' },
                { name: 'Blue', cls: 'bg-blue-400' },
                { name: 'Success', cls: 'bg-success' },
                { name: 'Warning', cls: 'bg-warning' },
                { name: 'Error', cls: 'bg-error' },
                { name: 'Info', cls: 'bg-info' },
                { name: 'Lavender', cls: 'bg-lavender' },
              ].map((c) => (
                <div key={c.name} className="text-center">
                  <div className={`h-10 rounded-xl ${c.cls} mb-1.5 opacity-90`} />
                  <p className="text-[10px] text-foreground-muted/60">{c.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="rounded-2xl bg-white/[0.06] p-6">
            <p className="text-[11px] text-foreground-muted/80 font-medium mb-4">Типографика</p>
            <div className="space-y-2">
              <p className="text-3xl font-semibold font-display text-foreground/90">Display — font-display semibold</p>
              <p className="text-xl font-medium font-display text-foreground/80">Heading — font-display medium</p>
              <p className="text-base text-foreground/70">Body — base text</p>
              <p className="text-sm text-foreground-muted/60">Muted — sm text</p>
              <p className="text-xs font-mono text-brand-primary/70">Mono — font-mono xs</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="rounded-2xl bg-white/[0.06] p-6">
            <p className="text-[11px] text-foreground-muted/80 font-medium mb-4">Кнопки</p>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary py-2 px-4 rounded-xl text-sm">Primary</button>
              <button className="btn-ghost py-2 px-4 rounded-xl text-sm">Ghost</button>
              <button className="py-2 px-4 rounded-xl text-sm bg-white/[0.06] hover:bg-white/[0.10] text-foreground/70 transition-colors">Outline</button>
              <button className="py-2 px-4 rounded-xl text-sm bg-error/12 text-error/80 hover:bg-error/18 transition-colors">Danger</button>
              <button className="py-2 px-4 rounded-full text-sm bg-brand-primary/12 text-brand-primary/80 hover:bg-brand-primary/18 transition-colors">Pill</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Toggle Demo ── */
function ToggleDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="h-36 bg-background flex items-center justify-center gap-4">
      <button onClick={() => setOn(!on)} className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${on ? 'bg-brand-primary/60' : 'bg-white/[0.06]'}`}>
        <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${on ? 'translate-x-5' : ''}`} />
      </button>
      <span className="text-[11px] text-foreground-muted/60">{on ? 'On' : 'Off'}</span>
    </div>
  );
}

/* ── Ripple Button ── */
function RippleButton() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const btnRef = { current: null as HTMLButtonElement | null };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  };

  return (
    <button
      onClick={handleClick}
      className="relative overflow-hidden bg-brand-primary/80 hover:bg-brand-primary text-white py-2 px-6 rounded-xl text-sm transition-colors"
    >
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
        />
      ))}
      <span className="relative z-10">Click me</span>
    </button>
  );
}
