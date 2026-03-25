import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Lightbulb, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { TopIssue } from '@/lib/types';

interface IssuesListProps {
  issues: TopIssue[];
  className?: string;
}

const issueIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  suggestion: Lightbulb,
};

const issueVariants: Record<string, 'critical' | 'warning' | 'suggestion'> = {
  critical: 'critical',
  warning: 'warning',
  suggestion: 'suggestion',
};

export default function IssuesList({ issues, className }: IssuesListProps) {
  const [filter, setFilter] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredIssues =
    filter === 'all' ? issues : issues.filter((i) => i.type === filter);

  const counts = {
    all: issues.length,
    critical: issues.filter((i) => i.type === 'critical').length,
    warning: issues.filter((i) => i.type === 'warning').length,
    suggestion: issues.filter((i) => i.type === 'suggestion').length,
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'critical', 'warning', 'suggestion'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all',
              filter === f
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-zinc-900/50'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredIssues.map((issue, index) => {
            const Icon = issueIcons[issue.type];
            const isExpanded = expandedIndex === index;
            return (
              <motion.div
                key={`${issue.type}-${issue.category}-${index}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="flex items-center gap-3 w-full p-3 hover:bg-zinc-900/50 transition-colors text-left"
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      issue.type === 'critical' && 'text-red-500',
                      issue.type === 'warning' && 'text-amber-500',
                      issue.type === 'suggestion' && 'text-blue-500'
                    )}
                  />
                  <span className="flex-1 text-sm text-foreground">
                    {issue.description}
                  </span>
                  <Badge variant={issueVariants[issue.type]} size="sm">
                    {issue.affected_pages} pages
                  </Badge>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border"
                    >
                      <div className="p-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Category:</span>
                          <Badge variant="default" size="sm">
                            {issue.category}
                          </Badge>
                        </div>
                        <p>
                          This issue affects {issue.affected_pages} page
                          {issue.affected_pages !== 1 ? 's' : ''} across the
                          website.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredIssues.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No issues found for this filter.
        </p>
      )}
    </div>
  );
}
