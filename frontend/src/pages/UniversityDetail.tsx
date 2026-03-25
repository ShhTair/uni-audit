import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  BarChart3,
  FileText,
  Network,
  GitBranch,
  LayoutDashboard,
  Globe,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Compass,
  ShieldCheck,
  Search as SearchIcon,
  Sparkles,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  useUniversity,
  useUniversityPages,
  useUniversityTree,
  useUniversityGraph,
  useUniversityMetrics,
  useStartCrawl,
  useStartAnalysis,
} from '@/lib/api';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Input from '@/components/ui/Input';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ScoreCard from '@/components/university/ScoreCard';
import IssuesList from '@/components/university/IssuesList';
import PageTable from '@/components/university/PageTable';
import SiteTree from '@/components/university/SiteTree';
import SiteGraph from '@/components/university/SiteGraph';
import MetricsCharts from '@/components/university/MetricsCharts';
import {
  countryToEmoji,
  formatDate,
  getStatusColor,
  cn,
} from '@/lib/utils';
import type { PageFilters } from '@/lib/types';

const tabs = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'pages', label: 'Pages', icon: <FileText className="w-4 h-4" /> },
  { id: 'tree', label: 'Tree', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'graph', label: 'Graph', icon: <Network className="w-4 h-4" /> },
  { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [pageFilters, setPageFilters] = useState<PageFilters>({
    page: 1,
    per_page: 20,
    sort_by: 'ai_title',
    sort_order: 'asc',
  });

  const { data: university, isLoading } = useUniversity(id!);
  const { data: pagesData, isLoading: pagesLoading } = useUniversityPages(
    id!,
    activeTab === 'pages' ? pageFilters : {}
  );
  const { data: tree, isLoading: treeLoading } = useUniversityTree(id!);
  const { data: graph, isLoading: graphLoading } = useUniversityGraph(id!);
  const { data: metrics, isLoading: metricsLoading } = useUniversityMetrics(id!);

  const startCrawl = useStartCrawl();
  const startAnalysis = useStartAnalysis();

  const summary = university?.summary;

  const handleSort = (field: string) => {
    setPageFilters((prev) => ({
      ...prev,
      sort_by: field,
      sort_order:
        prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <EmptyState
        icon={<Globe className="w-8 h-8" />}
        title="University not found"
        description="The university you are looking for does not exist."
      />
    );
  }

  return (
    <>
      <Header
        title={university.name}
        subtitle={`${countryToEmoji(university.country)} ${university.domains.join(', ')}`}
        breadcrumbs={[
          { label: 'Universities', path: '/' },
          { label: university.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {(university.status === 'pending' || university.status === 'failed') && (
              <Button
                variant="primary"
                icon={<Play className="w-4 h-4" />}
                onClick={() => startCrawl.mutate(id!)}
                loading={startCrawl.isPending}
              >
                Start Crawl
              </Button>
            )}
            {university.status === 'crawled' && (
              <Button
                variant="primary"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => startAnalysis.mutate(id!)}
                loading={startAnalysis.isPending}
              >
                Start Analysis
              </Button>
            )}
            {university.status === 'completed' && (
              <Button
                variant="secondary"
                icon={<BookOpen className="w-4 h-4" />}
                onClick={() => navigate(`/university/${id}/guide`)}
              >
                Generate Guide
              </Button>
            )}
            <Badge
              variant={getStatusColor(university.status) as 'success' | 'warning' | 'critical' | 'info' | 'default'}
            >
              {university.status}
            </Badge>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 text-sm text-light-muted dark:text-dark-muted">
              <span>Created {formatDate(university.created_at)}</span>
              <span>Updated {formatDate(university.updated_at)}</span>
            </div>

            {summary && (
              <>
                <div className="flex flex-wrap gap-6 justify-center py-4">
                  <ScoreGauge score={summary.overall_score} size="lg" label="Overall" />
                  <ScoreGauge score={summary.content_quality_score} size="md" label="Content" />
                  <ScoreGauge score={summary.navigation_score} size="md" label="Navigation" />
                  <ScoreGauge score={summary.completeness_score} size="md" label="Completeness" />
                  <ScoreGauge score={summary.accessibility_score} size="md" label="Accessibility" />
                  <ScoreGauge score={summary.seo_score} size="md" label="SEO" />
                  <ScoreGauge score={summary.freshness_score} size="md" label="Freshness" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <ScoreCard
                    icon={<FileText className="w-4 h-4" />}
                    label="Total Pages"
                    value={summary.total_pages}
                  />
                  <ScoreCard
                    icon={<AlertCircle className="w-4 h-4" />}
                    label="Critical Issues"
                    value={summary.critical_issues}
                    colorByScore={summary.critical_issues === 0 ? 100 : summary.critical_issues < 5 ? 60 : 20}
                  />
                  <ScoreCard
                    icon={<AlertTriangle className="w-4 h-4" />}
                    label="Warnings"
                    value={summary.warnings}
                    colorByScore={summary.warnings === 0 ? 100 : summary.warnings < 10 ? 60 : 30}
                  />
                  <ScoreCard
                    icon={<Compass className="w-4 h-4" />}
                    label="Avg Depth"
                    value={summary.avg_depth.toFixed(1)}
                  />
                  <ScoreCard
                    icon={<Zap className="w-4 h-4" />}
                    label="Confusion Rate"
                    value={`${Math.round(summary.confusion_rate * 100)}%`}
                    colorByScore={summary.confusion_rate < 0.1 ? 80 : summary.confusion_rate < 0.3 ? 50 : 20}
                  />
                  <ScoreCard
                    icon={<Globe className="w-4 h-4" />}
                    label="Intl Readiness"
                    value={`${Math.round(summary.international_readiness)}%`}
                    colorByScore={summary.international_readiness}
                  />
                </div>

                {summary.top_issues.length > 0 && (
                  <Card variant="default" padding="md">
                    <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-4">
                      Top Issues
                    </h3>
                    <IssuesList issues={summary.top_issues} />
                  </Card>
                )}

                {Object.keys(summary.category_completeness).length > 0 && (
                  <Card variant="default" padding="md">
                    <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-4">
                      Category Completeness
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(summary.category_completeness)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, score], index) => (
                          <motion.div
                            key={category}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                          >
                            <span className="text-sm text-light-text dark:text-dark-text w-32 truncate">
                              {category}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                              <motion.div
                                className="h-full rounded-full gradient-bg"
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ delay: index * 0.04, duration: 0.6 }}
                              />
                            </div>
                            <span className="text-xs font-medium text-light-muted dark:text-dark-muted w-10 text-right">
                              {Math.round(score)}%
                            </span>
                          </motion.div>
                        ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {!summary && (
              <EmptyState
                icon={<BarChart3 className="w-8 h-8" />}
                title="No data yet"
                description="Start a crawl and analysis to see audit results."
              />
            )}
          </motion.div>
        )}

        {activeTab === 'pages' && (
          <motion.div
            key="pages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Search pages..."
                icon={<SearchIcon className="w-4 h-4" />}
                value={pageFilters.search || ''}
                onChange={(e) =>
                  setPageFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
                }
                className="w-64"
              />
              <select
                value={pageFilters.category || ''}
                onChange={(e) =>
                  setPageFilters((f) => ({
                    ...f,
                    category: e.target.value || undefined,
                    page: 1,
                  }))
                }
                className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
              >
                <option value="">All Categories</option>
                <option value="admissions">Admissions</option>
                <option value="financial_aid">Financial Aid</option>
                <option value="academics">Academics</option>
                <option value="student_life">Student Life</option>
                <option value="housing">Housing</option>
                <option value="international">International</option>
                <option value="about">About</option>
                <option value="contact">Contact</option>
              </select>
              <select
                value={`${pageFilters.min_depth || 0}-${pageFilters.max_depth || ''}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-');
                  setPageFilters((f) => ({
                    ...f,
                    min_depth: min ? parseInt(min) : undefined,
                    max_depth: max ? parseInt(max) : undefined,
                    page: 1,
                  }));
                }}
                className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
              >
                <option value="0-">All Depths</option>
                <option value="0-0">Homepage</option>
                <option value="1-1">Depth 1</option>
                <option value="2-2">Depth 2</option>
                <option value="3-3">Depth 3</option>
                <option value="4-">Depth 4+</option>
              </select>
            </div>

            {pagesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonCard key={i} className="h-16" />
                ))}
              </div>
            ) : pagesData ? (
              <>
                <PageTable
                  pages={pagesData.items}
                  universityId={id!}
                  sortBy={pageFilters.sort_by || 'ai_title'}
                  sortOrder={pageFilters.sort_order || 'asc'}
                  onSort={handleSort}
                />
                {pagesData.total_pages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-light-muted dark:text-dark-muted">
                      Showing {(pagesData.page - 1) * pagesData.per_page + 1} -{' '}
                      {Math.min(pagesData.page * pagesData.per_page, pagesData.total)} of{' '}
                      {pagesData.total} pages
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<ChevronLeft className="w-4 h-4" />}
                        disabled={pagesData.page <= 1}
                        onClick={() =>
                          setPageFilters((f) => ({
                            ...f,
                            page: (f.page || 1) - 1,
                          }))
                        }
                      >
                        Prev
                      </Button>
                      <span className="text-sm text-light-muted dark:text-dark-muted">
                        {pagesData.page} / {pagesData.total_pages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPageFilters((f) => ({
                            ...f,
                            page: (f.page || 1) + 1,
                          }))
                        }
                        disabled={pagesData.page >= pagesData.total_pages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title="No pages found"
                description="This university hasn't been crawled yet."
              />
            )}
          </motion.div>
        )}

        {activeTab === 'tree' && (
          <motion.div
            key="tree"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {treeLoading ? (
              <SkeletonChart className="h-96" />
            ) : tree ? (
              <SiteTree tree={tree} />
            ) : (
              <EmptyState
                icon={<GitBranch className="w-8 h-8" />}
                title="No tree data"
                description="Crawl and analyze the university to generate the site tree."
              />
            )}
          </motion.div>
        )}

        {activeTab === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {graphLoading ? (
              <SkeletonChart className="h-96" />
            ) : graph ? (
              <SiteGraph data={graph} />
            ) : (
              <EmptyState
                icon={<Network className="w-8 h-8" />}
                title="No graph data"
                description="Crawl and analyze the university to generate the site graph."
              />
            )}
          </motion.div>
        )}

        {activeTab === 'metrics' && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {metricsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonChart key={i} />
                ))}
              </div>
            ) : metrics ? (
              <MetricsCharts metrics={metrics} />
            ) : (
              <EmptyState
                icon={<BarChart3 className="w-8 h-8" />}
                title="No metrics data"
                description="Complete an analysis to see detailed metrics."
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
