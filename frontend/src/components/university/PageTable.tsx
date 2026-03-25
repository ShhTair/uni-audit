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
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-zinc-900/50/50 bg-zinc-900/50/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  col.sortable && 'cursor-pointer hover:text-foreground select-none'
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
                          ? 'text-primary'
                          : 'opacity-30'
                      )}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {pages.map((page, idx) => (
            <motion.tr
              key={page.id}
              className="hover:bg-zinc-900/50 cursor-pointer transition-colors"
              onClick={() =>
                navigate(`/university/${universityId}/page/${page.id}`)
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {truncate(page.ai_title || page.original_title, 40)}
                  </span>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
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
              <td className="px-4 py-3 text-muted-foreground">
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
                <span className="text-xs text-muted-foreground">
                  {page.content_tags.length}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {pages.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No pages found matching your criteria.
        </div>
      )}
    </div>
  );
}
