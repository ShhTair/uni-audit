import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  GraduationCap,
  LayoutDashboard,
  Palette,
  Globe,
  FileText,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Search,
  Settings,
  Users,
  BarChart3,
  Network,
  GitBranch,
  Play,
  Zap,
  Clock,
  Hash,
  Type,
  Link2,
  Compass,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Plus,
  X,
  ExternalLink,
  Home,
  Moon,
  Sun,
  Eye,
  Loader2,
  ArrowUpDown,
  Filter,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Star,
  Heart,
  Info,
  MapPin,
  Building2,
  Navigation,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ScoreGauge from '@/components/ui/ScoreGauge';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import { SkeletonLine, SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useTheme } from '@/components/ThemeProvider';

const brandSections = [
  { id: 'hero', label: 'Hero' },
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'components', label: 'Components' },
  { id: 'icons', label: 'Icons' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'animations', label: 'Animations' },
  { id: 'darklight', label: 'Dark / Light' },
  { id: 'logo', label: 'Logo' },
];

function SectionTitle({ children, id }: { children: React.ReactNode; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-100px' });

  return (
    <div ref={ref} id={id} className="pt-16 pb-6 scroll-mt-20">
      <motion.h2
        className="text-3xl font-bold text-foreground"
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.h2>
      <motion.div
        className="mt-2 h-1 rounded-full gradient-bg"
        initial={{ width: 0 }}
        animate={isInView ? { width: 80 } : { width: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
    </div>
  );
}

function ColorCard({
  name,
  hex,
  rgb,
  usage,
  className,
}: {
  name: string;
  hex: string;
  rgb: string;
  usage: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      className={cn(
        'rounded-xl border border-border overflow-hidden bg-card',
        className
      )}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-24 relative group" style={{ backgroundColor: hex }}>
        <button
          onClick={copy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/20 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs font-mono text-muted-foreground">{hex}</p>
        <p className="text-xs font-mono text-muted-foreground">{rgb}</p>
        <p className="text-xs text-muted-foreground mt-1">{usage}</p>
      </div>
    </motion.div>
  );
}

export default function Brandbook() {
  const [activeSection, setActiveSection] = useState('hero');
  const [exampleModalOpen, setExampleModalOpen] = useState(false);
  const [exampleTab, setExampleTab] = useState('first');
  const { theme } = useTheme();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    brandSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex gap-8">
      <nav className="hidden lg:block w-48 shrink-0 sticky top-6 self-start">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          On this page
        </p>
        <div className="space-y-1">
          {brandSections.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={cn(
                'block px-3 py-1.5 text-sm rounded-lg transition-all',
                activeSection === id
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="flex-1 min-w-0 pb-24">
        {/* ======================= HERO ======================= */}
        <section id="hero" className="relative overflow-hidden rounded-2xl mb-12">
          <div className="absolute inset-0 gradient-bg-animated opacity-90" />
          <div className="absolute inset-0">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-background/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="relative z-10 px-12 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-foreground" />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-foreground mb-4">
                UniAudit Brand Guidelines
              </h1>
              <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
                A comprehensive design system for the UniAudit university website audit platform.
                Built with precision, animated with care.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ======================= COLORS ======================= */}
        <SectionTitle id="colors">Colors</SectionTitle>

        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Brand Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ColorCard name="Primary (Indigo)" hex="#6366F1" rgb="rgb(99, 102, 241)" usage="Main actions, links, active states" />
              <ColorCard name="Secondary (Violet)" hex="#8B5CF6" rgb="rgb(139, 92, 246)" usage="Gradient midpoints, secondary accents" />
              <ColorCard name="Accent (Cyan)" hex="#06B6D4" rgb="rgb(6, 182, 212)" usage="Highlights, accent elements" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Brand Gradient</h3>
            <div className="h-16 rounded-xl gradient-bg" />
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              from-[#6366F1] via-[#8B5CF6] to-[#06B6D4]
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Dark Mode Palette</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ColorCard name="Background" hex="#0A0A0F" rgb="rgb(10, 10, 15)" usage="Page background" />
              <ColorCard name="Surface" hex="#12121A" rgb="rgb(18, 18, 26)" usage="Cards, panels" />
              <ColorCard name="Border" hex="#1E1E2E" rgb="rgb(30, 30, 46)" usage="Dividers, borders" />
              <ColorCard name="Hover" hex="#252538" rgb="rgb(37, 37, 56)" usage="Hover states" />
              <ColorCard name="Muted" hex="#71717A" rgb="rgb(113, 113, 122)" usage="Secondary text" />
              <ColorCard name="Text" hex="#FAFAFA" rgb="rgb(250, 250, 250)" usage="Primary text" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Light Mode Palette</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ColorCard name="Background" hex="#FAFAFA" rgb="rgb(250, 250, 250)" usage="Page background" />
              <ColorCard name="Surface" hex="#FFFFFF" rgb="rgb(255, 255, 255)" usage="Cards, panels" />
              <ColorCard name="Border" hex="#E5E7EB" rgb="rgb(229, 231, 235)" usage="Dividers, borders" />
              <ColorCard name="Hover" hex="#F3F4F6" rgb="rgb(243, 244, 246)" usage="Hover states" />
              <ColorCard name="Muted" hex="#6B7280" rgb="rgb(107, 114, 128)" usage="Secondary text" />
              <ColorCard name="Text" hex="#111827" rgb="rgb(17, 24, 39)" usage="Primary text" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Semantic Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorCard name="Success" hex="#10B981" rgb="rgb(16, 185, 129)" usage="Positive indicators" />
              <ColorCard name="Warning" hex="#F59E0B" rgb="rgb(245, 158, 11)" usage="Caution states" />
              <ColorCard name="Error" hex="#EF4444" rgb="rgb(239, 68, 68)" usage="Error, critical" />
              <ColorCard name="Info" hex="#06B6D4" rgb="rgb(6, 182, 212)" usage="Informational" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Gray Scale</h3>
            <div className="flex rounded-xl overflow-hidden h-12">
              {['#FAFAFA', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#0A0A0F'].map((c) => (
                <div key={c} className="flex-1" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>
        </div>

        {/* ======================= TYPOGRAPHY ======================= */}
        <SectionTitle id="typography">Typography</SectionTitle>

        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Font Families</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="default" padding="md">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Primary Font</p>
                <p className="text-4xl font-sans text-foreground mb-2">Inter</p>
                <div className="space-y-2 mt-4">
                  <p className="font-light text-foreground">Light (300) - The quick brown fox jumps over the lazy dog</p>
                  <p className="font-normal text-foreground">Regular (400) - The quick brown fox jumps over the lazy dog</p>
                  <p className="font-medium text-foreground">Medium (500) - The quick brown fox jumps over the lazy dog</p>
                  <p className="font-semibold text-foreground">Semibold (600) - The quick brown fox jumps over the lazy dog</p>
                  <p className="font-bold text-foreground">Bold (700) - The quick brown fox jumps over the lazy dog</p>
                  <p className="font-extrabold text-foreground">Extrabold (800) - The quick brown fox jumps over the lazy dog</p>
                </div>
              </Card>
              <Card variant="default" padding="md">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mono Font</p>
                <p className="text-4xl font-mono text-foreground mb-2">JetBrains Mono</p>
                <div className="space-y-2 mt-4 font-mono">
                  <p className="font-normal text-foreground">Regular (400) - const data = await fetch(url)</p>
                  <p className="font-medium text-foreground">Medium (500) - const data = await fetch(url)</p>
                  <p className="font-semibold text-foreground">Semibold (600) - const data = await fetch(url)</p>
                </div>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Type Scale</h3>
            <Card variant="default" padding="md">
              <div className="space-y-6">
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">h1 / 3rem</span>
                  <h1 className="text-5xl font-bold text-foreground">Heading One</h1>
                </div>
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">h2 / 2.25rem</span>
                  <h2 className="text-4xl font-bold text-foreground">Heading Two</h2>
                </div>
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">h3 / 1.5rem</span>
                  <h3 className="text-2xl font-semibold text-foreground">Heading Three</h3>
                </div>
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">h4 / 1.25rem</span>
                  <h4 className="text-xl font-semibold text-foreground">Heading Four</h4>
                </div>
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">h5 / 1.125rem</span>
                  <h5 className="text-lg font-medium text-foreground">Heading Five</h5>
                </div>
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">h6 / 1rem</span>
                  <h6 className="text-base font-medium text-foreground">Heading Six</h6>
                </div>
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">body / 0.875rem</span>
                  <p className="text-sm text-foreground">Body text used for paragraphs and descriptions across the application.</p>
                </div>
                <div className="flex items-baseline gap-4 border-b border-border pb-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">caption / 0.75rem</span>
                  <p className="text-xs text-muted-foreground">Caption text used for labels, metadata, and small descriptions.</p>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">overline / 0.625rem</span>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Overline Text</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ======================= COMPONENTS ======================= */}
        <SectionTitle id="components">Components</SectionTitle>

        <div className="space-y-10">
          {/* Buttons */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Buttons</h3>
            <Card variant="default" padding="md">
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Variants</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Sizes</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">With Icons</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Add New</Button>
                    <Button variant="secondary" icon={<Download className="w-4 h-4" />}>Export</Button>
                    <Button variant="ghost" icon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
                    <Button variant="destructive" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Loading & Disabled</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" loading>Loading</Button>
                    <Button variant="secondary" loading>Loading</Button>
                    <Button variant="primary" disabled>Disabled</Button>
                    <Button variant="secondary" disabled>Disabled</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Badges</h3>
            <Card variant="default" padding="md">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Variants (md)</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="critical">Critical</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="suggestion">Suggestion</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Small</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default" size="sm">Default</Badge>
                    <Badge variant="critical" size="sm">Critical</Badge>
                    <Badge variant="warning" size="sm">Warning</Badge>
                    <Badge variant="success" size="sm">Success</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">With Icons & Dismiss</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="critical" icon={<AlertCircle className="w-3 h-3" />}>3 Critical</Badge>
                    <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3" />}>12 Warnings</Badge>
                    <Badge variant="info" icon={<Info className="w-3 h-3" />}>New</Badge>
                    <Badge variant="success" onDismiss={() => {}}>Dismissible</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Cards */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="default" padding="md" hoverable>
                <h4 className="font-semibold text-foreground mb-1">Default Card</h4>
                <p className="text-sm text-muted-foreground">Standard surface with border. Hoverable with lift effect.</p>
              </Card>
              <Card variant="elevated" padding="md" hoverable>
                <h4 className="font-semibold text-foreground mb-1">Elevated Card</h4>
                <p className="text-sm text-muted-foreground">Elevated with shadow for emphasis.</p>
              </Card>
              <Card variant="outlined" padding="md" hoverable>
                <h4 className="font-semibold text-foreground mb-1">Outlined Card</h4>
                <p className="text-sm text-muted-foreground">Transparent background with border.</p>
              </Card>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Inputs</h3>
            <Card variant="default" padding="md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Default Input" placeholder="Enter something..." />
                <Input label="With Icon" placeholder="Search..." icon={<Search className="w-4 h-4" />} />
                <Input label="Error State" placeholder="Invalid input" error="This field is required" />
                <Input label="Disabled" placeholder="Cannot edit" disabled />
              </div>
            </Card>
          </div>

          {/* Score Gauges */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Score Gauges</h3>
            <Card variant="default" padding="md">
              <div className="flex flex-wrap gap-8 justify-center">
                <ScoreGauge score={92} size="lg" label="Excellent" />
                <ScoreGauge score={73} size="md" label="Good" />
                <ScoreGauge score={55} size="md" label="Fair" />
                <ScoreGauge score={28} size="md" label="Poor" />
                <ScoreGauge score={85} size="sm" label="Small" />
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Tabs</h3>
            <Card variant="default" padding="md">
              <Tabs
                tabs={[
                  { id: 'first', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
                  { id: 'second', label: 'Pages', icon: <FileText className="w-4 h-4" /> },
                  { id: 'third', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
                ]}
                activeTab={exampleTab}
                onChange={setExampleTab}
              />
              <div className="mt-4 p-4 rounded-lg bg-zinc-900/50 bg-zinc-900/50 text-sm text-muted-foreground">
                Content for tab: <span className="font-semibold text-foreground">{exampleTab}</span>
              </div>
            </Card>
          </div>

          {/* Modal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Modal</h3>
            <Card variant="default" padding="md">
              <Button variant="primary" onClick={() => setExampleModalOpen(true)}>
                Open Example Modal
              </Button>
              <Modal
                open={exampleModalOpen}
                onClose={() => setExampleModalOpen(false)}
                title="Example Modal"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  This is an example modal with backdrop blur and smooth enter/exit animations.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setExampleModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setExampleModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </Modal>
            </Card>
          </div>

          {/* Tooltips */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Tooltips</h3>
            <Card variant="default" padding="md">
              <div className="flex flex-wrap gap-4">
                <Tooltip content="Top tooltip" position="top"><Button variant="secondary">Top</Button></Tooltip>
                <Tooltip content="Bottom tooltip" position="bottom"><Button variant="secondary">Bottom</Button></Tooltip>
                <Tooltip content="Left tooltip" position="left"><Button variant="secondary">Left</Button></Tooltip>
                <Tooltip content="Right tooltip" position="right"><Button variant="secondary">Right</Button></Tooltip>
              </div>
            </Card>
          </div>

          {/* Skeletons */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Skeletons</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Lines</p>
                <SkeletonLine />
                <SkeletonLine className="w-3/4" />
                <SkeletonLine className="w-1/2" />
              </div>
              <SkeletonCard />
              <SkeletonChart />
            </div>
          </div>

          {/* Empty State */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Empty State</h3>
            <Card variant="outlined" padding="none">
              <EmptyState
                icon={FileText}
                title="No data found"
                description="Start by adding items or adjusting your filters."
                action={{ label: 'Add Item', onClick: () => {} }}
              />
            </Card>
          </div>
        </div>

        {/* ======================= ICONS ======================= */}
        <SectionTitle id="icons">Icons</SectionTitle>

        <Card variant="default" padding="md">
          <p className="text-xs text-muted-foreground mb-4">
            Powered by Lucide React. All icons used in the application:
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {[
              { icon: GraduationCap, name: 'GraduationCap' },
              { icon: LayoutDashboard, name: 'Dashboard' },
              { icon: Palette, name: 'Palette' },
              { icon: Globe, name: 'Globe' },
              { icon: FileText, name: 'FileText' },
              { icon: AlertCircle, name: 'AlertCircle' },
              { icon: AlertTriangle, name: 'AlertTriangle' },
              { icon: Lightbulb, name: 'Lightbulb' },
              { icon: Search, name: 'Search' },
              { icon: Settings, name: 'Settings' },
              { icon: Users, name: 'Users' },
              { icon: BarChart3, name: 'BarChart3' },
              { icon: Network, name: 'Network' },
              { icon: GitBranch, name: 'GitBranch' },
              { icon: Play, name: 'Play' },
              { icon: Zap, name: 'Zap' },
              { icon: Clock, name: 'Clock' },
              { icon: Hash, name: 'Hash' },
              { icon: Type, name: 'Type' },
              { icon: Link2, name: 'Link2' },
              { icon: Compass, name: 'Compass' },
              { icon: ShieldCheck, name: 'ShieldCheck' },
              { icon: Sparkles, name: 'Sparkles' },
              { icon: ChevronRight, name: 'ChevronRight' },
              { icon: ChevronDown, name: 'ChevronDown' },
              { icon: ChevronLeft, name: 'ChevronLeft' },
              { icon: Plus, name: 'Plus' },
              { icon: X, name: 'X' },
              { icon: ExternalLink, name: 'ExternalLink' },
              { icon: Home, name: 'Home' },
              { icon: Moon, name: 'Moon' },
              { icon: Sun, name: 'Sun' },
              { icon: Eye, name: 'Eye' },
              { icon: Loader2, name: 'Loader2' },
              { icon: ArrowUpDown, name: 'ArrowUpDown' },
              { icon: Filter, name: 'Filter' },
              { icon: Trash2, name: 'Trash2' },
              { icon: Download, name: 'Download' },
              { icon: Upload, name: 'Upload' },
              { icon: RefreshCw, name: 'RefreshCw' },
              { icon: Star, name: 'Star' },
              { icon: Heart, name: 'Heart' },
              { icon: Info, name: 'Info' },
              { icon: Copy, name: 'Copy' },
              { icon: Check, name: 'Check' },
              { icon: MapPin, name: 'MapPin' },
              { icon: Building2, name: 'Building2' },
              { icon: Navigation, name: 'Navigation' },
              { icon: Layers, name: 'Layers' },
            ].map(({ icon: Icon, name }) => (
              <Tooltip key={name} content={name}>
                <motion.div
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-zinc-900/50 transition-colors cursor-default"
                  whileHover={{ scale: 1.05 }}
                >
                  <Icon className="w-5 h-5 text-foreground" />
                  <span className="text-[9px] text-muted-foreground text-center truncate w-full">
                    {name}
                  </span>
                </motion.div>
              </Tooltip>
            ))}
          </div>
        </Card>

        {/* ======================= SPACING ======================= */}
        <SectionTitle id="spacing">Spacing & Layout</SectionTitle>

        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Spacing Scale</h3>
            <Card variant="default" padding="md">
              <div className="space-y-3">
                {[
                  { px: 4, label: '4px / 0.25rem (1)' },
                  { px: 8, label: '8px / 0.5rem (2)' },
                  { px: 12, label: '12px / 0.75rem (3)' },
                  { px: 16, label: '16px / 1rem (4)' },
                  { px: 20, label: '20px / 1.25rem (5)' },
                  { px: 24, label: '24px / 1.5rem (6)' },
                  { px: 32, label: '32px / 2rem (8)' },
                  { px: 40, label: '40px / 2.5rem (10)' },
                  { px: 48, label: '48px / 3rem (12)' },
                  { px: 64, label: '64px / 4rem (16)' },
                ].map(({ px, label }) => (
                  <div key={px} className="flex items-center gap-4">
                    <span className="text-xs font-mono text-muted-foreground w-40 shrink-0">{label}</span>
                    <div className="h-3 rounded-sm gradient-bg" style={{ width: `${px}px` }} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Border Radius</h3>
            <Card variant="default" padding="md">
              <div className="flex flex-wrap gap-4">
                {[
                  { radius: '0.25rem', label: 'rounded (4px)' },
                  { radius: '0.375rem', label: 'rounded-md (6px)' },
                  { radius: '0.5rem', label: 'rounded-lg (8px)' },
                  { radius: '0.75rem', label: 'rounded-xl (12px)' },
                  { radius: '1rem', label: 'rounded-2xl (16px)' },
                  { radius: '9999px', label: 'rounded-full' },
                ].map(({ radius, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 h-16 gradient-bg"
                      style={{ borderRadius: radius }}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Shadows</h3>
            <Card variant="default" padding="md">
              <div className="flex flex-wrap gap-6">
                {[
                  { shadow: '0 1px 2px rgba(0,0,0,0.05)', label: 'shadow-sm' },
                  { shadow: '0 1px 3px rgba(0,0,0,0.1)', label: 'shadow' },
                  { shadow: '0 4px 6px rgba(0,0,0,0.1)', label: 'shadow-sm' },
                  { shadow: '0 10px 15px rgba(0,0,0,0.1)', label: 'shadow-sm' },
                  { shadow: '0 20px 25px rgba(0,0,0,0.1)', label: 'shadow-xl' },
                  { shadow: '0 25px 50px rgba(0,0,0,0.25)', label: 'shadow-md' },
                ].map(({ shadow, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div
                      className="w-20 h-20 rounded-xl bg-card border border-border"
                      style={{ boxShadow: shadow }}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ======================= ANIMATIONS ======================= */}
        <SectionTitle id="animations">Animations</SectionTitle>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimationDemo title="Fade In" animationKey="fade-in">
              {(play) => (
                <AnimatePresence mode="wait">
                  {play && (
                    <motion.div
                      className="w-20 h-20 rounded-xl gradient-bg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </AnimatePresence>
              )}
            </AnimationDemo>

            <AnimationDemo title="Slide Up" animationKey="slide-up">
              {(play) => (
                <AnimatePresence mode="wait">
                  {play && (
                    <motion.div
                      className="w-20 h-20 rounded-xl gradient-bg"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 30 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </AnimatePresence>
              )}
            </AnimationDemo>

            <AnimationDemo title="Scale In" animationKey="scale-in">
              {(play) => (
                <AnimatePresence mode="wait">
                  {play && (
                    <motion.div
                      className="w-20 h-20 rounded-xl gradient-bg"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </AnimatePresence>
              )}
            </AnimationDemo>

            <AnimationDemo title="Hover Effect" animationKey="hover">
              {() => (
                <motion.div
                  className="w-20 h-20 rounded-xl gradient-bg cursor-pointer"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                />
              )}
            </AnimationDemo>

            <AnimationDemo title="Loading Spinner" animationKey="spinner">
              {() => (
                <motion.div
                  className="w-12 h-12 rounded-full border-3 border-border border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ borderWidth: 3 }}
                />
              )}
            </AnimationDemo>

            <AnimationDemo title="Gradient Text" animationKey="gradient-text">
              {() => (
                <motion.span
                  className="text-2xl font-bold gradient-text"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: '200% 200%' }}
                >
                  UniAudit
                </motion.span>
              )}
            </AnimationDemo>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Stagger Children</h3>
            <StaggerDemo />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Page Transition</h3>
            <PageTransitionDemo />
          </div>
        </div>

        {/* ======================= DARK/LIGHT ======================= */}
        <SectionTitle id="darklight">Dark / Light Mode</SectionTitle>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="px-4 py-2 bg-zinc-800 text-foreground text-xs font-semibold">Dark Mode</div>
            <div className="bg-[#0A0A0F] p-6 space-y-3">
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
                <h4 className="text-[#FAFAFA] font-semibold mb-1">Card Title</h4>
                <p className="text-[#71717A] text-sm">Card description text</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-900/30 text-indigo-400">Badge</span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-900/30 text-emerald-400">Success</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-foreground gradient-bg">Primary</button>
                <button className="px-4 py-2 text-sm font-medium rounded-lg bg-[#12121A] border border-[#1E1E2E] text-[#FAFAFA]">Secondary</button>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-border">
            <div className="px-4 py-2 bg-zinc-100 text-zinc-800 text-xs font-semibold">Light Mode</div>
            <div className="bg-[#FAFAFA] p-6 space-y-3">
              <div className="bg-background border border-[#E5E7EB] rounded-xl p-4">
                <h4 className="text-[#111827] font-semibold mb-1">Card Title</h4>
                <p className="text-[#6B7280] text-sm">Card description text</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">Badge</span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Success</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-foreground gradient-bg">Primary</button>
                <button className="px-4 py-2 text-sm font-medium rounded-lg bg-background border border-[#E5E7EB] text-[#111827]">Secondary</button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================= LOGO ======================= */}
        <SectionTitle id="logo">Logo</SectionTitle>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-zinc-900/50 bg-zinc-900/50">
                On Dark Background
              </div>
              <div className="bg-[#0A0A0F] p-8 flex flex-col items-center gap-6">
                <LogoDisplay size="lg" bgDark />
                <LogoDisplay size="md" bgDark />
                <LogoDisplay size="sm" bgDark />
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-zinc-900/50 bg-zinc-900/50">
                On Light Background
              </div>
              <div className="bg-background p-8 flex flex-col items-center gap-6">
                <LogoDisplay size="lg" bgDark={false} />
                <LogoDisplay size="md" bgDark={false} />
                <LogoDisplay size="sm" bgDark={false} />
              </div>
            </div>
          </div>

          <Card variant="default" padding="md">
            <h4 className="text-sm font-semibold text-foreground mb-3">Logo Construction</h4>
            <p className="text-sm text-muted-foreground">
              The UniAudit logo is text-based. "Uni" uses Inter Regular (400) weight, and "Audit" uses Inter Bold (700).
              A small gradient accent dot appears after the text. The gradient icon uses a rounded square with the GraduationCap icon.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LogoDisplay({ size, bgDark }: { size: 'sm' | 'md' | 'lg'; bgDark: boolean }) {
  const sizes = {
    sm: { icon: 6, iconInner: 3, text: 'text-base', gap: 'gap-1.5' },
    md: { icon: 8, iconInner: 4, text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 12, iconInner: 6, text: 'text-3xl', gap: 'gap-3' },
  };
  const s = sizes[size];

  return (
    <div className={cn('flex items-center', s.gap)}>
      <div
        className={cn('rounded-lg gradient-bg flex items-center justify-center')}
        style={{ width: `${s.icon * 4}px`, height: `${s.icon * 4}px` }}
      >
        <GraduationCap className="text-foreground" style={{ width: `${s.iconInner * 4}px`, height: `${s.iconInner * 4}px` }} />
      </div>
      <span className={cn(s.text, bgDark ? 'text-foreground' : 'text-zinc-900')}>
        <span className="font-normal">Uni</span>
        <span className="font-bold">Audit</span>
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full gradient-bg"
        style={{ marginTop: size === 'lg' ? '-12px' : size === 'md' ? '-8px' : '-6px' }}
      />
    </div>
  );
}

function AnimationDemo({
  title,
  animationKey,
  children,
}: {
  title: string;
  animationKey: string;
  children: (play: boolean) => React.ReactNode;
}) {
  const [play, setPlay] = useState(true);

  const toggle = () => {
    setPlay(false);
    setTimeout(() => setPlay(true), 100);
  };

  return (
    <Card variant="default" padding="md">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {animationKey !== 'hover' && animationKey !== 'spinner' && animationKey !== 'gradient-text' && (
          <button
            onClick={toggle}
            className="text-xs text-primary hover:underline"
          >
            Replay
          </button>
        )}
      </div>
      <div className="flex items-center justify-center h-28">
        {children(play)}
      </div>
    </Card>
  );
}

function StaggerDemo() {
  const [play, setPlay] = useState(true);
  const items = ['Admissions', 'Financial Aid', 'Academics', 'Student Life', 'Housing'];

  const replay = () => {
    setPlay(false);
    setTimeout(() => setPlay(true), 100);
  };

  return (
    <Card variant="default" padding="md">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Stagger Children
        </p>
        <button onClick={replay} className="text-xs text-primary hover:underline">
          Replay
        </button>
      </div>
      <AnimatePresence mode="wait">
        {play && (
          <motion.div
            className="flex flex-wrap gap-3"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {},
            }}
          >
            {items.map((item) => (
              <motion.div
                key={item}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.8 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function PageTransitionDemo() {
  const [page, setPage] = useState(0);
  const pages = ['Dashboard', 'University Detail', 'Page Report'];

  return (
    <Card variant="default" padding="md">
      <div className="flex items-center gap-3 mb-4">
        {pages.map((p, i) => (
          <button
            key={p}
            onClick={() => setPage(i)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all',
              page === i
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-zinc-900/50'
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="h-32 rounded-lg border border-border overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            className="absolute inset-0 p-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-2">
              <div className="h-4 w-1/3 rounded bg-border-subtle" />
              <div className="h-3 w-2/3 rounded bg-border-subtle" />
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 flex-1 rounded-lg bg-border-subtle" />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {pages[page]} page content
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}
