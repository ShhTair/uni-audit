import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Globe,
  FileText,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useUniversities } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import AddUniversityModal from '@/components/university/AddUniversityModal';
import { countryToEmoji, formatDateShort } from '@/lib/utils';
import type { University } from '@/lib/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
    completed:  { label: 'Completed',  icon: <CheckCircle2 className="w-3 h-3" />, class: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    analyzing:  { label: 'Analyzing',  icon: <Loader2 className="w-3 h-3 animate-spin" />, class: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
    crawling:   { label: 'Crawling',   icon: <Loader2 className="w-3 h-3 animate-spin" />, class: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    discovering:{ label: 'Discovering',icon: <Loader2 className="w-3 h-3 animate-spin" />, class: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
    crawled:    { label: 'Crawled',    icon: <Globe className="w-3 h-3" />, class: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
    failed:     { label: 'Failed',     icon: <XCircle className="w-3 h-3" />, class: 'text-red-400 bg-red-400/10 border-red-400/20' },
    pending:    { label: 'Pending',    icon: <Clock className="w-3 h-3" />, class: 'text-white/40 bg-white/[0.04] border-white/10' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border ${s.class}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#06D6A0' : score >= 40 ? '#FBBF24' : '#F87171';
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {Math.round(score)}
    </div>
  );
}

function UniCard({ uni }: { uni: University }) {
  const navigate = useNavigate();
  const isActive = ['crawling', 'analyzing', 'discovering'].includes(uni.status);

  return (
    <motion.div variants={itemVariants}>
      <div
        onClick={() => navigate(`/university/${uni.id}`)}
        className="group relative rounded-2xl border border-white/[0.08] bg-[#111111] hover:border-white/[0.14] hover:bg-[#161616] transition-all cursor-pointer overflow-hidden"
      >
        {/* Subtle gradient top edge for completed */}
        {uni.status === 'completed' && (
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#06D6A0]/40 to-transparent" />
        )}

        {/* Active pulse indicator */}
        {isActive && (
          <div className="absolute top-3 right-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0 leading-none">{countryToEmoji(uni.country)}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-[14px] text-white/90 truncate leading-tight">
                  {uni.name}
                </h3>
                <p className="text-[11px] text-white/35 mt-0.5 truncate font-mono">
                  {uni.domains[0]}
                  {uni.domains.length > 1 && ` +${uni.domains.length - 1}`}
                </p>
              </div>
            </div>
            <StatusChip status={uni.status} />
          </div>

          {/* Score + stats */}
          {uni.summary && uni.status === 'completed' ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <ScoreGauge score={uni.summary.overall_score} size="sm" label="Score" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">Content</span>
                    <span className="text-white/70 font-medium">{Math.round(uni.summary.content_quality_score)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#06D6A0]/60"
                      style={{ width: `${uni.summary.content_quality_score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">Navigation</span>
                    <span className="text-white/70 font-medium">{Math.round(uni.summary.navigation_score)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7877FF]/60"
                      style={{ width: `${uni.summary.navigation_score}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-white/30" />
                  </div>
                  <p className="text-[13px] font-semibold text-white/80">{uni.summary.total_pages}</p>
                  <p className="text-[10px] text-white/30">Pages</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                  </div>
                  <p className="text-[13px] font-semibold text-red-400">{uni.summary.critical_issues}</p>
                  <p className="text-[10px] text-white/30">Critical</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  </div>
                  <p className="text-[13px] font-semibold text-amber-400">{uni.summary.warnings}</p>
                  <p className="text-[10px] text-white/30">Warnings</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-5 flex flex-col items-center justify-center gap-2 border border-dashed border-white/[0.06] rounded-xl">
              {isActive ? (
                <>
                  <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                  <p className="text-xs text-white/30">
                    {uni.status === 'crawling' ? 'Crawling pages…'
                      : uni.status === 'analyzing' ? 'Analyzing with AI…'
                      : uni.status === 'discovering' ? 'Scanning sitemap…'
                      : 'Processing…'}
                  </p>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-white/15" />
                  <p className="text-xs text-white/30">
                    {uni.status === 'pending' ? 'Ready to crawl'
                      : uni.status === 'crawled' ? 'Ready to analyze'
                      : uni.status === 'failed' ? 'Crawl failed'
                      : 'No data yet'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[10px] text-white/25">Added {formatDateShort(uni.created_at)}</span>
          <span className="text-[11px] text-[#06D6A0]/70 font-medium group-hover:text-[#06D6A0] transition-colors">
            View →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: universities, isLoading, error } = useUniversities();

  const total = universities?.length ?? 0;
  const completed = universities?.filter((u) => u.status === 'completed').length ?? 0;
  const active = universities?.filter((u) => ['crawling', 'analyzing', 'discovering'].length > 0).length ?? 0;

  return (
    <>
      <PageHeader
        title="Universities"
        subtitle="Audit admission websites and generate outreach reports"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Add University
          </Button>
        }
      />

      {/* Summary stats */}
      {!isLoading && universities && universities.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', value: total, color: 'text-white/70' },
            { label: 'Audited', value: completed, color: 'text-emerald-400' },
            { label: 'Active', value: universities.filter((u) => ['crawling', 'analyzing', 'discovering'].includes(u.status)).length, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-4 flex items-center gap-4"
            >
              <span className={`text-3xl font-bold tracking-tight ${color}`}>{value}</span>
              <span className="text-sm text-white/40">{label}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
          Failed to load universities. Please check your API connection.
        </div>
      )}

      {!isLoading && universities && universities.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No universities yet"
          description="Add your first university to start auditing their admission website."
          action={{ label: 'Add University', onClick: () => setModalOpen(true) }}
        />
      )}

      {!isLoading && universities && universities.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {universities.map((uni) => (
            <UniCard key={uni.id} uni={uni} />
          ))}
        </motion.div>
      )}

      <AddUniversityModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
