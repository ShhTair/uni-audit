import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, File, Folder, AlertCircle, Filter } from 'lucide-react';
import { cn, getCategoryColor, truncate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import type { TreeNode } from '@/lib/types';

interface SiteTreeProps {
  tree: TreeNode;
  className?: string;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  filters: TreeFilters;
}

interface TreeFilters {
  hideFooter: boolean;
  hideHeaderBelowDepth1: boolean;
  category: string;
  tag: string;
}

function TreeNodeComponent({ node, depth, filters }: TreeNodeComponentProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  const filteredChildren = node.children.filter((child) => {
    if (filters.hideFooter && child.link_location === 'footer') return false;
    if (
      filters.hideHeaderBelowDepth1 &&
      child.link_location === 'header' &&
      child.depth > 1
    )
      return false;
    if (filters.category && child.category !== filters.category) return false;
    return true;
  });

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover transition-colors group',
          'border-l-2',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px`, borderLeftColor: getCategoryColor(node.category) }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-4 h-4 text-light-muted dark:text-dark-muted" />
          </motion.div>
        ) : (
          <span className="w-4" />
        )}

        {hasChildren ? (
          <Folder
            className="w-4 h-4 shrink-0"
            style={{ color: getCategoryColor(node.category) }}
          />
        ) : (
          <File
            className="w-4 h-4 shrink-0"
            style={{ color: getCategoryColor(node.category) }}
          />
        )}

        <span className="text-sm text-light-text dark:text-dark-text truncate flex-1">
          {truncate(node.ai_title || 'Untitled', 50)}
        </span>

        <span className="hidden group-hover:flex items-center gap-1.5 shrink-0">
          <Badge variant="default" size="sm">
            {node.category}
          </Badge>
          {node.issue_count > 0 && (
            <Badge
              variant="critical"
              size="sm"
              icon={<AlertCircle className="w-3 h-3" />}
            >
              {node.issue_count}
            </Badge>
          )}
        </span>

        {node.issue_count > 0 && (
          <span className="group-hover:hidden flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </span>
        )}

        {hasChildren && (
          <span className="text-[10px] text-light-muted dark:text-dark-muted shrink-0">
            {filteredChildren.length}
          </span>
        )}
      </div>

      <AnimatePresence>
        {expanded && filteredChildren.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filteredChildren.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                filters={filters}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SiteTree({ tree, className }: SiteTreeProps) {
  const [filters, setFilters] = useState<TreeFilters>({
    hideFooter: false,
    hideHeaderBelowDepth1: false,
    category: '',
    tag: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const categories = useCallback(() => {
    const cats = new Set<string>();
    const collect = (node: TreeNode) => {
      cats.add(node.category);
      node.children.forEach(collect);
    };
    collect(tree);
    return Array.from(cats).sort();
  }, [tree]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            showFilters
              ? 'bg-brand-primary/10 text-brand-primary'
              : 'text-light-muted dark:text-dark-muted hover:bg-light-hover dark:hover:bg-dark-hover'
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-4 p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <label className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
              <input
                type="checkbox"
                checked={filters.hideFooter}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, hideFooter: e.target.checked }))
                }
                className="rounded border-light-border dark:border-dark-border"
              />
              Hide footer links
            </label>
            <label className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
              <input
                type="checkbox"
                checked={filters.hideHeaderBelowDepth1}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    hideHeaderBelowDepth1: e.target.checked,
                  }))
                }
                className="rounded border-light-border dark:border-dark-border"
              />
              Hide header links below depth 1
            </label>
            <div>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
                }
                className="px-3 py-1.5 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
              >
                <option value="">All Categories</option>
                {categories().map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Filter by tag..."
              value={filters.tag}
              onChange={(e) =>
                setFilters((f) => ({ ...f, tag: e.target.value }))
              }
              className="w-48"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border border-light-border dark:border-dark-border rounded-xl p-2 overflow-auto max-h-[600px] scrollbar-hidden">
        <TreeNodeComponent node={tree} depth={0} filters={filters} />
      </div>
    </div>
  );
}
