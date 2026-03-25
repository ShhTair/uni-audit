import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  FileText,
  Clock,
  Globe,
  Layers,
  Navigation,
  Hash,
  Type,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  Zap,
  Link2,
} from 'lucide-react';
import { usePage, useUniversity } from '@/lib/api';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { cn, getCategoryColor } from '@/lib/utils';
import type { AIImprovement, HeadingItem, OutgoingLink } from '@/lib/types';

const improvementIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  suggestion: Lightbulb,
};

const improvementVariants: Record<string, 'critical' | 'warning' | 'suggestion'> = {
  critical: 'critical',
  warning: 'warning',
  suggestion: 'suggestion',
};

export default function PageReport() {
  const { id: uniId, pageId } = useParams<{ id: string; pageId: string }>();
  const { data: university } = useUniversity(uniId!);
  const { data: page, isLoading, error } = usePage(uniId!, pageId!);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!page) {
    return (
      <EmptyState
        icon={FileText}
        title="Page not found"
        description="The page you are looking for does not exist."
      />
    );
  }

  const criticalImprovements = page.ai_improvements.filter((i) => i.type === 'critical');
  const warningImprovements = page.ai_improvements.filter((i) => i.type === 'warning');
  const suggestionImprovements = page.ai_improvements.filter((i) => i.type === 'suggestion');

  const groupedLinks: Record<string, OutgoingLink[]> = {};
  page.outgoing_links.forEach((link) => {
    if (!groupedLinks[link.location]) groupedLinks[link.location] = [];
    groupedLinks[link.location].push(link);
  });

  return (
    <>
      <Header
        title={page.ai_title || page.original_title}
        subtitle={page.url}
        breadcrumbs={[
          { label: 'Universities', path: '/' },
          { label: university?.name || 'University', path: `/university/${uniId}` },
          { label: page.ai_title || 'Page' },
        ]}
        actions={
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-zinc-900/50 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Open Page
          </a>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <MetaCard
            icon={<Layers className="w-4 h-4" />}
            label="Category"
            value={page.category}
            sub={page.subcategory}
            color={getCategoryColor(page.category)}
          />
          <MetaCard
            icon={<Navigation className="w-4 h-4" />}
            label="Depth"
            value={String(page.depth)}
          />
          <MetaCard
            icon={<Zap className="w-4 h-4" />}
            label="Nav Difficulty"
            value={`${page.nav_difficulty}/10`}
            color={
              page.nav_difficulty <= 3
                ? '#10B981'
                : page.nav_difficulty <= 6
                ? '#F59E0B'
                : '#EF4444'
            }
          />
          <MetaCard
            icon={<Hash className="w-4 h-4" />}
            label="Word Count"
            value={page.word_count.toLocaleString()}
          />
          <MetaCard
            icon={<Clock className="w-4 h-4" />}
            label="Load Time"
            value={`${page.load_time.toFixed(1)}s`}
            color={page.load_time < 2 ? '#10B981' : page.load_time < 5 ? '#F59E0B' : '#EF4444'}
          />
          <MetaCard
            icon={<Globe className="w-4 h-4" />}
            label="Language"
            value={page.language}
          />
          <MetaCard
            icon={<Link2 className="w-4 h-4" />}
            label="Incoming Links"
            value={String(page.incoming_links_count)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {page.content_tags.map((tag) => (
            <Badge key={tag} variant="default" size="md">
              {tag}
            </Badge>
          ))}
          {page.issue_tags.map((tag) => (
            <Badge
              key={tag}
              variant={
                tag.includes('critical') ? 'critical' : tag.includes('warning') ? 'warning' : 'suggestion'
              }
              size="md"
            >
              {tag}
            </Badge>
          ))}
          {page.quality_tags.map((tag) => (
            <Badge key={tag} variant="success" size="md">
              {tag}
            </Badge>
          ))}
          {page.has_dynamic_content && (
            <Badge variant="info" size="md" icon={<Zap className="w-3 h-3" />}>
              Dynamic Content
            </Badge>
          )}
        </div>

        {page.ai_summary && (
          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              AI Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {page.ai_summary}
            </p>
          </Card>
        )}

        {page.ai_improvements.length > 0 && (
          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              AI Improvements ({page.ai_improvements.length})
            </h3>

            {criticalImprovements.length > 0 && (
              <ImprovementGroup title="Critical" improvements={criticalImprovements} />
            )}
            {warningImprovements.length > 0 && (
              <ImprovementGroup title="Warnings" improvements={warningImprovements} />
            )}
            {suggestionImprovements.length > 0 && (
              <ImprovementGroup title="Suggestions" improvements={suggestionImprovements} />
            )}
          </Card>
        )}

        {page.headings.length > 0 && (
          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Heading Structure
            </h3>
            <div className="space-y-1">
              {page.headings.map((heading, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2"
                  style={{ paddingLeft: `${(heading.level - 1) * 20}px` }}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Badge variant="default" size="sm">
                    H{heading.level}
                  </Badge>
                  <span
                    className={cn(
                      'text-sm',
                      heading.level === 1
                        ? 'font-bold text-foreground'
                        : heading.level === 2
                        ? 'font-semibold text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {heading.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {page.discovery_path.length > 0 && (
          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Discovery Path
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {page.discovery_path.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900/50 bg-zinc-900/50 text-foreground border border-border truncate max-w-[200px]">
                    {step}
                  </span>
                  {i < page.discovery_path.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {Object.keys(groupedLinks).length > 0 && (
          <Card variant="default" padding="md">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Outgoing Links ({page.outgoing_links.length})
            </h3>
            <div className="space-y-4">
              {Object.entries(groupedLinks).map(([location, links]) => (
                <div key={location}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {location} ({links.length})
                  </h4>
                  <div className="space-y-1">
                    {links.map((link, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-zinc-900/50 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">
                          {link.text || 'No text'}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate ml-auto shrink-0"
                        >
                          {link.url.length > 60 ? link.url.slice(0, 60) + '...' : link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function MetaCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p
          className="text-sm font-semibold truncate"
          style={color ? { color } : undefined}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-muted-foreground truncate">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function ImprovementGroup({
  title,
  improvements,
}: {
  title: string;
  improvements: AIImprovement[];
}) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title} ({improvements.length})
      </h4>
      <div className="space-y-2">
        {improvements.map((imp, i) => {
          const Icon = improvementIcons[imp.type];
          return (
            <motion.div
              key={i}
              className="flex gap-3 p-3 rounded-lg border border-border"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 mt-0.5',
                  imp.type === 'critical' && 'text-red-500',
                  imp.type === 'warning' && 'text-amber-500',
                  imp.type === 'suggestion' && 'text-blue-500'
                )}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={improvementVariants[imp.type]} size="sm">
                    {imp.category}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">
                  {imp.description}
                </p>
                {imp.impact && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Impact: {imp.impact}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
