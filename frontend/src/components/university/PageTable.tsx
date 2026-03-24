import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpDown, ExternalLink } from 'lucide-react';
import { cn, truncate, getCategoryColor } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Page } from '@/lib/types';

interface PageTableProps {
  pages: Page[];
  universityId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

const columns = [
  { key: 'ai_title', label: 'Title', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'depth', label: 'Depth', sortable: true },
  { key: 'nav_difficulty', label: 'Nav Difficulty', sortable: true },
  { key: 'issues', label: 'Issues', sortable: false },
  { key: 'tags', label: 'Tags', sortable: false },
];

export default function PageTable({
  pages,
  universityId,
  sortBy,
  sortOrder,
  onSort,
  className,
}: PageTableProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-light-border dark:border-dark-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-light-border dark:border-dark-border bg-light-hover/50 dark:bg-dark-hover/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted',
                  col.sortable && 'cursor-pointer hover:text-light-text dark:hover:text-dark-text select-none'
                )}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <span className="flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && (
                    <ArrowUpDown
                      className={cn(
                        'w-3.5 h-3.5',
                        sortBy === col.key
                          ? 'text-brand-primary'
                          : 'opacity-30'
                      )}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-light-border dark:divide-dark-border">
          {pages.map((page, idx) => (
            <motion.tr
              key={page.id}
              className="hover:bg-light-hover dark:hover:bg-dark-hover cursor-pointer transition-colors"
              onClick={() =>
                navigate(`/university/${universityId}/page/${page.id}`)
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-light-text dark:text-dark-text">
                    {truncate(page.ai_title || page.original_title, 40)}
                  </span>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-light-muted dark:text-dark-muted hover:text-brand-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5 truncate max-w-xs">
                  {page.url}
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(page.category) }}
                  />
                  {page.category}
                </span>
              </td>
              <td className="px-4 py-3 text-light-muted dark:text-dark-muted">
                {page.depth}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'text-xs font-medium',
                    page.nav_difficulty <= 2
                      ? 'text-emerald-500'
                      : page.nav_difficulty <= 4
                      ? 'text-amber-500'
                      : 'text-red-500'
                  )}
                >
                  {page.nav_difficulty}/10
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {page.issue_tags.length > 0 && (
                    <Badge
                      variant={
                        page.issue_tags.some((t) => t.includes('critical'))
                          ? 'critical'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {page.issue_tags.length}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-light-muted dark:text-dark-muted">
                  {page.content_tags.length}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {pages.length === 0 && (
        <div className="py-12 text-center text-sm text-light-muted dark:text-dark-muted">
          No pages found matching your criteria.
        </div>
      )}
    </div>
  );
}
