import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn, getCategoryColor } from '@/lib/utils';
import Card from '@/components/ui/Card';
import type { Metrics, CountryCoverage } from '@/lib/types';

interface MetricsChartsProps {
  metrics: Metrics;
  className?: string;
}

const CHART_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#3B82F6',
  '#A855F7',
  '#84CC16',
];

export default function MetricsCharts({ metrics, className }: MetricsChartsProps) {
  const radarData = useMemo(
    () => [
      { metric: 'Content Quality', score: metrics.scores.content_quality },
      { metric: 'Navigation', score: metrics.scores.navigation },
      { metric: 'Completeness', score: metrics.scores.completeness },
      { metric: 'Accessibility', score: metrics.scores.accessibility },
      { metric: 'SEO', score: metrics.scores.seo },
      { metric: 'Freshness', score: metrics.scores.freshness },
    ],
    [metrics.scores]
  );

  const depthData = useMemo(
    () =>
      Object.entries(metrics.depth_distribution)
        .map(([depth, count]) => ({ depth: `Depth ${depth}`, count }))
        .sort((a, b) => parseInt(a.depth.split(' ')[1]) - parseInt(b.depth.split(' ')[1])),
    [metrics.depth_distribution]
  );

  const categoryData = useMemo(
    () =>
      Object.entries(metrics.category_distribution).map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
      })),
    [metrics.category_distribution]
  );

  const navDifficultyData = useMemo(
    () =>
      Object.entries(metrics.nav_difficulty_distribution)
        .map(([difficulty, count]) => ({
          difficulty,
          count,
        }))
        .sort((a, b) => parseInt(a.difficulty) - parseInt(b.difficulty)),
    [metrics.nav_difficulty_distribution]
  );

  const issuesData = useMemo(
    () => [
      { type: 'Critical', count: metrics.issues_by_type.critical, color: '#EF4444' },
      { type: 'Warning', count: metrics.issues_by_type.warning, color: '#F59E0B' },
      { type: 'Suggestion', count: metrics.issues_by_type.suggestion, color: '#3B82F6' },
    ],
    [metrics.issues_by_type]
  );

  const tagData = useMemo(
    () =>
      Object.entries(metrics.tag_frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count })),
    [metrics.tag_frequency]
  );

  const infoDepthData = useMemo(
    () =>
      Object.entries(metrics.information_depth)
        .map(([info, depth]) => ({ info, depth }))
        .sort((a, b) => a.depth - b.depth),
    [metrics.information_depth]
  );

  const completenessData = useMemo(
    () =>
      Object.entries(metrics.category_completeness)
        .map(([category, score]) => ({ category, score }))
        .sort((a, b) => b.score - a.score),
    [metrics.category_completeness]
  );

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#12121A',
      border: '1px solid #1E1E2E',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#FAFAFA',
    },
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Score Radar
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1E1E2E" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 11, fill: '#71717A' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#71717A' }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Depth Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={depthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
            <XAxis dataKey="depth" tick={{ fontSize: 11, fill: '#71717A' }} />
            <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
            <RechartsTooltip {...tooltipStyle} />
            <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Category Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={{ stroke: '#71717A' }}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Navigation Difficulty
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={navDifficultyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
            <XAxis
              dataKey="difficulty"
              tick={{ fontSize: 11, fill: '#71717A' }}
              label={{ value: 'Difficulty (1-10)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#71717A' }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
            <RechartsTooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {navDifficultyData.map((entry, index) => {
                const d = parseInt(entry.difficulty);
                const color = d <= 3 ? '#10B981' : d <= 6 ? '#F59E0B' : '#EF4444';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Issues by Type
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={issuesData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#71717A' }} />
            <YAxis
              type="category"
              dataKey="type"
              tick={{ fontSize: 11, fill: '#71717A' }}
              width={80}
            />
            <RechartsTooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {issuesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Country Coverage
        </h3>
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Country
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Language
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pages
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Coverage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {metrics.country_coverage.map((row, i) => (
                <tr key={i}>
                  <td className="py-2 px-3 text-foreground">
                    {row.country}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {row.language}
                  </td>
                  <td className="py-2 px-3 text-right text-foreground">
                    {row.pages}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-border-subtle overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-bg"
                          style={{ width: `${row.coverage_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {row.coverage_score}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {metrics.country_coverage.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No country data available.
            </p>
          )}
        </div>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Tag Frequency
        </h3>
        <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto">
          {tagData.map((item, index) => {
            const maxCount = tagData[0]?.count || 1;
            const scale = 0.7 + (item.count / maxCount) * 0.3;
            return (
              <motion.span
                key={item.tag}
                className="px-3 py-1 rounded-full text-xs font-medium border border-border text-foreground"
                style={{ fontSize: `${scale * 12}px` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                {item.tag}
                <span className="ml-1 text-muted-foreground">
                  ({item.count})
                </span>
              </motion.span>
            );
          })}
          {tagData.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tag data available.
            </p>
          )}
        </div>
      </Card>

      <Card variant="default" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Information Depth
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          How many clicks to reach key information types
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={infoDepthData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#71717A' }}
              label={{ value: 'Clicks from homepage', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#71717A' }}
            />
            <YAxis
              type="category"
              dataKey="info"
              tick={{ fontSize: 10, fill: '#71717A' }}
              width={120}
            />
            <RechartsTooltip {...tooltipStyle} />
            <Bar dataKey="depth" radius={[0, 4, 4, 0]}>
              {infoDepthData.map((entry, index) => {
                const color =
                  entry.depth <= 1
                    ? '#10B981'
                    : entry.depth <= 3
                    ? '#F59E0B'
                    : '#EF4444';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="default" padding="md" className="lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Category Completeness
        </h3>
        <div className="space-y-3">
          {completenessData.map((item, index) => (
            <motion.div
              key={item.category}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: getCategoryColor(item.category) }}
              />
              <span className="text-sm text-foreground w-32 truncate">
                {item.category}
              </span>
              <div className="flex-1 h-2 rounded-full bg-border-subtle overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ delay: index * 0.05, duration: 0.6 }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                {Math.round(item.score)}%
              </span>
            </motion.div>
          ))}
          {completenessData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No completeness data available.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
