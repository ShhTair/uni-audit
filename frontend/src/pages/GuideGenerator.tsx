import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  Copy,
  RefreshCw,
  Sparkles,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useUniversity, useGuide, useGenerateGuide } from '@/lib/api';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatDate, cn } from '@/lib/utils';

// ─── Generation progress steps ─────────────────────────────────────────────

const STEPS = [
  { id: 'collecting', label: 'Collecting pages' },
  { id: 'analyzing', label: 'Analyzing content' },
  { id: 'generating', label: 'Generating guide' },
  { id: 'done', label: 'Done' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

function useGenerationProgress() {
  const [currentStep, setCurrentStep] = useState<StepId | null>(null);
  const [done, setDone] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = useCallback(async (triggerMutation: () => Promise<any>) => {
    setDone(false);
    setCurrentStep('collecting');

    // Simulate timed progress steps while the real request is in-flight.
    const stepTimings: [StepId, number][] = [
      ['collecting', 0],
      ['analyzing', 1800],
      ['generating', 3600],
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    stepTimings.forEach(([step, delay]) => {
      timers.push(setTimeout(() => setCurrentStep(step), delay));
    });

    try {
      await triggerMutation();
    } finally {
      timers.forEach(clearTimeout);
      setCurrentStep('done');
      setDone(true);
    }
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(null);
    setDone(false);
  }, []);

  return { currentStep, done, run, reset };
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ProgressStepper({ currentStep }: { currentStep: StepId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <motion.div
            key={step.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300',
                isCompleted
                  ? 'bg-emerald-500'
                  : isActive
                  ? 'bg-brand-primary'
                  : 'bg-light-border dark:bg-dark-border'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : isActive ? (
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-white"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-light-muted dark:bg-dark-muted" />
              )}
            </div>
            <span
              className={cn(
                'text-sm transition-colors duration-300',
                isActive
                  ? 'text-light-text dark:text-dark-text font-semibold'
                  : isCompleted
                  ? 'text-emerald-500 font-medium'
                  : 'text-light-muted dark:text-dark-muted'
              )}
            >
              {step.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function SectionList({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: 'found' | 'missing';
}) {
  const isFound = type === 'found';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        {isFound ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
        <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">
          {title}
        </h4>
        <Badge variant={isFound ? 'success' : 'critical'} size="sm">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-light-muted dark:text-dark-muted italic">None</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((section) => (
            <motion.li
              key={section}
              className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text"
              initial={{ opacity: 0, x: isFound ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ChevronRight
                className={cn(
                  'w-3 h-3 flex-shrink-0',
                  isFound ? 'text-emerald-500' : 'text-red-400'
                )}
              />
              <span className="capitalize">{section.replace(/_/g, ' ')}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function GuideGenerator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: university, isLoading: uniLoading } = useUniversity(id!);
  const {
    data: guide,
    isLoading: guideLoading,
    isError: guideError,
  } = useGuide(id!);

  const generateGuide = useGenerateGuide();
  const { currentStep, done, run, reset } = useGenerationProgress();

  const isGenerating = generateGuide.isPending || (currentStep !== null && !done);

  const handleGenerate = async () => {
    reset();
    await run(() => generateGuide.mutateAsync(id!));
  };

  // Open the HTML in a new tab using a blob URL
  const handlePreview = () => {
    if (!guide?.html) return;
    const blob = new Blob([guide.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Revoke after a short delay to let the tab load
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // Trigger a print dialog via a hidden iframe
  const handleDownloadPdf = () => {
    if (!guide?.html) return;
    const blob = new Blob([guide.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/university/${id}/guide`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasGuide = !!guide && !guideError;

  if (uniLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Admission Guide Generator"
        subtitle={university?.name}
        breadcrumbs={[
          { label: 'Universities', path: '/' },
          { label: university?.name ?? '…', path: `/university/${id}` },
          { label: 'Guide Generator' },
        ]}
        actions={
          hasGuide && !isGenerating ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleGenerate}
              loading={isGenerating}
            >
              Regenerate
            </Button>
          ) : undefined
        }
      />

      {/* ── Hero section ── */}
      {!hasGuide && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="elevated" padding="lg">
            <div className="flex flex-col items-center text-center gap-6 py-6">
              <motion.div
                className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-brand-primary/30"
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              >
                <BookOpen className="w-8 h-8 text-white" />
              </motion.div>

              <div className="max-w-lg">
                <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
                  Generate an Admission Guide
                </h2>
                <p className="text-light-muted dark:text-dark-muted leading-relaxed">
                  UniAudit will crawl and synthesize all admission-related content
                  from this university's website into a single, structured guide
                  for prospective students — including deadlines, requirements,
                  financial aid, and more.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md text-left">
                {[
                  { icon: <FileText className="w-4 h-4" />, label: 'Structured sections', sub: 'Organized by topic' },
                  { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Completeness score', sub: "See what's missing" },
                  { icon: <Download className="w-4 h-4" />, label: 'Export as PDF', sub: 'Print or share' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-3 rounded-lg bg-light-hover dark:bg-dark-hover"
                  >
                    <span className="text-brand-primary mt-0.5 flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-light-text dark:text-dark-text">
                        {item.label}
                      </p>
                      <p className="text-xs text-light-muted dark:text-dark-muted">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={<Sparkles className="w-5 h-5" />}
                onClick={handleGenerate}
              >
                Generate Guide
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Regenerate notice when guide exists but page first loads ── */}
      {hasGuide && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Guide generated on {formatDate(guide.created_at)}
          <span className="mx-1">·</span>
          {guide.word_count.toLocaleString()} words
        </motion.div>
      )}

      {/* ── Generating / progress state ── */}
      <AnimatePresence>
        {isGenerating && currentStep && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="mb-8"
          >
            <Card variant="elevated" padding="lg">
              <div className="flex flex-col items-center gap-8 py-6">
                {/* Animated orb */}
                <div className="relative w-20 h-20">
                  <motion.div
                    className="absolute inset-0 rounded-full gradient-bg opacity-20"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full gradient-bg opacity-40"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
                  />
                  <div className="absolute inset-4 rounded-full gradient-bg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-light-text dark:text-dark-text mb-1">
                    Building your guide…
                  </h3>
                  <p className="text-sm text-light-muted dark:text-dark-muted">
                    This may take a minute
                  </p>
                </div>

                <ProgressStepper currentStep={currentStep} />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Guide results ── */}
      <AnimatePresence>
        {hasGuide && !isGenerating && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Score + actions row */}
            <div className="flex flex-wrap gap-6 items-start">
              {/* Completeness gauge */}
              <Card variant="elevated" padding="md" className="flex-shrink-0">
                <div className="flex flex-col items-center gap-3">
                  <ScoreGauge
                    score={guide.completeness_score}
                    size="lg"
                    label="Completeness"
                  />
                  <p className="text-xs text-center text-light-muted dark:text-dark-muted max-w-[120px]">
                    How complete the guide is compared to an ideal admission guide
                  </p>
                </div>
              </Card>

              {/* Action buttons */}
              <Card variant="default" padding="md" className="flex-1 min-w-[260px]">
                <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-4">
                  Guide Actions
                </h3>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="primary"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={handlePreview}
                    className="w-full justify-start"
                  >
                    Preview Guide
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Download className="w-4 h-4" />}
                    onClick={handleDownloadPdf}
                    className="w-full justify-start"
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="ghost"
                    icon={copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopyLink}
                    className="w-full justify-start"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sections found vs missing */}
            <Card variant="default" padding="md">
              <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-5">
                Section Coverage
              </h3>
              <div className="flex flex-col sm:flex-row gap-8">
                <SectionList
                  title="Sections Found"
                  items={guide.sections_found}
                  type="found"
                />
                <div className="hidden sm:block w-px bg-light-border dark:bg-dark-border self-stretch" />
                <SectionList
                  title="Sections Missing"
                  items={guide.sections_missing}
                  type="missing"
                />
              </div>
            </Card>

            {/* Quick stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Sections Found',
                  value: guide.sections_found.length,
                  color: 'text-emerald-500',
                },
                {
                  label: 'Sections Missing',
                  value: guide.sections_missing.length,
                  color: 'text-red-500',
                },
                {
                  label: 'Word Count',
                  value: guide.word_count.toLocaleString(),
                  color: 'text-light-text dark:text-dark-text',
                },
                {
                  label: 'Completeness',
                  value: `${Math.round(guide.completeness_score)}%`,
                  color: guide.completeness_score >= 80
                    ? 'text-emerald-500'
                    : guide.completeness_score >= 60
                    ? 'text-amber-500'
                    : 'text-red-500',
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card variant="outlined" padding="sm">
                    <p className="text-xs text-light-muted dark:text-dark-muted mb-1">
                      {stat.label}
                    </p>
                    <p className={cn('text-xl font-bold', stat.color)}>
                      {stat.value}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error state ── */}
      {generateGuide.isError && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4"
        >
          <Card variant="outlined" padding="md">
            <p className="text-sm text-red-500">
              {generateGuide.error instanceof Error
                ? generateGuide.error.message
                : 'Failed to generate guide. Please try again.'}
            </p>
          </Card>
        </motion.div>
      )}
    </>
  );
}
