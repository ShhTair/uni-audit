import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Check, Layout, Bell, Shield, Key, Users, CreditCard, Bot, Server, Zap, Search, Settings, Plus, AlertTriangle, CheckCircle2, Info, X, ChevronRight, ChevronDown, MoreHorizontal, Copy, Terminal, ExternalLink, ArrowRight, Star, Heart, Send, Eye, EyeOff, Calendar, Mail, MessageSquare, Upload, Download, Trash2, Edit, Filter, Columns, Hash, Clock, Activity, Sparkles, ArrowLeft, type LucideIcon } from 'lucide-react';

/* ── Theme toggle for preview ── */
function ThemeToggle() {
 const [dark, setDark] = useState(document.documentElement.getAttribute('data-theme') !== 'light');
 const toggle = () => {
 const next = dark ? 'light' : 'dark';
 document.documentElement.setAttribute('data-theme', next);
 setDark(!dark);
 };
 return (
 <button onClick={toggle} className="flex items-center gap-2 rounded-cf-lg bg-surface-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-surface-hover" style={{ boxShadow: 'var(--theme-shadow-neu-flat)' }}>
 {dark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-brand-primary" />}
 {dark ? 'Light Theme' : 'Dark Theme'}
 </button>
 );
}

/* ── Color swatch ── */
function Swatch({ name, cssVar, className }: { name: string; cssVar: string; className?: string }) {
 const [copied, setCopied] = useState(false);
 const copy = () => {
 navigator.clipboard.writeText(`var(${cssVar})`);
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };
 return (
 <button onClick={copy} className="group text-left">
 <div className={`h-14 rounded-cf-md mb-2 transition-transform group-hover:scale-105 ${className || ''}`} style={className ? {} : { background: `var(${cssVar})` }} />
 <p className="text-xs font-medium text-foreground truncate">{name}</p>
 <p className="text-[10px] text-foreground-muted font-mono flex items-center gap-1">
 {copied ? <><Check className="h-3 w-3 text-success" /> Copied</> : cssVar}
 </p>
 </button>
 );
}

/* ── Section wrapper ── */
function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
 return (
 <section id={id} className="scroll-mt-24">
 <div className="mb-6">
 <h2 className="text-xl font-bold font-display text-foreground">{title}</h2>
 {description && <p className="text-sm text-foreground-muted mt-1">{description}</p>}
 </div>
 {children}
 </section>
 );
}

/* ── Card container for examples (glass minimal) ── */
function DemoCard({ title, children }: { title?: string; children: React.ReactNode }) {
 return (
 <div className="rounded-cf-xl glass border border-border-subtle/50 p-6 shadow-[var(--theme-shadow-neu-flat)]">
 {title && <h3 className="text-sm font-semibold text-foreground mb-4 text-overline">{title}</h3>}
 {children}
 </div>
 );
}

/* ── Navigation item ── */
const NAV_SECTIONS = [
 { group: 'Foundation', items: ['colors', 'lavender', 'theme-palette', 'typography', 'spacing', 'layout-tokens', 'shadows', 'effects', 'bg-patterns', 'gradients'] },
 { group: 'Components', items: ['buttons', 'inputs', 'chips', 'cards', 'badges', 'avatars', 'status-pills', 'status', 'toggles', 'sliders'] },
 { group: 'Overlays', items: ['modals', 'tooltips', 'dropdowns', 'command-palette', 'toasts'] },
 { group: 'Data Display', items: ['tables', 'stat-cards', 'lists', 'timeline', 'code-blocks', 'empty-states'] },
 { group: 'Patterns', items: ['forms', 'navigation', 'breadcrumbs', 'stepper', 'kbd', 'dividers', 'file-upload', 'feedback', 'loading'] },
 { group: 'Pages', items: ['knowledge-hub', 'workflows', 'commands', 'openclaw-configs', 'settings', 'analytics', 'terminal'] },
];

