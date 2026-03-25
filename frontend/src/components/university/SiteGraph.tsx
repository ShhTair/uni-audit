import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Eye, EyeOff } from 'lucide-react';
import { cn, getCategoryColor, truncate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { GraphData } from '@/lib/types';

interface SiteGraphProps {
  data: GraphData;
  className?: string;
}

interface GraphFilters {
  showHeader: boolean;
  showFooter: boolean;
  showMain: boolean;
  showSidebar: boolean;
  showBreadcrumb: boolean;
  category: string;
  maxDepth: number;
}

function CustomNode({ data }: NodeProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-brand-primary !w-2 !h-2 !border-0" />
      <div
        className={cn(
          'px-3 py-2 rounded-lg border-2 bg-surface-card shadow-lg transition-all',
          hovered && 'ring-2 ring-brand-primary/50'
        )}
        style={{ borderColor: data.color as string, minWidth: data.size as number }}
      >
        <p className="text-xs font-medium text-foreground truncate max-w-[150px]">
          {data.label as string}
        </p>
        <p className="text-[10px] text-foreground-muted">
          {data.category as string}
        </p>
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 p-3 rounded-lg bg-gray-900 text-white text-xs shadow-xl min-w-[200px]"
          >
            <p className="font-medium mb-1">{data.fullTitle as string}</p>
            <p className="text-gray-400 text-[10px] mb-2 break-all">{data.url as string}</p>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">{data.category as string}</Badge>
              <span className="text-gray-400">Depth: {data.depth as number}</span>
              <span className="text-gray-400">Links: {data.incomingLinks as number}</span>
            </div>
            {(data.issueCount as number) > 0 && (
              <p className="text-red-400 mt-1">{data.issueCount as number} issues</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <Handle type="source" position={Position.Bottom} className="!bg-brand-secondary !w-2 !h-2 !border-0" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function SiteGraph({ data, className }: SiteGraphProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GraphFilters>({
    showHeader: true,
    showFooter: true,
    showMain: true,
    showSidebar: true,
    showBreadcrumb: true,
    category: '',
    maxDepth: 10,
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    data.nodes.forEach((n) => cats.add(n.category));
    return Array.from(cats).sort();
  }, [data]);

  const { filteredNodes, filteredEdges } = useMemo(() => {
    let nodeSet = new Set(data.nodes.map((n) => n.id));

    if (filters.category) {
      const catNodes = data.nodes
        .filter((n) => n.category === filters.category)
        .map((n) => n.id);
      nodeSet = new Set(catNodes);
    }

    const depthFiltered = data.nodes
      .filter((n) => n.depth <= filters.maxDepth)
      .map((n) => n.id);
    nodeSet = new Set([...nodeSet].filter((id) => depthFiltered.includes(id)));

    const edges = data.edges.filter((e) => {
      if (!nodeSet.has(e.source) || !nodeSet.has(e.target)) return false;
      if (!filters.showHeader && e.link_location === 'header') return false;
      if (!filters.showFooter && e.link_location === 'footer') return false;
      if (!filters.showMain && e.link_location === 'main') return false;
      if (!filters.showSidebar && e.link_location === 'sidebar') return false;
      if (!filters.showBreadcrumb && e.link_location === 'breadcrumb') return false;
      return true;
    });

    const nodesInEdges = new Set<string>();
    edges.forEach((e) => {
      nodesInEdges.add(e.source);
      nodesInEdges.add(e.target);
    });

    const nodes = data.nodes.filter((n) => nodeSet.has(n.id));

    return { filteredNodes: nodes, filteredEdges: edges };
  }, [data, filters]);

  const initialNodes: Node[] = useMemo(
    () =>
      filteredNodes.map((node, i) => {
        const cols = Math.ceil(Math.sqrt(filteredNodes.length));
        const row = Math.floor(i / cols);
        const col = i % cols;
        const baseSize = 40 + Math.min(node.incoming_links_count * 5, 60);
        return {
          id: node.id,
          type: 'custom',
          position: { x: col * 250 + Math.random() * 50, y: row * 150 + Math.random() * 30 },
          data: {
            label: truncate(node.ai_title || 'Untitled', 25),
            fullTitle: node.ai_title,
            url: node.url,
            category: node.category,
            color: getCategoryColor(node.category),
            depth: node.depth,
            incomingLinks: node.incoming_links_count,
            issueCount: node.issue_count,
            size: baseSize,
          },
        };
      }),
    [filteredNodes]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      filteredEdges.map((edge, i) => {
        const opacity =
          edge.link_location === 'header'
            ? 0.8
            : edge.link_location === 'main'
            ? 0.6
            : edge.link_location === 'footer'
            ? 0.2
            : 0.4;
        return {
          id: `e-${i}`,
          source: edge.source,
          target: edge.target,
          animated: edge.link_location === 'header',
          style: { stroke: '#6366F1', strokeWidth: 1.5, opacity },
          label: truncate(edge.link_text || '', 15),
          labelStyle: { fontSize: 9, fill: '#71717A' },
        };
      }),
    [filteredEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const linkTypeToggle = (label: string, key: keyof GraphFilters) => (
    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
      <input
        type="checkbox"
        checked={filters[key] as boolean}
        onChange={(e) =>
          setFilters((f) => ({ ...f, [key]: e.target.checked }))
        }
        className="rounded"
      />
      {label}
    </label>
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            showFilters
              ? 'bg-brand-primary/10 text-brand-primary'
              : 'text-foreground-muted hover:bg-surface-hover'
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <span className="text-xs text-foreground-muted">
          {filteredNodes.length} nodes, {filteredEdges.length} edges
        </span>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-4 p-4 rounded-xl border border-border-default bg-surface-card"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Link Types
              </p>
              {linkTypeToggle('Header', 'showHeader')}
              {linkTypeToggle('Footer', 'showFooter')}
              {linkTypeToggle('Main', 'showMain')}
              {linkTypeToggle('Sidebar', 'showSidebar')}
              {linkTypeToggle('Breadcrumb', 'showBreadcrumb')}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Category
              </p>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
                }
                className="px-3 py-1.5 text-sm rounded-lg border border-border-default bg-surface-card text-foreground"
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Max Depth: {filters.maxDepth}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={filters.maxDepth}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxDepth: parseInt(e.target.value),
                  }))
                }
                className="w-32"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-[600px] rounded-xl border border-border-default overflow-hidden bg-surface-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Controls className="!bg-surface-card !border-border-default !shadow-lg [&_button]:!bg-surface-card [&_button]:!border-border-default [&_button]:!text-foreground" />
          <MiniMap
            className="!bg-surface-card  !border-border-default "
            nodeColor={(node) => (node.data.color as string) || '#6366F1'}
            maskColor="rgba(0,0,0,0.1)"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#1E1E2E"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