export default function Brandbook() {
 const [activeSection, setActiveSection] = useState('colors');
 const navScrollRef = useRef<HTMLDivElement>(null);

 // Auto-track active section on scroll via IntersectionObserver
 useEffect(() => {
   const allIds = NAV_SECTIONS.flatMap((g) => g.items);
   const observers: IntersectionObserver[] = [];
   allIds.forEach((id) => {
     const el = document.getElementById(id);
     if (!el) return;
     const obs = new IntersectionObserver(
       ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
       { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
     );
     obs.observe(el);
     observers.push(obs);
   });
   return () => observers.forEach((o) => o.disconnect());
 }, []);

 // Center active nav item in the sidebar — smooth scroll, clamped
 useEffect(() => {
   const container = navScrollRef.current;
   if (!container) return;
   const activeEl = container.querySelector(`[data-nav-item="${activeSection}"]`);
   if (!(activeEl instanceof HTMLElement)) return;
   const elTop = activeEl.offsetTop;
   const elHeight = activeEl.offsetHeight;
   const centerOffset = container.clientHeight / 2 - elHeight / 2;
   const targetScroll = Math.max(0, Math.min(elTop - centerOffset, container.scrollHeight - container.clientHeight));
   container.scrollTo({ top: targetScroll, behavior: 'smooth' });
 }, [activeSection]);

 const scrollTo = (id: string) => {
 setActiveSection(id);
 document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
 };

 return (
 <div className="min-h-screen bg-surface-base">
 {/* Header — fixed header (фиксированный хедер): остаётся сверху при скролле */}
 <header className="fixed inset-x-0 top-0 z-[100] glass-frosted border-b border-white/[0.04]" style={{ position: 'fixed' }}>
 <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Link to="/" className="flex items-center gap-1.5 text-foreground-muted/60 hover:text-foreground transition-colors mr-2">
 <ArrowLeft className="h-3.5 w-3.5" />
 <span className="text-[11px]">Назад</span>
 </Link>
 <div className="w-px h-4 bg-white/[0.06]" />
 <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-white font-display font-semibold text-[9px]">
 Z
 </div>
 <div>
 <h1 className="text-sm font-medium font-display text-foreground">Zeph AI Design System</h1>
 <p className="text-[10px] text-foreground-muted/40">v2.0</p>
 </div>
 </div>
 <ThemeToggle />
 </div>
 </header>

 <div className="max-w-7xl mx-auto px-6 pt-24 pb-8 flex gap-8">
 {/* Sidebar — sticky, scrollable; active item centered with smooth scroll */}
 <nav className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-6rem)]">
 <div ref={navScrollRef} className="glass rounded-cf-xl p-4 border border-border-subtle/50 space-y-6 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-6rem)] scroll-smooth">
 {NAV_SECTIONS.map((group) => (
 <div key={group.group}>
 <p className="text-overline mb-2 text-foreground-subtle">{group.group}</p>
 <div className="space-y-0.5">
 {group.items.map((item) => (
 <button
 key={item}
 data-nav-item={item}
 onClick={() => scrollTo(item)}
 className={`w-full text-left px-3 py-1.5 rounded-cf-md text-sm capitalize transition-colors ${
 activeSection === item
 ? 'bg-brand-primary/15 text-brand-primary font-medium'
 : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover/80'
 }`}
 >
 {item}
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 </nav>

 {/* Main content — minimal spacing, glass cards per section */}
 <main className="flex-1 space-y-20 min-w-0">

 {/* ═══════════ COLORS ═══════════ */}
 <Section id="colors" title="Colors" description="Complete color palette with semantic meaning. Click any swatch to copy the CSS variable.">
 <div className="space-y-8">
 <DemoCard title="SURFACES">
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
 <Swatch name="Base" cssVar="--theme-surface-base" />
 <Swatch name="Raised" cssVar="--theme-surface-raised" />
 <Swatch name="Sunken" cssVar="--theme-surface-sunken" />
 <Swatch name="Card" cssVar="--theme-surface-card" />
 <Swatch name="Overlay" cssVar="--theme-surface-overlay" />
 <Swatch name="Sidebar" cssVar="--theme-surface-sidebar" />
 <Swatch name="Input" cssVar="--theme-surface-input" />
 <Swatch name="Hover" cssVar="--theme-surface-hover" />
 <Swatch name="Active" cssVar="--theme-surface-active" />
 <Swatch name="Selected" cssVar="--theme-surface-selected" />
 </div>
 </DemoCard>

 <DemoCard title="BRAND">
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
 <Swatch name="Primary" cssVar="--theme-brand-primary" />
 <Swatch name="Primary Hover" cssVar="--theme-brand-primary-hover" />
 <Swatch name="Primary Active" cssVar="--theme-brand-primary-active" />
 <Swatch name="Primary Subtle" cssVar="--theme-brand-primary-subtle" />
 <Swatch name="Primary Muted" cssVar="--theme-brand-primary-muted" />
 <Swatch name="Secondary" cssVar="--theme-brand-secondary" />
 <Swatch name="Secondary Hover" cssVar="--theme-brand-secondary-hover" />
 <Swatch name="Secondary Subtle" cssVar="--theme-brand-secondary-subtle" />
 </div>
 </DemoCard>

 <DemoCard title="TEXT">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div><p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>Primary Text</p><p className="text-xs font-mono text-foreground-muted">--theme-text-primary</p></div>
 <div><p className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Secondary Text</p><p className="text-xs font-mono text-foreground-muted">--theme-text-secondary</p></div>
 <div><p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>Muted Text</p><p className="text-xs font-mono text-foreground-muted">--theme-text-muted</p></div>
 <div><p className="text-sm font-medium" style={{ color: 'var(--theme-text-subtle)' }}>Subtle Text</p><p className="text-xs font-mono text-foreground-muted">--theme-text-subtle</p></div>
 </div>
 </DemoCard>

 <DemoCard title="SEMANTIC">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <Swatch name="Success" cssVar="--theme-success" />
 <Swatch name="Warning" cssVar="--theme-warning" />
 <Swatch name="Error" cssVar="--theme-error" />
 <Swatch name="Info" cssVar="--theme-info" />
 </div>
 </DemoCard>

 <DemoCard title="BORDERS">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <Swatch name="Default" cssVar="--theme-border-default" />
 <Swatch name="Hover" cssVar="--theme-border-hover" />
 <Swatch name="Focus" cssVar="--theme-border-focus" />
 <Swatch name="Subtle" cssVar="--theme-border-subtle" />
 </div>
 </DemoCard>
 </div>
 </Section>

 {/* ═══════════ LAVENDER ═══════════ */}
 <Section id="lavender" title="Lavender / Purple Accent" description="The secondary accent color used across pills, active tabs, workflow nodes, and highlights.">
 <div className="space-y-6">
 <DemoCard title="LAVENDER PALETTE">
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
 <Swatch name="Lavender" cssVar="--theme-lavender" />
 <Swatch name="Hover" cssVar="--theme-lavender-hover" />
 <Swatch name="Active" cssVar="--theme-lavender-active" />
 <Swatch name="Subtle" cssVar="--theme-lavender-subtle" />
 <Swatch name="Muted" cssVar="--theme-lavender-muted" />
 </div>
 </DemoCard>
 <DemoCard title="LAVENDER IN CONTEXT">
 <div className="flex flex-wrap gap-3">
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-lavender/15 text-lavender border border-lavender/20">Active Tab</span>
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-lavender text-white">Solid Badge</span>
 <button className="px-4 py-2 rounded-cf-lg bg-lavender text-white text-sm font-medium hover:bg-lavender-hover transition-colors">Lavender Button</button>
 <button className="px-4 py-2 rounded-cf-lg bg-lavender/15 text-lavender text-sm font-medium border border-lavender/20 hover:bg-lavender/25 transition-colors">Outline</button>
 <div className="h-2 w-32 rounded-full bg-lavender/20 overflow-hidden"><div className="h-full w-2/3 rounded-full bg-lavender-gradient" /></div>
 </div>
 </DemoCard>
 <DemoCard title="GRADIENT">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="h-20 rounded-cf-lg bg-lavender-gradient" />
 <div className="h-20 rounded-cf-lg bg-lavender-glow" />
 <div className="h-20 rounded-cf-lg" style={{ background: 'linear-gradient(135deg, var(--theme-lavender) 0%, var(--theme-brand-primary) 100%)' }} />
 </div>
 </DemoCard>
 </div>
 </Section>

 {/* ═══════════ THEME PALETTE ═══════════ */}
 <Section id="theme-palette" title="Theme palette" description="High-contrast minimal palette. Dark: black base, clear steps; one brand blue.">
 <DemoCard title="Dark theme">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
 <div className="rounded-md p-2 border border-border-default" style={{ background: '#0a0a0a' }}><span className="text-[#fafafa]">#0a0a0a</span><p className="text-foreground-muted text-xs">surface-base</p></div>
 <div className="rounded-md p-2 border border-border-default" style={{ background: '#141414' }}><span className="text-[#fafafa]">#141414</span><p className="text-foreground-muted text-xs">surface-raised</p></div>
 <div className="rounded-md p-2 border border-border-default" style={{ background: '#171717' }}><span className="text-[#fafafa]">#171717</span><p className="text-foreground-muted text-xs">card</p></div>
 <div className="rounded-md p-2 border border-border-default" style={{ background: '#262626' }}><span className="text-[#fafafa]">#262626</span><p className="text-foreground-muted text-xs">border</p></div>
 <div className="rounded-md p-2" style={{ background: '#3b82f6', color: '#0a0a0a' }}><span>#3b82f6</span><p className="text-xs opacity-90">brand primary</p></div>
 <div className="rounded-md p-2" style={{ background: '#22c55e', color: '#0a0a0a' }}><span>#22c55e</span><p className="text-xs opacity-90">success / secondary</p></div>
 <div className="rounded-md p-2 bg-surface-card border border-border-default"><span style={{ color: '#fafafa' }}>#fafafa</span><p className="text-foreground-muted text-xs">text primary</p></div>
 <div className="rounded-md p-2 bg-surface-card border border-border-default"><span style={{ color: '#737373' }}>#737373</span><p className="text-foreground-muted text-xs">text muted</p></div>
 </div>
 </DemoCard>
 <DemoCard title="Light theme">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
 <div className="rounded-md p-2 border border-border-default bg-white"><span className="text-[#171717]">#ffffff</span><p className="text-foreground-muted text-xs">surface-base</p></div>
 <div className="rounded-md p-2 border border-border-default" style={{ background: '#fafafa' }}><span style={{ color: '#171717' }}>#fafafa</span><p className="text-foreground-muted text-xs">surface-raised</p></div>
 <div className="rounded-md p-2 border border-border-default" style={{ background: '#2563eb', color: 'white' }}><span>#2563eb</span><p className="text-xs opacity-90">brand primary</p></div>
 <div className="rounded-md p-2 border border-border-default" style={{ background: '#e5e5e5' }}><span style={{ color: '#171717' }}>#e5e5e5</span><p className="text-foreground-muted text-xs">border</p></div>
 </div>
 </DemoCard>
 </Section>

 {/* ═══════════ TYPOGRAPHY ═══════════ */}
 <Section id="typography" title="Typography" description="Font families, sizes, and weights used throughout Zeph AI.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">DISPLAY — Plus Jakarta Sans</p>
 <h1 className="text-4xl font-bold font-display text-foreground">Dashboard Overview</h1>
 <h2 className="text-2xl font-bold font-display text-foreground mt-2">Agent Configuration</h2>
 <h3 className="text-xl font-semibold font-display text-foreground mt-2">Server Settings</h3>
 <h4 className="text-lg font-semibold font-display text-foreground mt-2">API Key Management</h4>
 </div>
 <div className="border-t border-border-default pt-6">
 <p className="text-overline mb-3">BODY — Inter</p>
 <p className="text-base text-foreground">Regular body text — The quick brown fox jumps over the lazy dog.</p>
 <p className="text-sm text-foreground-secondary mt-2">Secondary text — Used for descriptions and helper text.</p>
 <p className="text-xs text-foreground-muted mt-2">Muted small text — Used for metadata and timestamps.</p>
 </div>
 <div className="border-t border-border-default pt-6">
 <p className="text-overline mb-3">MONO — JetBrains Mono</p>
 <code className="text-sm font-mono text-brand-primary bg-surface-sunken px-3 py-1.5 rounded-cf-md">
 const agent = await openclaw.create('assistant');
 </code>
 </div>
 <div className="border-t border-border-default pt-6">
 <p className="text-overline mb-3">SPECIAL</p>
 <p className="text-overline">Overline Label</p>
 <p className="text-metric-number text-4xl text-foreground mt-1">1,247</p>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ SPACING ═══════════ */}
 <Section id="spacing" title="Spacing & Radii" description="Consistent spacing scale and border radius tokens.">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <DemoCard title="BORDER RADII">
 <div className="space-y-3">
 {[
 { name: 'sm (6px)', cls: 'rounded-cf-sm' },
 { name: 'md (10px)', cls: 'rounded-cf-md' },
 { name: 'lg (14px)', cls: 'rounded-cf-lg' },
 { name: 'xl (20px)', cls: 'rounded-cf-xl' },
 { name: 'full', cls: 'rounded-cf-full' },
 ].map((r) => (
 <div key={r.name} className="flex items-center gap-4">
 <div className={`h-10 w-20 bg-brand-primary/20 border border-brand-primary/30 ${r.cls}`} />
 <span className="text-sm text-foreground font-mono">{r.name}</span>
 </div>
 ))}
 </div>
 </DemoCard>

 <DemoCard title="SPACING SCALE">
 <div className="space-y-2">
 {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((n) => (
 <div key={n} className="flex items-center gap-3">
 <div className="bg-brand-primary/30 rounded-sm" style={{ width: `${n * 4}px`, height: '16px' }} />
 <span className="text-xs text-foreground-muted font-mono">{n * 4}px ({n})</span>
 </div>
 ))}
 </div>
 </DemoCard>
 </div>
 </Section>

 {/* ═══════════ LAYOUT TOKENS ═══════════ */}
 <Section id="layout-tokens" title="Layout tokens" description="Chat rail, header height, and app shell. Chat is fixed (top: header bottom, bottom: viewport), resizable width, max 50vw.">
 <DemoCard>
 <div className="space-y-3 text-sm">
 <div className="flex items-center justify-between py-2 border-b border-border-default">
 <span className="font-mono text-foreground-muted">--height-header-total</span>
 <span className="text-foreground">77px</span>
 </div>
 <div className="flex items-center justify-between py-2 border-b border-border-default">
 <span className="font-mono text-foreground-muted">--chat-rail-width</span>
 <span className="text-foreground">Set by AppLayout (48px–50vw)</span>
 </div>
 <div className="flex items-center justify-between py-2 border-b border-border-default">
 <span className="font-mono text-foreground-muted">--width-chat-panel</span>
 <span className="text-foreground">320px default</span>
 </div>
 <div className="flex items-center justify-between py-2">
 <span className="font-mono text-foreground-muted">--width-chat-strip</span>
 <span className="text-foreground">48px (collapsed)</span>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ SHADOWS ═══════════ */}
 <Section id="shadows" title="Shadows" description="Layered shadow system for depth and elevation.">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
 {[
 { name: 'Flat', var: 'var(--theme-shadow-neu-flat)' },
 { name: 'Hover', var: 'var(--theme-shadow-neu-hover)' },
 { name: 'Pressed', var: 'var(--theme-shadow-neu-pressed)' },
 { name: 'Glow', var: 'var(--theme-shadow-cf-glow)' },
 { name: 'Large', var: 'var(--theme-shadow-lg)' },
 { name: 'Dialog', var: 'var(--theme-shadow-dialog)' },
 ].map((s) => (
 <div key={s.name} className="rounded-cf-lg bg-surface-card p-6 text-center" style={{ boxShadow: s.var }}>
 <p className="text-sm font-medium text-foreground">{s.name}</p>
 <p className="text-xs text-foreground-muted mt-1 font-mono">{s.name.toLowerCase()}</p>
 </div>
 ))}
 </div>
 </Section>


 {/* ═══════════ EFFECTS ═══════════ */}
 <Section id="effects" title="Effects & Textures" description="Grain, glass levels, and material effects. Glass grain is visible on all tiers.">
 <div className="space-y-6">
 {/* Glass Levels */}
 <DemoCard title="GLASS LEVELS (7 TIERS) — with enhanced grain">
 <p className="text-xs text-foreground-muted mb-4">Each glass tier has backdrop-blur + grain texture (opacity: 0.07). Place over patterned/gradient backgrounds for best effect.</p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { cls: 'glass-subtle', label: '.glass-subtle', desc: 'Nav bars, small overlays' },
 { cls: 'glass', label: '.glass', desc: 'Cards, dropdowns' },
 { cls: 'glass-heavy', label: '.glass-heavy', desc: 'Modals, feature cards' },
 { cls: 'glass-frosted', label: '.glass-frosted', desc: 'Prominent panels' },
 { cls: 'glass-hero', label: '.glass-hero', desc: 'Hero sections' },
 { cls: 'glass-card', label: '.glass-card', desc: 'Content containers' },
 { cls: 'glass-panel', label: '.glass-panel', desc: 'Full-height sidebars' },
 ].map((g) => (
 <div key={g.cls} className="relative overflow-hidden rounded-cf-md bg-mesh border border-border-default" style={{ minHeight: '100px' }}>
 <div className="absolute inset-0 bg-dots opacity-60" />
 <div className="relative flex flex-col items-center justify-center h-full p-3">
 <div className={`${g.cls} rounded-cf-md px-4 py-3 text-center`}>
 <p className="text-xs text-foreground font-mono font-medium">{g.label}</p>
 <p className="text-[10px] text-foreground-muted mt-0.5">{g.desc}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>

 {/* Glass over different pattern backgrounds */}
 <DemoCard title="GLASS OVER PATTERNS — the whole point">
 <p className="text-xs text-foreground-muted mb-4">Glass without patterns behind = invisible. Glass over patterns = magic. This is why background patterns are critical.</p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {[
 { bg: 'bg-mesh', label: 'Glass on Mesh' },
 { bg: 'bg-constellation', label: 'Glass on Constellation' },
 { bg: 'bg-hexagons', label: 'Glass on Hexagons' },
 { bg: 'bg-circuit', label: 'Glass on Circuit' },
 { bg: 'bg-dots', label: 'Glass on Dots' },
 { bg: 'bg-grid-glow', label: 'Glass on Grid Glow' },
 ].map((p) => (
 <div key={p.bg} className={`relative overflow-hidden rounded-cf-md ${p.bg} border border-border-default`} style={{ minHeight: '120px' }}>
 <div className="relative flex flex-col items-center justify-center h-full p-4 gap-2">
 <div className="glass rounded-cf-lg px-4 py-3 w-full">
 <p className="text-xs text-foreground font-medium text-center">{p.label}</p>
 <p className="text-[10px] text-foreground-muted text-center mt-1">backdrop-blur + grain</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>
 </div>
 </Section>

 {/* ═══════════ BACKGROUND PATTERNS ═══════════ */}
 <Section id="bg-patterns" title="Background Patterns" description="All 20+ CSS background patterns available for section backgrounds. These make glass effects visible and add visual depth.">
 <div className="space-y-6">
 {/* Geometric patterns */}
 <DemoCard title="GEOMETRIC PATTERNS">
 <p className="text-xs text-foreground-muted mb-4">Subtle repeating geometric textures. Use as absolute overlays with pointer-events-none.</p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { cls: 'bg-dots', label: '.bg-dots', desc: 'Small repeating dots' },
 { cls: 'bg-grid', label: '.bg-grid', desc: 'Thin grid lines' },
 { cls: 'bg-crosshatch', label: '.bg-crosshatch', desc: '45° cross lines' },
 { cls: 'bg-diagonal', label: '.bg-diagonal', desc: 'Diagonal stripes' },
 { cls: 'bg-hexagons', label: '.bg-hexagons', desc: 'Honeycomb pattern' },
 { cls: 'bg-circuit', label: '.bg-circuit', desc: 'Circuit board grid' },
 { cls: 'bg-rings', label: '.bg-rings', desc: 'Concentric pulse rings' },
 { cls: 'bg-topo', label: '.bg-topo', desc: 'Topographic contour map' },
 { cls: 'bg-dot-pattern', label: '.bg-dot-pattern', desc: 'Lavender dot grid (new)' },
 { cls: 'bg-grid-pattern', label: '.bg-grid-pattern', desc: 'Lavender grid lines (new)' },
 { cls: 'bg-diag-lines', label: '.bg-diag-lines', desc: 'Diagonal lavender lines (new)' },
 { cls: 'bg-mesh-pattern', label: '.bg-mesh-pattern', desc: 'Mesh gradient blobs (new)' },
 ].map((p) => (
 <div key={p.cls} className={`relative overflow-hidden rounded-cf-md border border-border-default ${p.cls}`} style={{ height: '120px' }}>
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
 <p className="text-xs text-foreground font-mono font-medium">{p.label}</p>
 <p className="text-[10px] text-foreground-muted mt-1 text-center">{p.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>

 {/* Fading patterns */}
 <DemoCard title="FADING PATTERNS (with mask)">
 <p className="text-xs text-foreground-muted mb-4">Patterns with radial mask that fade toward edges. Perfect for hero sections.</p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {[
 { cls: 'bg-dots-fade', label: '.bg-dots-fade', desc: 'Dots fading to edges' },
 { cls: 'bg-grid-fade', label: '.bg-grid-fade', desc: 'Grid fading to edges' },
 { cls: 'bg-grid-glow', label: '.bg-grid-glow', desc: 'Grid with glowing intersections' },
 ].map((p) => (
 <div key={p.cls} className={`relative overflow-hidden rounded-cf-md border border-border-default ${p.cls}`} style={{ height: '140px' }}>
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
 <p className="text-xs text-foreground font-mono font-medium">{p.label}</p>
 <p className="text-[10px] text-foreground-muted mt-1 text-center">{p.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>

 {/* Mesh & radial gradients */}
 <DemoCard title="MESH & RADIAL GRADIENTS">
 <p className="text-xs text-foreground-muted mb-4">Multi-point radial gradients that add ambient color. Brand-tinted.</p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { cls: 'bg-mesh', label: '.bg-mesh', desc: 'Apple-style 4-corner mesh' },
 { cls: 'bg-mesh-rich', label: '.bg-mesh-rich', desc: 'Richer multi-point mesh' },
 { cls: 'bg-corner-glow', label: '.bg-corner-glow', desc: 'Corner gradient glow' },
 { cls: 'bg-center-spotlight', label: '.bg-center-spotlight', desc: 'Center focus blob' },
 { cls: 'bg-vignette', label: '.bg-vignette', desc: 'Edge darkening vignette' },
 { cls: 'bg-aurora', label: '.bg-aurora', desc: 'Animated aurora borealis' },
 { cls: 'bg-constellation', label: '.bg-constellation', desc: 'Scattered star points' },
 { cls: 'bg-stars', label: '.bg-stars', desc: 'Random starfield' },
 ].map((p) => (
 <div key={p.cls} className={`relative overflow-hidden rounded-cf-md border border-border-default ${p.cls}`} style={{ height: '120px' }}>
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
 <p className="text-xs text-foreground font-mono font-medium">{p.label}</p>
 <p className="text-[10px] text-foreground-muted mt-1 text-center">{p.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>

 {/* Hero/dramatic effects */}
 <DemoCard title="DRAMATIC / HERO EFFECTS">
 <p className="text-xs text-foreground-muted mb-4">High-impact effects for hero sections, CTAs, and landing pages.</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {[
 { cls: 'bg-lightray', label: '.bg-lightray', desc: 'Resend-style beam from top center' },
 { cls: 'bg-floor', label: '.bg-floor', desc: 'Perspective floor reflection grid' },
 { cls: 'bg-spotlight', label: '.bg-spotlight', desc: 'Beam sweep rotation' },
 { cls: 'bg-orbs', label: '.bg-orbs', desc: 'Animated floating gradient orbs' },
 ].map((p) => (
 <div key={p.cls} className={`relative overflow-hidden rounded-cf-md border border-border-default ${p.cls}`} style={{ height: '160px' }}>
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
 <p className="text-xs text-foreground font-mono font-medium">{p.label}</p>
 <p className="text-[10px] text-foreground-muted mt-1 text-center">{p.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>

 {/* Page-level gradient backgrounds */}
 <DemoCard title="PAGE-LEVEL GRADIENTS">
 <p className="text-xs text-foreground-muted mb-4">Full-page gradient backgrounds for different section types.</p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { cls: 'bg-hero-gradient', label: '.bg-hero-gradient' },
 { cls: 'bg-hero-split', label: '.bg-hero-split' },
 { cls: 'bg-section-gradient', label: '.bg-section-gradient' },
 { cls: 'bg-cta-gradient', label: '.bg-cta-gradient' },
 { cls: 'bg-premium-gradient', label: '.bg-premium-gradient' },
 { cls: 'bg-brand-gradient', label: '.bg-brand-gradient' },
 ].map((p) => (
 <div key={p.cls} className={`relative overflow-hidden rounded-cf-md border border-border-default ${p.cls}`} style={{ height: '90px' }}>
 <div className="absolute inset-0 flex items-center justify-center p-2">
 <p className="text-xs text-foreground font-mono">{p.label}</p>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>

 {/* Pattern combinations — THE MONEY SHOT */}
 <DemoCard title="PATTERN COMBINATIONS — LAYERED">
 <p className="text-xs text-foreground-muted mb-4">The real magic: Layer 2-3 patterns for rich, deep backgrounds. Always use pointer-events-none + absolute inset-0.</p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="relative overflow-hidden rounded-cf-md border border-border-default" style={{ height: '160px' }}>
 <div className="absolute inset-0 bg-mesh" />
 <div className="absolute inset-0 bg-dots opacity-40" />
 <div className="absolute inset-0 bg-vignette" />
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
 <p className="text-xs text-foreground font-mono font-medium">mesh + dots + vignette</p>
 <p className="text-[10px] text-foreground-muted mt-1">Hero section combo</p>
 <div className="glass rounded-cf-md px-3 py-2 mt-2">
 <p className="text-[10px] text-foreground-muted">Glass card on top</p>
 </div>
 </div>
 </div>
 <div className="relative overflow-hidden rounded-cf-md border border-border-default" style={{ height: '160px' }}>
 <div className="absolute inset-0 bg-hexagons opacity-50" />
 <div className="absolute inset-0 bg-corner-glow" />
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
 <p className="text-xs text-foreground font-mono font-medium">hexagons + corner-glow</p>
 <p className="text-[10px] text-foreground-muted mt-1">Integration section</p>
 <div className="glass-card rounded-cf-md px-3 py-2 mt-2">
 <p className="text-[10px] text-foreground-muted">Glass card on top</p>
 </div>
 </div>
 </div>
 <div className="relative overflow-hidden rounded-cf-md border border-border-default" style={{ height: '160px' }}>
 <div className="absolute inset-0 bg-circuit opacity-40" />
 <div className="absolute inset-0 bg-center-spotlight" />
 <div className="absolute inset-0 bg-dots-fade" />
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
 <p className="text-xs text-foreground font-mono font-medium">circuit + spotlight + dots-fade</p>
 <p className="text-[10px] text-foreground-muted mt-1">Features section</p>
 <div className="glass-heavy rounded-cf-md px-3 py-2 mt-2">
 <p className="text-[10px] text-foreground-muted">Glass card on top</p>
 </div>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
 <div className="relative overflow-hidden rounded-cf-md border border-border-default" style={{ height: '160px' }}>
 <div className="absolute inset-0 bg-constellation" />
 <div className="absolute inset-0 bg-grid-fade" />
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
 <p className="text-xs text-foreground font-mono font-medium">constellation + grid-fade</p>
 <p className="text-[10px] text-foreground-muted mt-1">CTA / comparison section</p>
 <div className="glass rounded-cf-md px-3 py-2 mt-2">
 <p className="text-[10px] text-foreground-muted">Glass card</p>
 </div>
 </div>
 </div>
 <div className="relative overflow-hidden rounded-cf-md border border-border-default" style={{ height: '160px' }}>
 <div className="absolute inset-0 bg-diagonal opacity-40" />
 <div className="absolute inset-0 bg-mesh" />
 <div className="absolute inset-0 bg-vignette" />
 <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
 <p className="text-xs text-foreground font-mono font-medium">diagonal + mesh + vignette</p>
 <p className="text-[10px] text-foreground-muted mt-1">Testimonials section</p>
 <div className="glass-frosted rounded-cf-md px-3 py-2 mt-2">
 <p className="text-[10px] text-foreground-muted">Glass card</p>
 </div>
 </div>
 </div>
 </div>
 </DemoCard>

 {/* Usage guide */}
 <DemoCard title="USAGE GUIDE">
 <div className="space-y-3">
 <div className="glass-card rounded-cf-lg p-4">
 <p className="text-overline mb-2">HOW TO USE PATTERNS</p>
 <pre className="text-xs font-mono text-foreground-muted leading-relaxed">{`<section className="relative py-24 px-6">
  {/* Pattern layers — absolute, behind content */}
  <div className="absolute inset-0 bg-mesh pointer-events-none" />
  <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
  <div className="absolute inset-0 bg-vignette pointer-events-none" />

  {/* Content — relative z-index */}
  <div className="relative max-w-5xl mx-auto">
    <div className="glass-card rounded-cf-2xl p-6">
      Your content here
    </div>
  </div>
</section>`}</pre>
 </div>
 <div className="glass-card rounded-cf-lg p-4">
 <p className="text-overline mb-2">OPACITY GUIDELINES</p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-foreground-muted">
 <div><span className="text-foreground font-mono">opacity-20</span><br />Very subtle</div>
 <div><span className="text-foreground font-mono">opacity-30</span><br />Default</div>
 <div><span className="text-foreground font-mono">opacity-40</span><br />Visible</div>
 <div><span className="text-foreground font-mono">opacity-60</span><br />Prominent</div>
 </div>
 </div>
 <div className="glass-card rounded-cf-lg p-4">
 <p className="text-overline mb-2">PATTERN RULES</p>
 <ul className="text-xs text-foreground-muted space-y-1.5">
 <li>Always use <code className="text-foreground font-mono text-[10px]">pointer-events-none</code> on pattern overlays</li>
 <li>Never more than 3 pattern layers per section</li>
 <li>Always add <code className="text-foreground font-mono text-[10px]">relative</code> to the section container</li>
 <li>Glass blocks above patterns create the frosted glass illusion</li>
 <li>Alternate patterns between sections (don't use the same one twice in a row)</li>
 <li>Use <code className="text-foreground font-mono text-[10px]">bg-vignette</code> or <code className="text-foreground font-mono text-[10px]">bg-corner-glow</code> as a top layer for depth</li>
 </ul>
 </div>
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ BUTTONS ═══════════ */}
 <Section id="buttons" title="Buttons" description="Primary, secondary, ghost, and destructive button variants.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">PRIMARY</p>
 <div className="flex flex-wrap gap-3">
 <button className="rounded-cf-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-cf-inverse hover:bg-brand-primary-hover transition-colors">Default</button>
 <button className="rounded-cf-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-cf-inverse hover:bg-brand-primary-hover transition-colors" style={{ boxShadow: 'var(--theme-shadow-cf-glow)' }}>With Glow</button>
 <button className="rounded-cf-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-cf-inverse opacity-50 cursor-not-allowed">Disabled</button>
 <button className="rounded-cf-lg bg-brand-primary p-2.5 text-cf-inverse hover:bg-brand-primary-hover transition-colors"><Plus className="h-4 w-4" /></button>
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">SECONDARY / GHOST</p>
 <div className="flex flex-wrap gap-3">
 <button className="rounded-cf-lg bg-surface-sunken px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors">Secondary</button>
 <button className="rounded-cf-lg px-5 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors">Ghost</button>
 <button className="rounded-cf-lg border border-border-default px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors">Outlined</button>
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">DESTRUCTIVE</p>
 <div className="flex flex-wrap gap-3">
 <button className="rounded-cf-lg bg-error px-5 py-2.5 text-sm font-semibold text-white hover:bg-error/90 transition-colors">Delete</button>
 <button className="rounded-cf-lg bg-error/10 px-5 py-2.5 text-sm font-medium text-error hover:bg-error/20 transition-colors">Soft Delete</button>
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">SIZES</p>
 <div className="flex items-center flex-wrap gap-3">
 <button className="rounded-cf-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-cf-inverse">Small</button>
 <button className="rounded-cf-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-cf-inverse">Medium</button>
 <button className="rounded-cf-lg bg-brand-primary px-7 py-3 text-base font-semibold text-cf-inverse">Large</button>
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ INPUTS ═══════════ */}
 <Section id="inputs" title="Inputs" description="Form controls: text, select, checkbox, toggle.">
 <DemoCard>
 <div className="max-w-md space-y-5">
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Text Input</label>
 <input type="text" placeholder="Enter value..." className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground" />
 </div>
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">With Icon</label>
 <div className="relative">
 <Search className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
 <input type="text" placeholder="Search agents..." className="neu-input w-full rounded-cf-lg pl-10 pr-4 py-2.5 text-sm text-foreground" />
 </div>
 </div>
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Select</label>
 <select className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground appearance-none">
 <option>Option 1</option>
 <option>Option 2</option>
 <option>Option 3</option>
 </select>
 </div>
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Textarea</label>
 <textarea rows={3} placeholder="Enter description..." className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground resize-none" />
 </div>
 <div className="flex items-center gap-3">
 <input type="checkbox" className="h-4 w-4 rounded border-border-default text-brand-primary" defaultChecked />
 <label className="text-sm text-foreground">Enabled option</label>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ CHIPS & PILLS ═══════════ */}
 <Section id="chips" title="Chips & Pills" description="Compact labels, filters, and tags. Glass and solid variants.">
 <DemoCard title="VARIANTS">
 <div className="flex flex-wrap gap-3">
 <span className="rounded-cf-full bg-surface-sunken border border-border-default px-3 py-1.5 text-xs font-medium text-foreground">Solid</span>
 <span className="rounded-cf-full glass border border-border-subtle/50 px-3 py-1.5 text-xs font-medium text-foreground">Glass</span>
 <span className="rounded-cf-full border border-dashed border-border-default px-3 py-1.5 text-xs text-foreground-muted">Dashed</span>
 <span className="rounded-cf-full bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 text-xs font-medium text-brand-primary">Brand</span>
 <span className="rounded-cf-full bg-success/10 border border-success/30 px-3 py-1.5 text-xs font-medium text-success">Success</span>
 <span className="rounded-cf-full bg-error/10 border border-error/30 px-3 py-1.5 text-xs font-medium text-error">Error</span>
 </div>
 </DemoCard>
 <DemoCard title="WITH ICONS">
 <div className="flex flex-wrap gap-3">
 <span className="inline-flex items-center gap-1.5 rounded-cf-full glass px-3 py-1.5 text-xs font-medium text-foreground"><Zap className="h-3 w-3 text-brand-primary" /> Agent</span>
 <span className="inline-flex items-center gap-1.5 rounded-cf-full bg-surface-sunken border border-border-default px-3 py-1.5 text-xs"><Check className="h-3 w-3 text-success" /> Verified</span>
 <span className="inline-flex items-center gap-1.5 rounded-cf-full border border-border-default px-3 py-1.5 text-xs text-foreground-muted"><X className="h-3 w-3" /> Dismiss</span>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ CARDS ═══════════ */}
 <Section id="cards" title="Cards" description="Card variants for different content types.">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="rounded-cf-lg bg-surface-card p-6" style={{ boxShadow: 'var(--theme-shadow-neu-flat)' }}>
 <h4 className="font-display font-semibold text-foreground mb-2">Static Card</h4>
 <p className="text-sm text-foreground-muted">Non-interactive content card with flat shadow.</p>
 </div>
 <div className="neu-interactive rounded-cf-lg p-6">
 <h4 className="font-display font-semibold text-foreground mb-2">Interactive Card</h4>
 <p className="text-sm text-foreground-muted">Hover for lift effect. Click for press.</p>
 </div>
 <div className="rounded-cf-xl glass border border-brand-primary/20 p-6" style={{ boxShadow: 'var(--theme-shadow-cf-glow)' }}>
 <h4 className="font-display font-semibold text-brand-primary mb-2">Highlighted Card</h4>
 <p className="text-sm text-foreground-muted">With brand glow and accent border.</p>
 </div>
 </div>
 </Section>


 {/* ═══════════ BADGES ═══════════ */}
 <Section id="badges" title="Badges & Tags" description="Status indicators, labels, and tags.">
 <DemoCard>
 <div className="space-y-4">
 <div className="flex flex-wrap gap-2">
 <span className="px-2.5 py-1 rounded-cf-full text-xs font-medium bg-brand-primary/10 text-brand-primary">Default</span>
 <span className="px-2.5 py-1 rounded-cf-full text-xs font-medium bg-success/10 text-success">Success</span>
 <span className="px-2.5 py-1 rounded-cf-full text-xs font-medium bg-warning/10 text-warning">Warning</span>
 <span className="px-2.5 py-1 rounded-cf-full text-xs font-medium bg-error/10 text-error">Error</span>
 <span className="px-2.5 py-1 rounded-cf-full text-xs font-medium bg-info/10 text-info">Info</span>
 </div>
 <div className="flex flex-wrap gap-2">
 <span className="px-2.5 py-1 rounded-cf-md text-xs font-medium bg-brand-primary text-cf-inverse">Solid</span>
 <span className="px-2.5 py-1 rounded-cf-md text-xs font-medium border border-border-default text-foreground-muted">Outlined</span>
 <span className="px-2.5 py-1 rounded-cf-md text-xs font-medium bg-surface-sunken text-foreground-muted">Muted</span>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ AVATARS ═══════════ */}
 <Section id="avatars" title="Avatars" description="User and entity representation.">
 <DemoCard>
 <div className="flex items-center gap-4">
 {['xs', 'sm', 'md', 'lg'].map((size, i) => {
 const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
 const s = sizes[size as keyof typeof sizes];
 return (
 <div key={size} className={`flex items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary font-semibold ${s}`}>
 {['A', 'B', 'C', 'D'][i]}
 </div>
 );
 })}
 <div className="h-10 w-10 rounded-full bg-surface-sunken flex items-center justify-center text-foreground-subtle">
 <Bot className="h-5 w-5" />
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ STATUS PILLS ═══════════ */}
 <Section id="status-pills" title="Status Pills" description="Compact inline status indicators used in the top bar for VM and Gateway health.">
 <DemoCard title="STATUS PILLS">
 <div className="flex flex-wrap gap-3 mb-4">
 {(['online', 'offline', 'connecting'] as const).map((s) => {
 const cm = {
   online: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/8', border: 'border-success/20' },
   offline: { dot: 'bg-error', text: 'text-error', bg: 'bg-error/8', border: 'border-error/20' },
   connecting: { dot: 'bg-warning animate-pulse', text: 'text-warning', bg: 'bg-warning/8', border: 'border-warning/20' },
 }[s];
 return (
 <span key={s} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cm.bg} ${cm.border} ${cm.text}`}>
   <span className={`h-1.5 w-1.5 rounded-full ${cm.dot}`} />
   VM: {s}
 </span>
 );
 })}
 {(['online', 'offline', 'connecting'] as const).map((s) => {
 const cm = {
   online: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/8', border: 'border-success/20' },
   offline: { dot: 'bg-error', text: 'text-error', bg: 'bg-error/8', border: 'border-error/20' },
   connecting: { dot: 'bg-warning animate-pulse', text: 'text-warning', bg: 'bg-warning/8', border: 'border-warning/20' },
 }[s];
 return (
 <span key={s} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cm.bg} ${cm.border} ${cm.text}`}>
   <span className={`h-1.5 w-1.5 rounded-full ${cm.dot}`} />
   GW: {s}
 </span>
 );
 })}
 </div>
 <p className="text-xs text-foreground-muted">Click a pill to see refresh/reconnect options. Used in Row 1 of the top bar, next to the theme toggle.</p>
 </DemoCard>
 </Section>

 {/* ═══════════ STATUS ═══════════ */}
 <Section id="status" title="Status Indicators" description="Connection and operational states.">
 <DemoCard>
 <div className="flex flex-wrap gap-6">
 {[
 { label: 'Connected', cls: 'status-dot--success' },
 { label: 'Error', cls: 'status-dot--error' },
 { label: 'Warning', cls: 'status-dot--warning' },
 ].map((s) => (
 <div key={s.label} className="flex items-center gap-2">
 <span className={`status-dot ${s.cls}`} />
 <span className="text-sm text-foreground">{s.label}</span>
 </div>
 ))}
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ FORMS ═══════════ */}
 <Section id="forms" title="Form Patterns" description="Complete form layouts with validation.">
 <DemoCard>
 <form className="max-w-lg space-y-4" onSubmit={(e) => e.preventDefault()}>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">First Name</label>
 <input type="text" defaultValue="Alex" className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground" />
 </div>
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Last Name</label>
 <input type="text" defaultValue="Forge" className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground" />
 </div>
 </div>
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
 <input type="email" defaultValue="alex@zeph.ai" className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground" />
 <p className="text-xs text-success mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Valid email</p>
 </div>
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
 <input type="password" defaultValue="12345678" className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground" />
 <div className="flex gap-1 mt-2">
 {[1, 2, 3, 4, 5].map((i) => (
 <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-success' : 'bg-border-default'}`} />
 ))}
 </div>
 </div>
 <div className="flex justify-end gap-3 pt-2">
 <button type="button" className="rounded-cf-lg bg-surface-sunken px-5 py-2.5 text-sm font-medium text-foreground">Cancel</button>
 <button type="submit" className="rounded-cf-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-cf-inverse hover:bg-brand-primary-hover transition-colors">Save</button>
 </div>
 </form>
 </DemoCard>
 </Section>


 {/* ═══════════ TABLES ═══════════ */}
 <Section id="tables" title="Tables" description="Data table with hover states and alignment.">
 <DemoCard>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="text-foreground-muted text-xs border-b border-border-default">
 <th className="text-left py-2">Agent</th>
 <th className="text-left py-2">Server</th>
 <th className="text-right py-2">Messages</th>
 <th className="text-right py-2">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border-subtle">
 {[
 { agent: 'Support Bot', server: 'prod-01', msgs: '12,450', status: 'Active' },
 { agent: 'Sales Agent', server: 'prod-02', msgs: '8,320', status: 'Active' },
 { agent: 'FAQ Helper', server: 'staging', msgs: '1,280', status: 'Idle' },
 ].map((row) => (
 <tr key={row.agent} className="hover:bg-surface-hover/50 transition-colors">
 <td className="py-3 font-medium text-foreground">{row.agent}</td>
 <td className="py-3 text-foreground-muted">{row.server}</td>
 <td className="py-3 text-right font-mono text-foreground">{row.msgs}</td>
 <td className="py-3 text-right">
 <span className={`px-2 py-0.5 rounded-cf-full text-xs font-medium ${row.status === 'Active' ? 'bg-success/10 text-success' : 'bg-surface-sunken text-foreground-muted'}`}>
 {row.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ NAVIGATION ═══════════ */}
 <Section id="navigation" title="Navigation" description="Tabs, breadcrumbs, and sidebar items.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">TABS</p>
 <div className="flex gap-1 bg-surface-sunken rounded-cf-lg p-1 w-fit">
 {['Overview', 'Agents', 'Terminal', 'Logs'].map((tab, i) => (
 <button key={tab} className={`px-4 py-2 rounded-cf-md text-sm font-medium transition-colors ${i === 0 ? 'bg-surface-card text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}>
 {tab}
 </button>
 ))}
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">SIDEBAR ITEMS</p>
 <div className="w-56 space-y-0.5">
 {[
 { icon: Layout, label: 'Dashboard', active: true },
 { icon: Bot, label: 'Agents', active: false },
 { icon: Server, label: 'Servers', active: false },
 { icon: Settings, label: 'Settings', active: false },
 ].map((item) => (
 <div key={item.label} className={`flex items-center gap-3 px-3 py-2 rounded-cf-md text-sm transition-colors cursor-pointer ${item.active ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'}`}>
 <item.icon className="h-4 w-4" />
 {item.label}
 </div>
 ))}
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ FEEDBACK ═══════════ */}
 <Section id="feedback" title="Feedback" description="Toast notifications, alerts, and banners.">
 <DemoCard>
 <div className="space-y-4 max-w-md">
 {[
 { type: 'success', icon: CheckCircle2, title: 'Saved', msg: 'Your changes have been saved.' },
 { type: 'error', icon: AlertTriangle, title: 'Error', msg: 'Something went wrong. Please try again.' },
 { type: 'warning', icon: AlertTriangle, title: 'Warning', msg: 'Resource usage is approaching the limit.' },
 { type: 'info', icon: Info, title: 'Info', msg: 'A new version is available.' },
 ].map((t) => {
 const colors: Record<string, string> = {
 success: 'bg-success/10 border-success/20 text-success',
 error: 'bg-error/10 border-error/20 text-error',
 warning: 'bg-warning/10 border-warning/20 text-warning',
 info: 'bg-info/10 border-info/20 text-info',
 };
 return (
 <div key={t.type} className={`rounded-cf-lg border p-4 ${colors[t.type]}`}>
 <div className="flex items-start gap-3">
 <t.icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm font-semibold">{t.title}</p>
 <p className="text-xs opacity-80 mt-0.5">{t.msg}</p>
 </div>
 <button className="opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
 </div>
 </div>
 );
 })}
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ LOADING ═══════════ */}
 <Section id="loading" title="Loading States" description="Skeletons, spinners, and progress indicators.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">SKELETON</p>
 <div className="space-y-3">
 <div className="skeleton h-5 w-3/4" />
 <div className="skeleton h-5 w-1/2" />
 <div className="skeleton h-20 w-full" />
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">SPINNER</p>
 <div className="flex items-center gap-4">
 <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-primary border-t-transparent" />
 <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent" />
 <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-primary border-t-transparent" />
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">PROGRESS BAR</p>
 <div className="space-y-2">
 <div className="h-2 rounded-full bg-surface-sunken overflow-hidden"><div className="h-full rounded-full bg-brand-primary" style={{ width: '65%' }} /></div>
 <div className="h-2 rounded-full bg-surface-sunken overflow-hidden"><div className="h-full rounded-full bg-success" style={{ width: '90%' }} /></div>
 <div className="h-2 rounded-full bg-surface-sunken overflow-hidden"><div className="h-full rounded-full bg-error" style={{ width: '30%' }} /></div>
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ KNOWLEDGE HUB ═══════════ */}
 <Section id="knowledge-hub" title="Knowledge Hub" description="Merged Integrations + Knowledge Base + Live Sources. Three-tab layout at /knowledge.">
 <DemoCard title="PAGE OVERVIEW">
 <div className="space-y-3">
 <div className="flex items-center gap-2 flex-wrap">
 {['Documents & RAG', 'Integrations', 'Live Sources'].map((t, i) => (
 <span key={t} className={`px-3.5 py-2 rounded-cf-md text-sm font-medium ${i === 0 ? 'bg-lavender/15 text-lavender border border-lavender/20' : 'text-foreground-muted bg-surface-sunken'}`}>{t}</span>
 ))}
 </div>
 <p className="text-xs text-foreground-muted">Tab 1: Document upload, RAG chunks, drag-and-drop zone. Tab 2: Connected and available integrations (Telegram, Stripe, etc.). Tab 3: RSS feeds, API connectors, webhooks.</p>
 <p className="text-xs text-foreground-muted">Route: <code className="px-1 py-0.5 rounded bg-surface-sunken font-mono text-[10px]">/knowledge</code> — old <code className="px-1 py-0.5 rounded bg-surface-sunken font-mono text-[10px]">/integrations</code> redirects here.</p>
 </div>
 </DemoCard>
 </Section>

 {/* ═══════════ WORKFLOWS & CRONS ═══════════ */}
 <Section id="workflows" title="Workflows & Crons" description="Scheduled jobs and visual workflow builder at /workflows.">
 <DemoCard title="PAGE OVERVIEW">
 <div className="space-y-3">
 <div className="flex items-center gap-2 flex-wrap">
 {['Scheduled Jobs', 'Workflows'].map((t, i) => (
 <span key={t} className={`px-3.5 py-2 rounded-cf-md text-sm font-medium ${i === 0 ? 'bg-lavender/15 text-lavender border border-lavender/20' : 'text-foreground-muted bg-surface-sunken'}`}>{t}</span>
 ))}
 </div>
 <p className="text-xs text-foreground-muted">Cron jobs: create, pause, delete, run manually. Stats row with active/paused/errored counts. Workflows: n8n-style visual pipeline cards with trigger → action → condition → output nodes. Coming-soon workflow builder placeholder.</p>
 <p className="text-xs text-foreground-muted">Route: <code className="px-1 py-0.5 rounded bg-surface-sunken font-mono text-[10px]">/workflows</code></p>
 </div>
 </DemoCard>
 </Section>

 {/* ═══════════ AGENT COMMANDS ═══════════ */}
 <Section id="commands" title="Agent Commands" description="Prompt templates and shortcut commands at /commands.">
 <DemoCard title="PAGE OVERVIEW">
 <div className="space-y-3">
 <p className="text-xs text-foreground-muted">Command cards with trigger keywords (e.g. <code className="px-1 py-0.5 rounded bg-lavender/10 text-lavender font-mono text-[10px]">/summary</code>, <code className="px-1 py-0.5 rounded bg-lavender/10 text-lavender font-mono text-[10px]">!ban</code>). Click to expand and see the full prompt template. Categories: Utility, Content, Admin, Analytics. Starred commands pinned at top. Test Run / Edit / Copy actions.</p>
 <p className="text-xs text-foreground-muted">"How Commands Work" info card at bottom explains the trigger → prompt → agent execution flow.</p>
 <p className="text-xs text-foreground-muted">Route: <code className="px-1 py-0.5 rounded bg-surface-sunken font-mono text-[10px]">/commands</code></p>
 </div>
 </DemoCard>
 </Section>

 {/* ═══════════ OPENCLAW CONFIGS ═══════════ */}
 <Section id="openclaw-configs" title="OpenClaw Configs" description="Gateway, AI model, security, and advanced settings at /configs.">
 <DemoCard title="PAGE OVERVIEW">
 <div className="space-y-3">
 <div className="flex items-center gap-2 flex-wrap">
 {['Gateway', 'AI Models', 'Security', 'Advanced'].map((t, i) => (
 <span key={t} className={`px-3.5 py-2 rounded-cf-md text-sm font-medium ${i === 0 ? 'bg-lavender/15 text-lavender border border-lavender/20' : 'text-foreground-muted bg-surface-sunken'}`}>{t}</span>
 ))}
 </div>
 <p className="text-xs text-foreground-muted">Gateway: endpoint, ports, CORS, rate limit, health check config. Status cards (online/uptime/connections/rpm). Models: list of configured AI models (GPT-4o, Claude, etc.) with provider, token limits, cost info. Security: API keys, access control toggles. Advanced: system info, danger zone.</p>
 <p className="text-xs text-foreground-muted">Route: <code className="px-1 py-0.5 rounded bg-surface-sunken font-mono text-[10px]">/configs</code></p>
 </div>
 </DemoCard>
 </Section>

 {/* ═══════════ SETTINGS PAGES ═══════════ */}
 <Section id="settings" title="Settings Pages" description="Account-level settings accessible from profile dropdown. Not in main nav bar.">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {[
 { icon: Shield, title: 'Security', desc: 'Password change with strength meter. 2FA toggle.' },
 { icon: Key, title: 'API Keys', desc: 'Real CRUD — create, list, toggle, delete. SHA-256 hashed.' },
 { icon: Bell, title: 'Notifications', desc: 'Channels + event matrix. Persisted to UserSettings.' },
 { icon: Users, title: 'Team', desc: 'Invite members, change roles. Stored in preferences.' },
 { icon: CreditCard, title: 'Billing', desc: 'Real usage computed from DB. Plan tiers with limits.' },
 { icon: Settings, title: 'Profile', desc: 'Name, email, language, timezone. Real API calls.' },
 ].map((p) => (
 <div key={p.title} className="rounded-cf-lg bg-surface-card p-5" style={{ boxShadow: 'var(--theme-shadow-neu-flat)' }}>
 <div className="flex items-center gap-3 mb-2">
 <div className="flex h-9 w-9 items-center justify-center rounded-cf-md bg-brand-primary/10 text-brand-primary">
 <p.icon className="h-4 w-4" />
 </div>
 <h4 className="font-display font-semibold text-foreground">{p.title}</h4>
 </div>
 <p className="text-xs text-foreground-muted">{p.desc}</p>
 </div>
 ))}
 </div>
 </Section>


 {/* ═══════════ ANALYTICS ═══════════ */}
 <Section id="analytics" title="Analytics" description="Real-time analytics from ActivityLog, Agent, and VM tables.">
 <DemoCard>
 <div className="grid grid-cols-4 gap-4">
 {[
 { label: 'Messages', value: '12,450', color: 'text-brand-primary' },
 { label: 'Agents', value: '24', color: 'text-success' },
 { label: 'Servers', value: '8 / 10', color: 'text-warning' },
 { label: 'Error Rate', value: '2.1%', color: 'text-success' },
 ].map((s) => (
 <div key={s.label} className="text-center">
 <p className="text-overline">{s.label}</p>
 <p className={`text-2xl font-bold font-display ${s.color} mt-1`}>{s.value}</p>
 </div>
 ))}
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ TERMINAL ═══════════ */}
 <Section id="terminal" title="Terminal" description="Real SSH terminal executing commands via VM connection.">
 <DemoCard>
 <div className="rounded-cf-md bg-surface-base p-4 font-mono text-sm space-y-1">
 <p className="text-success">$ uname -a</p>
 <p className="text-foreground">Linux zephai-prod 5.15.0 #1 SMP x86_64 GNU/Linux</p>
 <p className="text-success">$ free -h</p>
 <p className="text-foreground"> total used free shared buff/cache available</p>
 <p className="text-foreground">Mem: 15Gi 8.2Gi 3.1Gi 512Mi 4.1Gi 6.4Gi</p>
 <p className="text-success">$ ls agents/</p>
 <p className="text-foreground">assistant/ support-bot/ sales-agent/</p>
 <p className="text-brand-primary animate-pulse">$ _</p>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ GRADIENTS ═══════════ */}
 <Section id="gradients" title="Gradients" description="Brand gradient presets for backgrounds, text, and accents.">
 <div className="space-y-6">
 <DemoCard title="BACKGROUND GRADIENTS">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { label: 'Brand', cls: 'bg-brand-gradient' },
 { label: 'Hero', cls: 'bg-hero-gradient' },
 { label: 'Hero Split', cls: 'bg-hero-split' },
 { label: 'Section', cls: 'bg-section-gradient' },
 { label: 'CTA', cls: 'bg-cta-gradient' },
 { label: 'Mesh', cls: 'bg-mesh' },
 { label: 'Diagonal', cls: 'bg-diagonal' },
 { label: 'Floor', cls: 'bg-floor' },
 ].map((g) => (
 <div key={g.label} className={`h-20 rounded-cf-md ${g.cls} border border-border-default flex items-center justify-center`}>
 <p className="text-xs text-foreground-muted font-mono">.{g.label.toLowerCase()}</p>
 </div>
 ))}
 </div>
 </DemoCard>

 <DemoCard title="TEXT GRADIENTS">
 <div className="flex flex-wrap gap-8">
 <div>
 <p className="text-2xl font-bold font-display text-gradient">text-gradient</p>
 <p className="text-xs text-foreground-muted mt-1 font-mono">.text-gradient</p>
 </div>
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ TOGGLES ═══════════ */}
 <Section id="toggles" title="Toggles & Switches" description="Binary state controls for settings and preferences.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">TOGGLE SWITCHES</p>
 <div className="space-y-3 max-w-md">
 {[
 { label: 'Email notifications', desc: 'Receive deployment alerts via email', checked: true },
 { label: 'Two-factor authentication', desc: 'Add an extra layer of security', checked: true },
 { label: 'Marketing emails', desc: 'Product updates and tips', checked: false },
 ].map((t) => (
 <div key={t.label} className="flex items-center justify-between p-3 rounded-cf-md hover:bg-surface-hover transition-colors">
 <div>
 <p className="text-sm font-medium text-foreground">{t.label}</p>
 <p className="text-xs text-foreground-muted">{t.desc}</p>
 </div>
 <button className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${t.checked ? 'bg-brand-primary' : 'bg-surface-sunken'}`}>
 <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${t.checked ? 'translate-x-5' : 'translate-x-1'}`} />
 </button>
 </div>
 ))}
 </div>
 </div>

 <div>
 <p className="text-overline mb-3">SEGMENTED CONTROLS</p>
 <div className="flex gap-4 flex-wrap">
 <div className="flex gap-0.5 bg-surface-sunken rounded-cf-lg p-1">
 {['Daily', 'Weekly', 'Monthly'].map((s, i) => (
 <button key={s} className={`px-4 py-2 rounded-cf-md text-xs font-medium transition-all ${i === 1 ? 'bg-surface-card text-foreground shadow-sm border border-border-default' : 'text-foreground-muted hover:text-foreground'}`}>{s}</button>
 ))}
 </div>
 <div className="flex gap-0.5 bg-surface-sunken rounded-cf-lg p-1">
 {['List', 'Grid', 'Board'].map((s, i) => (
 <button key={s} className={`px-3 py-1.5 rounded-cf-md text-xs font-medium transition-all ${i === 0 ? 'bg-brand-primary text-cf-inverse' : 'text-foreground-muted hover:text-foreground'}`}>{s}</button>
 ))}
 </div>
 </div>
 </div>

 <div>
 <p className="text-overline mb-3">BUTTON GROUPS</p>
 <div className="flex">
 {['Left', 'Center', 'Right'].map((s, i) => (
 <button key={s} className={`px-4 py-2 text-xs font-medium border border-border-default text-foreground transition-colors hover:bg-surface-hover ${i === 0 ? 'rounded-l-cf-md' : ''} ${i === 2 ? 'rounded-r-cf-md' : ''} ${i === 1 ? 'bg-surface-active text-foreground border-l-0 border-r-0' : 'bg-surface-card'}`}>{s}</button>
 ))}
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ SLIDERS ═══════════ */}
 <Section id="sliders" title="Sliders & Range" description="Range inputs and progress bars with labels.">
 <DemoCard>
 <div className="space-y-6 max-w-md">
 <div>
 <div className="flex justify-between mb-2">
 <label className="text-sm font-medium text-foreground">Request Units</label>
 <span className="text-sm font-mono text-brand-primary">400 RU/s</span>
 </div>
 <input type="range" min="100" max="1000" defaultValue={400} className="w-full h-2 bg-surface-sunken rounded-full appearance-none cursor-pointer accent-brand-primary" />
 <div className="flex justify-between text-[10px] text-foreground-muted mt-1"><span>100</span><span>1000</span></div>
 </div>
 <div>
 <div className="flex justify-between mb-2">
 <label className="text-sm font-medium text-foreground">Temperature</label>
 <span className="text-sm font-mono text-brand-primary">0.7</span>
 </div>
 <input type="range" min="0" max="100" defaultValue={70} className="w-full h-2 bg-surface-sunken rounded-full appearance-none cursor-pointer accent-brand-primary" />
 <div className="flex justify-between text-[10px] text-foreground-muted mt-1"><span>0.0</span><span>1.0</span></div>
 </div>
 <div>
 <p className="text-overline mb-3">LABELED PROGRESS</p>
 <div className="space-y-3">
 {[
 { label: 'Storage', value: 75, total: '7.5 / 10 GB', color: 'bg-brand-primary' },
 { label: 'RAM', value: 45, total: '1.8 / 4 GB', color: 'bg-success' },
 { label: 'CPU', value: 92, total: '92%', color: 'bg-error' },
 ].map((p) => (
 <div key={p.label}>
 <div className="flex justify-between mb-1">
 <span className="text-xs text-foreground-muted">{p.label}</span>
 <span className="text-xs font-mono text-foreground">{p.total}</span>
 </div>
 <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
 <div className={`h-full rounded-full ${p.color} transition-all`} style={{ width: `${p.value}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ MODALS ═══════════ */}
 <Section id="modals" title="Modals & Dialogs" description="Overlay content for confirmation, form input, and information.">
 <div className="space-y-6">
 <DemoCard title="CONFIRM DIALOG">
 <div className="glass rounded-cf-xl p-6 max-w-sm border border-border-default" style={{ boxShadow: 'var(--theme-shadow-dialog)' }}>
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/10 mb-4">
 <AlertTriangle className="h-5 w-5 text-error" />
 </div>
 <h3 className="text-base font-semibold font-display text-foreground">Delete Agent</h3>
 <p className="text-sm text-foreground-muted mt-2">This will permanently delete "Support Bot" and all associated data. This action cannot be undone.</p>
 <div className="flex justify-end gap-3 mt-6">
 <button className="rounded-cf-lg bg-surface-sunken px-4 py-2 text-sm font-medium text-foreground">Cancel</button>
 <button className="rounded-cf-lg bg-error px-4 py-2 text-sm font-semibold text-white">Delete</button>
 </div>
 </div>
 </DemoCard>

 <DemoCard title="FORM DIALOG">
 <div className="glass rounded-cf-xl p-6 max-w-md border border-border-default" style={{ boxShadow: 'var(--theme-shadow-dialog)' }}>
 <div className="flex items-center justify-between mb-5">
 <h3 className="text-base font-semibold font-display text-foreground">Create API Key</h3>
 <button className="p-1 text-foreground-muted hover:text-foreground rounded-cf-sm hover:bg-surface-hover"><X className="h-4 w-4" /></button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Key Name</label>
 <input type="text" placeholder="e.g. Production API Key" className="neu-input w-full rounded-cf-lg px-4 py-2.5 text-sm text-foreground" />
 </div>
 <div>
 <label className="text-sm font-medium text-foreground block mb-1.5">Permissions</label>
 <div className="space-y-2">
 {['Read', 'Write', 'Admin'].map((p, i) => (
 <label key={p} className="flex items-center gap-2">
 <input type="checkbox" className="h-4 w-4 rounded border-border-default text-brand-primary" defaultChecked={i < 2} />
 <span className="text-sm text-foreground">{p}</span>
 </label>
 ))}
 </div>
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <button className="rounded-cf-lg bg-surface-sunken px-4 py-2 text-sm font-medium text-foreground">Cancel</button>
 <button className="rounded-cf-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-cf-inverse">Create</button>
 </div>
 </div>
 </DemoCard>

 <DemoCard title="SUCCESS DIALOG">
 <div className="glass rounded-cf-xl p-6 max-w-sm border border-border-default text-center" style={{ boxShadow: 'var(--theme-shadow-dialog)' }}>
 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
 <CheckCircle2 className="h-6 w-6 text-success" />
 </div>
 <h3 className="text-base font-semibold font-display text-foreground">Deployment Successful</h3>
 <p className="text-sm text-foreground-muted mt-2">Your agent "Sales Bot" is now live at @sales_bot_ai</p>
 <button className="mt-5 rounded-cf-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-cf-inverse w-full">View Agent</button>
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ TOOLTIPS ═══════════ */}
 <Section id="tooltips" title="Tooltips & Popovers" description="Contextual information on hover or click.">
 <DemoCard>
 <div className="space-y-8">
 <div>
 <p className="text-overline mb-4">TOOLTIP POSITIONS</p>
 <div className="flex gap-12 justify-center py-8">
 {['Top', 'Right', 'Bottom', 'Left'].map((pos) => (
 <div key={pos} className="relative group">
 <button className="rounded-cf-md bg-surface-sunken px-4 py-2 text-sm text-foreground">{pos}</button>
 <div className={`absolute z-10 px-3 py-1.5 text-xs bg-foreground text-surface-base rounded-cf-md whitespace-nowrap shadow-lg pointer-events-none
 ${pos === 'Top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
 ${pos === 'Bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
 ${pos === 'Left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
 ${pos === 'Right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}`}>
 Tooltip {pos.toLowerCase()}
 </div>
 </div>
 ))}
 </div>
 </div>

 <div>
 <p className="text-overline mb-4">POPOVER CARD</p>
 <div className="glass rounded-cf-xl p-4 border border-border-default max-w-xs" style={{ boxShadow: 'var(--theme-shadow-lg)' }}>
 <div className="flex items-center gap-3 mb-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm">AK</div>
 <div>
 <p className="text-sm font-semibold text-foreground">Andrei K.</p>
 <p className="text-xs text-foreground-muted">admin@zeph.ai</p>
 </div>
 </div>
 <div className="border-t border-border-subtle pt-3 space-y-1">
 <p className="text-xs text-foreground-muted">Role: <span className="text-foreground">Admin</span></p>
 <p className="text-xs text-foreground-muted">Agents: <span className="text-foreground">12</span></p>
 <p className="text-xs text-foreground-muted">Last active: <span className="text-foreground">2 min ago</span></p>
 </div>
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ DROPDOWNS ═══════════ */}
 <Section id="dropdowns" title="Dropdowns & Menus" description="Context menus, action menus, and select dropdowns.">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <DemoCard title="ACTION MENU">
 <div className="glass rounded-cf-lg border border-border-default w-48" style={{ boxShadow: 'var(--theme-shadow-lg)' }}>
 <div className="py-1">
 {[
 { icon: Edit, label: 'Edit' },
 { icon: Copy, label: 'Duplicate' },
 { icon: Download, label: 'Export' },
 { icon: ExternalLink, label: 'Open in new tab' },
 ].map((item) => (
 <button key={item.label} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors">
 <item.icon className="h-3.5 w-3.5 text-foreground-muted" /> {item.label}
 </button>
 ))}
 <div className="border-t border-border-subtle my-1" />
 <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-error hover:bg-error/5 transition-colors">
 <Trash2 className="h-3.5 w-3.5" /> Delete
 </button>
 </div>
 </div>
 </DemoCard>

 <DemoCard title="SELECT DROPDOWN">
 <div className="glass rounded-cf-lg border border-border-default w-52" style={{ boxShadow: 'var(--theme-shadow-lg)' }}>
 <div className="px-3 py-2 border-b border-border-subtle">
 <input type="text" placeholder="Search..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder-foreground-subtle" />
 </div>
 <div className="py-1 max-h-40 overflow-y-auto">
 {['GPT-4o', 'Claude Opus', 'Claude Sonnet', 'DeepSeek V3', 'Gemini Pro'].map((m, i) => (
 <button key={m} className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${i === 0 ? 'bg-brand-primary/10 text-brand-primary' : 'text-foreground hover:bg-surface-hover'}`}>
 {m}
 {i === 0 && <Check className="h-3.5 w-3.5" />}
 </button>
 ))}
 </div>
 </div>
 </DemoCard>

 <DemoCard title="NOTIFICATION MENU">
 <div className="glass rounded-cf-lg border border-border-default w-72" style={{ boxShadow: 'var(--theme-shadow-lg)' }}>
 <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
 <span className="text-xs font-semibold text-foreground">Notifications</span>
 <span className="text-[10px] text-brand-primary font-medium">Mark all read</span>
 </div>
 <div className="py-1">
 {[
 { title: 'Agent deployed', desc: 'Support Bot is now live', time: '2m', dot: 'bg-success' },
 { title: 'High CPU usage', desc: 'prod-02 at 92%', time: '15m', dot: 'bg-warning' },
 { title: 'New team member', desc: 'Maria joined your team', time: '1h', dot: 'bg-info' },
 ].map((n) => (
 <div key={n.title} className="px-3 py-2.5 hover:bg-surface-hover transition-colors flex gap-3">
 <span className={`h-2 w-2 rounded-full ${n.dot} flex-shrink-0 mt-1.5`} />
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
 <p className="text-[11px] text-foreground-muted truncate">{n.desc}</p>
 </div>
 <span className="text-[10px] text-foreground-subtle flex-shrink-0">{n.time}</span>
 </div>
 ))}
 </div>
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ COMMAND PALETTE ═══════════ */}
 <Section id="command-palette" title="Command Palette" description="Raycast-style quick action launcher with keyboard navigation.">
 <DemoCard>
 <div className="glass rounded-cf-xl border border-border-default max-w-lg mx-auto" style={{ boxShadow: 'var(--theme-shadow-dialog)' }}>
 <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
 <Search className="h-4 w-4 text-foreground-muted" />
 <input type="text" placeholder="Type a command or search..." defaultValue="deploy" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder-foreground-subtle" />
 <span className="text-[10px] text-foreground-subtle bg-surface-sunken px-1.5 py-0.5 rounded font-mono">ESC</span>
 </div>
 <div className="py-1">
 <p className="px-4 py-1.5 text-[10px] text-foreground-subtle uppercase tracking-wider">Actions</p>
 {[
 { icon: Zap, label: 'Quick Deploy', shortcut: '⌘D', active: true },
 { icon: Terminal, label: 'Open Terminal', shortcut: '⌘T', active: false },
 { icon: Bot, label: 'Create Agent', shortcut: '⌘N', active: false },
 ].map((cmd) => (
 <div key={cmd.label} className={`flex items-center gap-3 px-4 py-2.5 mx-1 rounded-cf-md transition-colors ${cmd.active ? 'bg-brand-primary/10' : 'hover:bg-surface-hover'}`}>
 <cmd.icon className={`h-4 w-4 ${cmd.active ? 'text-brand-primary' : 'text-foreground-muted'}`} />
 <span className={`text-sm flex-1 ${cmd.active ? 'text-brand-primary font-medium' : 'text-foreground'}`}>{cmd.label}</span>
 <span className="text-[11px] text-foreground-subtle font-mono">{cmd.shortcut}</span>
 </div>
 ))}
 <p className="px-4 py-1.5 text-[10px] text-foreground-subtle uppercase tracking-wider mt-1">Recent</p>
 {[
 { icon: Server, label: 'prod-main-01' },
 { icon: Activity, label: 'View Activity Log' },
 ].map((cmd) => (
 <div key={cmd.label} className="flex items-center gap-3 px-4 py-2.5 mx-1 rounded-cf-md hover:bg-surface-hover transition-colors">
 <cmd.icon className="h-4 w-4 text-foreground-muted" />
 <span className="text-sm text-foreground">{cmd.label}</span>
 </div>
 ))}
 </div>
 <div className="px-4 py-2 border-t border-border-subtle flex items-center gap-4 text-[10px] text-foreground-subtle">
 <span>↑↓ Navigate</span>
 <span>↵ Open</span>
 <span>⌘K Toggle</span>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ TOASTS ═══════════ */}
 <Section id="toasts" title="Toasts" description="Temporary notification messages with actions.">
 <DemoCard>
 <div className="space-y-3 max-w-sm mx-auto">
 {[
 { icon: CheckCircle2, title: 'Agent deployed successfully', desc: 'Support Bot is live on prod-main', iconCls: 'text-success', bgCls: 'bg-success/10', action: 'View' },
 { icon: AlertTriangle, title: 'Deployment warning', desc: 'High memory usage detected', iconCls: 'text-warning', bgCls: 'bg-warning/10', action: 'Details' },
 { icon: X, title: 'Connection failed', desc: 'Could not reach prod-02', iconCls: 'text-error', bgCls: 'bg-error/10', action: 'Retry' },
 { icon: Info, title: 'Update available', desc: 'OpenClaw v2.1.0 is ready', iconCls: 'text-info', bgCls: 'bg-info/10', action: 'Update' },
 ].map((t) => (
 <div key={t.title} className="glass rounded-cf-lg border border-border-default p-3.5 flex items-start gap-3" style={{ boxShadow: 'var(--theme-shadow-lg)' }}>
 <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.bgCls} flex-shrink-0`}>
 <t.icon className={`h-4 w-4 ${t.iconCls}`} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-foreground">{t.title}</p>
 <p className="text-[11px] text-foreground-muted mt-0.5">{t.desc}</p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <button className="text-[11px] text-brand-primary font-medium hover:underline">{t.action}</button>
 <button className="p-0.5 text-foreground-subtle hover:text-foreground"><X className="h-3 w-3" /></button>
 </div>
 </div>
 ))}
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ STAT CARDS ═══════════ */}
 <Section id="stat-cards" title="Stat Cards" description="Metric display cards with trends, charts, and comparisons.">
 <div className="space-y-6">
 <DemoCard title="METRIC CARDS">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { label: 'Total Agents', value: '24', change: '+3', up: true, color: 'text-brand-primary' },
 { label: 'Messages Today', value: '12,450', change: '+18%', up: true, color: 'text-success' },
 { label: 'Avg Response', value: '0.8s', change: '-0.2s', up: true, color: 'text-brand-secondary' },
 { label: 'Error Rate', value: '2.1%', change: '+0.3%', up: false, color: 'text-error' },
 ].map((s) => (
 <div key={s.label} className="rounded-cf-lg bg-surface-card p-4" style={{ boxShadow: 'var(--theme-shadow-neu-flat)' }}>
 <p className="text-[10px] text-foreground-muted uppercase tracking-wider">{s.label}</p>
 <p className={`text-2xl font-bold font-display ${s.color} mt-1`}>{s.value}</p>
 <p className={`text-[11px] mt-1 ${s.up ? 'text-success' : 'text-error'}`}>{s.change} from last week</p>
 </div>
 ))}
 </div>
 </DemoCard>

 <DemoCard title="COMPACT STATS ROW">
 <div className="flex items-center gap-6 divide-x divide-border-default">
 {[
 { label: 'Uptime', value: '99.8%' },
 { label: 'Servers', value: '8 / 10' },
 { label: 'Memory', value: '12.4 GB' },
 { label: 'Bandwidth', value: '2.1 TB' },
 ].map((s, i) => (
 <div key={s.label} className={`text-center ${i > 0 ? 'pl-6' : ''}`}>
 <p className="text-xs text-foreground-muted">{s.label}</p>
 <p className="text-lg font-bold font-display text-foreground mt-0.5">{s.value}</p>
 </div>
 ))}
 </div>
 </DemoCard>

 <DemoCard title="MINI SPARKLINE CARDS">
 <div className="grid grid-cols-3 gap-4">
 {[
 { label: 'CPU Usage', value: '45%', bars: [30, 45, 60, 40, 55, 45, 50], color: 'bg-brand-primary' },
 { label: 'Memory', value: '68%', bars: [50, 55, 60, 65, 68, 70, 68], color: 'bg-warning' },
 { label: 'Requests', value: '1.2k/s', bars: [80, 60, 70, 90, 85, 75, 80], color: 'bg-success' },
 ].map((s) => (
 <div key={s.label} className="rounded-cf-lg bg-surface-card p-4" style={{ boxShadow: 'var(--theme-shadow-neu-flat)' }}>
 <p className="text-[10px] text-foreground-muted uppercase tracking-wider">{s.label}</p>
 <p className="text-xl font-bold font-display text-foreground mt-1">{s.value}</p>
 <div className="flex items-end gap-0.5 h-6 mt-2">
 {s.bars.map((b, i) => (
 <div key={i} className={`flex-1 rounded-sm ${s.color} opacity-70`} style={{ height: `${b}%` }} />
 ))}
 </div>
 </div>
 ))}
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ LISTS ═══════════ */}
 <Section id="lists" title="Lists" description="Various list patterns for agents, servers, and items.">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <DemoCard title="AGENT LIST">
 <div className="divide-y divide-border-subtle">
 {[
 { name: 'Support Bot', status: 'running', msgs: '12.4k', model: 'GPT-4o' },
 { name: 'Sales Agent', status: 'running', msgs: '8.3k', model: 'Claude Opus' },
 { name: 'Dev Helper', status: 'idle', msgs: '1.2k', model: 'DeepSeek V3' },
 { name: 'Content Writer', status: 'stopped', msgs: '0', model: 'GPT-4o' },
 ].map((a) => (
 <div key={a.name} className="flex items-center gap-3 py-3 hover:bg-surface-hover/50 px-2 -mx-2 rounded-cf-md transition-colors">
 <div className="flex h-8 w-8 items-center justify-center rounded-cf-md bg-brand-primary/10">
 <Bot className="h-4 w-4 text-brand-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground">{a.name}</p>
 <p className="text-[11px] text-foreground-muted">{a.model} · {a.msgs} msgs</p>
 </div>
 <span className={`h-2 w-2 rounded-full ${a.status === 'running' ? 'bg-success' : a.status === 'idle' ? 'bg-warning' : 'bg-foreground-subtle'}`} />
 <button className="p-1 text-foreground-subtle hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
 </div>
 ))}
 </div>
 </DemoCard>

 <DemoCard title="SERVER LIST">
 <div className="divide-y divide-border-subtle">
 {[
 { name: 'prod-main-01', region: 'EU West', cpu: '45%', ram: '3.2/4 GB', status: 'healthy' },
 { name: 'prod-main-02', region: 'US East', cpu: '78%', ram: '3.8/4 GB', status: 'warning' },
 { name: 'staging-01', region: 'EU West', cpu: '12%', ram: '1.1/4 GB', status: 'healthy' },
 ].map((s) => (
 <div key={s.name} className="flex items-center gap-3 py-3 hover:bg-surface-hover/50 px-2 -mx-2 rounded-cf-md transition-colors">
 <div className={`flex h-8 w-8 items-center justify-center rounded-cf-md ${s.status === 'healthy' ? 'bg-success/10' : 'bg-warning/10'}`}>
 <Server className={`h-4 w-4 ${s.status === 'healthy' ? 'text-success' : 'text-warning'}`} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground font-mono">{s.name}</p>
 <p className="text-[11px] text-foreground-muted">{s.region} · CPU {s.cpu} · RAM {s.ram}</p>
 </div>
 <button className="p-1 text-foreground-subtle hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
 </div>
 ))}
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ TIMELINE ═══════════ */}
 <Section id="timeline" title="Timeline" description="Activity and event timeline with icons and status.">
 <DemoCard>
 <div className="max-w-lg">
 <div className="relative pl-8 space-y-6">
 <div className="absolute left-3 top-2 bottom-2 w-px bg-border-default" />
 {[
 { icon: Zap, time: '2 min ago', title: 'Agent deployed', desc: 'Support Bot deployed to prod-main-01', color: 'bg-success text-success', iconBg: 'bg-success/10' },
 { icon: Settings, time: '15 min ago', title: 'Configuration updated', desc: 'Temperature changed from 0.7 to 0.9', color: 'bg-info text-info', iconBg: 'bg-info/10' },
 { icon: AlertTriangle, time: '1 hour ago', title: 'High memory warning', desc: 'prod-02 reached 92% memory usage', color: 'bg-warning text-warning', iconBg: 'bg-warning/10' },
 { icon: Users, time: '3 hours ago', title: 'Team member joined', desc: 'Maria S. accepted the invite', color: 'bg-brand-primary text-brand-primary', iconBg: 'bg-brand-primary/10' },
 { icon: Key, time: '1 day ago', title: 'API key created', desc: 'New key "Production v2" generated', color: 'bg-foreground-muted text-foreground-muted', iconBg: 'bg-surface-sunken' },
 ].map((e) => (
 <div key={e.title} className="relative flex gap-4">
 <div className={`absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full ${e.iconBg} z-10`}>
 <e.icon className={`h-3 w-3 ${e.color.split(' ')[1]}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <p className="text-sm font-medium text-foreground">{e.title}</p>
 <span className="text-[10px] text-foreground-subtle">{e.time}</span>
 </div>
 <p className="text-xs text-foreground-muted">{e.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ CODE BLOCKS ═══════════ */}
 <Section id="code-blocks" title="Code Blocks" description="Syntax-styled code snippets with copy buttons.">
 <div className="space-y-6">
 <DemoCard title="INLINE CODE">
 <p className="text-sm text-foreground">
 Run <code className="px-1.5 py-0.5 rounded-cf-sm bg-surface-sunken text-brand-primary font-mono text-xs">npx create-zephai@latest</code> to scaffold a new project.
 Use the <code className="px-1.5 py-0.5 rounded-cf-sm bg-surface-sunken text-brand-primary font-mono text-xs">--template</code> flag for templates.
 </p>
 </DemoCard>

 <DemoCard title="CODE BLOCK WITH COPY">
 <div className="rounded-cf-lg bg-surface-base overflow-hidden">
 <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
 <span className="text-xs text-foreground-muted">TypeScript</span>
 <button className="flex items-center gap-1 text-[10px] text-foreground-muted hover:text-foreground transition-colors"><Copy className="h-3 w-3" /> Copy</button>
 </div>
 <pre className="p-4 text-sm font-mono text-foreground overflow-x-auto leading-relaxed">
{`import { ZephAI } from '@zephai/sdk';

const cf = new ZephAI(process.env.API_KEY);

const agent = await cf.agents.create({
  name: 'My Agent',
  model: 'gpt-4o',
  skills: ['faq', 'email'],
});`}
 </pre>
 </div>
 </DemoCard>

 <DemoCard title="DIFF VIEW">
 <div className="rounded-cf-lg bg-surface-base overflow-hidden font-mono text-sm">
 <div className="px-4 py-2 border-b border-white/5">
 <span className="text-xs text-foreground-muted">config.yaml</span>
 </div>
 <div className="p-4 space-y-0">
 <div className="text-foreground-muted">  model: claude-opus</div>
 <div className="bg-error/10 text-[#f85149]">- temperature: 0.7</div>
 <div className="bg-success/10 text-[#7ee787]">+ temperature: 0.9</div>
 <div className="text-foreground-muted">  max_tokens: 4096</div>
 <div className="bg-error/10 text-[#f85149]">- skills: [faq]</div>
 <div className="bg-success/10 text-[#7ee787]">+ skills: [faq, email, calendar]</div>
 </div>
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ EMPTY STATES ═══════════ */}
 <Section id="empty-states" title="Empty States" description="Placeholder content when data is not yet available.">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <DemoCard>
 <div className="text-center py-8">
 <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken mx-auto mb-4">
 <Bot className="h-7 w-7 text-foreground-subtle" />
 </div>
 <h4 className="text-sm font-semibold text-foreground">No agents yet</h4>
 <p className="text-xs text-foreground-muted mt-1 max-w-[200px] mx-auto">Create your first AI agent to get started.</p>
 <button className="mt-4 rounded-cf-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-cf-inverse">
 <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Create Agent</span>
 </button>
 </div>
 </DemoCard>

 <DemoCard>
 <div className="text-center py-8">
 <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken mx-auto mb-4">
 <Search className="h-7 w-7 text-foreground-subtle" />
 </div>
 <h4 className="text-sm font-semibold text-foreground">No results found</h4>
 <p className="text-xs text-foreground-muted mt-1 max-w-[200px] mx-auto">Try adjusting your search or filters.</p>
 <button className="mt-4 rounded-cf-lg bg-surface-sunken px-4 py-2 text-xs font-medium text-foreground">Clear Filters</button>
 </div>
 </DemoCard>

 <DemoCard>
 <div className="text-center py-8">
 <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken mx-auto mb-4">
 <Activity className="h-7 w-7 text-foreground-subtle" />
 </div>
 <h4 className="text-sm font-semibold text-foreground">No activity yet</h4>
 <p className="text-xs text-foreground-muted mt-1 max-w-[200px] mx-auto">Activity will appear here once your agents start running.</p>
 </div>
 </DemoCard>
 </div>
 </Section>


 {/* ═══════════ BREADCRUMBS ═══════════ */}
 <Section id="breadcrumbs" title="Breadcrumbs" description="Hierarchical navigation showing page location.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">DEFAULT</p>
 <nav className="flex items-center gap-1.5 text-sm">
 <a className="text-foreground-muted hover:text-foreground transition-colors">Dashboard</a>
 <ChevronRight className="h-3 w-3 text-foreground-subtle" />
 <a className="text-foreground-muted hover:text-foreground transition-colors">Agents</a>
 <ChevronRight className="h-3 w-3 text-foreground-subtle" />
 <span className="text-foreground font-medium">Support Bot</span>
 </nav>
 </div>
 <div>
 <p className="text-overline mb-3">WITH ICONS</p>
 <nav className="flex items-center gap-1.5 text-sm">
 <a className="flex items-center gap-1 text-foreground-muted hover:text-foreground transition-colors"><Layout className="h-3.5 w-3.5" /> Dashboard</a>
 <ChevronRight className="h-3 w-3 text-foreground-subtle" />
 <a className="flex items-center gap-1 text-foreground-muted hover:text-foreground transition-colors"><Server className="h-3.5 w-3.5" /> Servers</a>
 <ChevronRight className="h-3 w-3 text-foreground-subtle" />
 <span className="flex items-center gap-1 text-foreground font-medium"><Terminal className="h-3.5 w-3.5" /> prod-main-01</span>
 </nav>
 </div>
 <div>
 <p className="text-overline mb-3">COMPACT (PILLS)</p>
 <nav className="flex items-center gap-1">
 {['Settings', 'Security', '2FA'].map((item, i, arr) => (
 <span key={item} className="flex items-center gap-1">
 <span className={`px-2.5 py-1 rounded-cf-full text-xs ${i === arr.length - 1 ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'text-foreground-muted hover:bg-surface-hover'}`}>{item}</span>
 {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-foreground-subtle" />}
 </span>
 ))}
 </nav>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ STEPPER ═══════════ */}
 <Section id="stepper" title="Stepper" description="Multi-step progress indicator for wizards and flows.">
 <DemoCard>
 <div className="space-y-8">
 <div>
 <p className="text-overline mb-4">HORIZONTAL STEPPER</p>
 <div className="flex items-center max-w-lg mx-auto">
 {[
 { label: 'Model', status: 'done' },
 { label: 'Messaging', status: 'active' },
 { label: 'Hosting', status: 'pending' },
 { label: 'Deploy', status: 'pending' },
 ].map((step, i, arr) => (
 <div key={step.label} className="flex items-center flex-1">
 <div className="flex flex-col items-center">
 <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all
 ${step.status === 'done' ? 'bg-success text-white' : step.status === 'active' ? 'bg-brand-primary text-white' : 'bg-surface-sunken text-foreground-muted'}`}>
 {step.status === 'done' ? <Check className="h-4 w-4" /> : i + 1}
 </div>
 <span className={`text-[11px] mt-1.5 ${step.status === 'active' ? 'text-brand-primary font-medium' : 'text-foreground-muted'}`}>{step.label}</span>
 </div>
 {i < arr.length - 1 && (
 <div className={`flex-1 h-0.5 mx-2 mt-[-18px] ${step.status === 'done' ? 'bg-success' : 'bg-border-default'}`} />
 )}
 </div>
 ))}
 </div>
 </div>

 <div>
 <p className="text-overline mb-4">VERTICAL STEPPER</p>
 <div className="relative pl-10 space-y-6 max-w-md">
 <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border-default" />
 {[
 { label: 'Pick AI Model', desc: 'Selected GPT-4o', status: 'done' },
 { label: 'Connect Messaging', desc: 'Configure your Telegram bot token', status: 'active' },
 { label: 'Choose Hosting', desc: 'Free VM or bring your own', status: 'pending' },
 { label: 'Deploy', desc: 'Launch your agent', status: 'pending' },
 ].map((step, i) => (
 <div key={step.label} className="relative">
 <div className={`absolute -left-10 flex h-7 w-7 items-center justify-center rounded-full z-10 text-xs font-semibold
 ${step.status === 'done' ? 'bg-success text-white' : step.status === 'active' ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : 'bg-surface-sunken text-foreground-muted'}`}>
 {step.status === 'done' ? <Check className="h-3.5 w-3.5" /> : i + 1}
 </div>
 <div>
 <p className={`text-sm font-medium ${step.status === 'active' ? 'text-foreground' : step.status === 'done' ? 'text-foreground-muted line-through' : 'text-foreground-muted'}`}>{step.label}</p>
 <p className="text-xs text-foreground-muted mt-0.5">{step.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ KEYBOARD SHORTCUTS ═══════════ */}
 <Section id="kbd" title="Keyboard Shortcuts" description="Key indicators for shortcuts and hotkeys.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">KEY STYLES</p>
 <div className="flex flex-wrap gap-2">
 {['⌘', 'K', 'Shift', 'Enter', 'Esc', '↑', '↓', 'Tab', 'Ctrl', 'Alt', 'Delete', 'Space'].map((k) => (
 <span key={k} className="kbd-key">{k}</span>
 ))}
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">SHORTCUT COMBOS</p>
 <div className="space-y-2 max-w-sm">
 {[
 { keys: ['⌘', 'K'], label: 'Command palette' },
 { keys: ['⌘', 'D'], label: 'Quick deploy' },
 { keys: ['⌘', 'Shift', 'T'], label: 'Open terminal' },
 { keys: ['⌘', 'J'], label: 'Toggle sidebar' },
 { keys: ['Esc'], label: 'Close modal' },
 ].map((s) => (
 <div key={s.label} className="flex items-center justify-between py-1.5">
 <span className="text-sm text-foreground-muted">{s.label}</span>
 <div className="flex items-center gap-1">
 {s.keys.map((k, i) => (
 <span key={i} className="kbd-key">{k}</span>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ DIVIDERS ═══════════ */}
 <Section id="dividers" title="Dividers & Separators" description="Visual separation patterns for content sections.">
 <DemoCard>
 <div className="space-y-8">
 <div>
 <p className="text-overline mb-3">SIMPLE DIVIDERS</p>
 <div className="space-y-4">
 <div className="border-t border-border-default" />
 <div className="border-t border-border-subtle" />
 <div className="border-t border-border-default border-dashed" />
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">FROSTED DIVIDER</p>
 <div className="frosted-hr" />
 </div>
 <div>
 <p className="text-overline mb-3">DIVIDER WITH LABEL</p>
 <div className="flex items-center gap-4">
 <div className="flex-1 border-t border-border-default" />
 <span className="text-[10px] text-foreground-muted uppercase tracking-wider">or continue with</span>
 <div className="flex-1 border-t border-border-default" />
 </div>
 </div>
 <div>
 <p className="text-overline mb-3">SPACING VARIANTS</p>
 <div className="space-y-2 text-xs text-foreground-muted text-center">
 <p>4px gap</p>
 <div className="border-t border-border-default" />
 <p className="pt-4">16px gap</p>
 <div className="border-t border-border-default" />
 <p className="pt-8">32px gap</p>
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* ═══════════ FILE UPLOAD ═══════════ */}
 <Section id="file-upload" title="File Upload" description="Drag and drop zones and file selection patterns.">
 <DemoCard>
 <div className="space-y-6">
 <div>
 <p className="text-overline mb-3">DRAG & DROP ZONE</p>
 <div className="border-2 border-dashed border-border-default rounded-cf-xl p-10 text-center hover:border-brand-primary/30 hover:bg-brand-primary/[0.02] transition-colors cursor-pointer">
 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken mx-auto mb-3">
 <Upload className="h-6 w-6 text-foreground-muted" />
 </div>
 <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
 <p className="text-xs text-foreground-muted mt-1">PDF, TXT, MD up to 10MB</p>
 </div>
 </div>

 <div>
 <p className="text-overline mb-3">UPLOADED FILES</p>
 <div className="space-y-2">
 {[
 { name: 'product-docs.pdf', size: '2.4 MB', status: 'done' },
 { name: 'faq-dataset.json', size: '1.1 MB', status: 'done' },
 { name: 'training-data.csv', size: '8.2 MB', status: 'uploading', progress: 65 },
 ].map((f) => (
 <div key={f.name} className="flex items-center gap-3 p-3 rounded-cf-md bg-surface-card border border-border-subtle">
 <div className="flex h-8 w-8 items-center justify-center rounded-cf-md bg-brand-primary/10 flex-shrink-0">
 <Upload className="h-3.5 w-3.5 text-brand-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
 <div className="flex items-center gap-2">
 <span className="text-[11px] text-foreground-muted">{f.size}</span>
 {f.status === 'uploading' && (
 <div className="flex-1 h-1 rounded-full bg-surface-sunken overflow-hidden max-w-[100px]">
 <div className="h-full rounded-full bg-brand-primary" style={{ width: `${f.progress}%` }} />
 </div>
 )}
 </div>
 </div>
 {f.status === 'done' ? (
 <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
 ) : (
 <span className="text-[10px] text-brand-primary font-medium flex-shrink-0">{f.progress}%</span>
 )}
 <button className="p-1 text-foreground-subtle hover:text-error"><X className="h-3.5 w-3.5" /></button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </DemoCard>
 </Section>


 {/* Footer — glass minimal */}
 <div className="border-t border-border-subtle/50 pt-10 pb-16 text-center">
 <div className="glass rounded-cf-xl border border-border-subtle/50 inline-block px-6 py-4">
 <p className="text-sm font-medium text-foreground">Zeph AI Design System v2.0</p>
 <p className="text-xs text-foreground-subtle mt-2">
 {NAV_SECTIONS.flatMap((g) => g.items).length} sections &middot; Both themes &middot; All CSS variables documented
 </p>
 </div>
 </div>

 </main>
 </div>
 </div>
 );
}
