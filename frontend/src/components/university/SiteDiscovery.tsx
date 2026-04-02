import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Globe,
  FileText,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Plus,
  Loader2,
  Zap,
  MousePointer2,
  Cloud,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscoveredUrl, CrawlMode } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface SiteDiscoveryProps {
  universityId: string;
  discoveredUrls: DiscoveredUrl[];
  crawlConfig: {
    crawl_mode: CrawlMode;
    manual_urls: string[];
    user_excluded_urls: string[];
    cf_available?: boolean;
  };
  isDiscovering: boolean;
  onDiscover: () => void;
  onSaveConfig: (config: {
    crawl_mode: CrawlMode;
    manual_urls: string[];
    user_excluded_urls: string[];
  }) => void;
  onStartCrawl: () => void;
  isSaving?: boolean;
  isCrawling?: boolean;
}

// Group discovered URLs by domain + top-level path segment
function groupUrls(urls: DiscoveredUrl[]): Map<string, DiscoveredUrl[]> {
  const groups = new Map<string, DiscoveredUrl[]>();
  for (const u of urls) {
    const parts = u.path.split('/').filter(Boolean);
    const group = parts.length > 0 ? `/${parts[0]}` : '/';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(u);
  }
  return groups;
}

const MODE_OPTIONS: { value: CrawlMode; label: string; desc: string; icon: React.ReactNode; available?: boolean }[] = [
  {
    value: 'auto',
    label: 'Auto (Playwright)',
    desc: 'Full BFS crawl with JS rendering. Best for SPAs and dynamic content.',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    value: 'cloudflare',
    label: 'Cloudflare API',
    desc: 'Uses Cloudflare Browser Rendering. Returns clean Markdown. Needs CF credentials.',
    icon: <Cloud className="w-4 h-4" />,
  },
  {
    value: 'manual',
    label: 'Manual Selection',
    desc: 'Only crawl URLs you select below. Fastest, most precise.',
    icon: <MousePointer2 className="w-4 h-4" />,
  },
];

function UrlRow({
  url,
  selected,
  onToggle,
}: {
  url: DiscoveredUrl;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all select-none group',
        selected
          ? 'bg-[rgba(6,214,160,0.08)] border border-[rgba(6,214,160,0.2)]'
          : 'hover:bg-white/[0.03] border border-transparent'
      )}
    >
      <div className="shrink-0 mt-0.5">
        {selected ? (
          <div className="w-4 h-4 rounded bg-[#06D6A0] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
          </div>
        ) : (
          <div className="w-4 h-4 rounded border border-white/20 group-hover:border-white/40 transition-colors" />
        )}
      </div>

      <FileText
        className={cn('w-3.5 h-3.5 shrink-0', selected ? 'text-[#06D6A0]' : 'text-white/30')}
      />

      <div className="flex-1 min-w-0">
        <p className={cn('text-xs truncate', selected ? 'text-white/90' : 'text-white/50')}>
          {url.title || url.path}
        </p>
        <p className="text-[10px] text-white/30 truncate font-mono">{url.path}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {url.source === 'sitemap' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">sitemap</span>
        )}
        <span className="text-[9px] text-white/20">d{url.depth_estimate}</span>
      </div>
    </div>
  );
}

function UrlGroup({
  groupKey,
  urls,
  selected,
  onToggleAll,
  onToggle,
}: {
  groupKey: string;
  urls: DiscoveredUrl[];
  selected: Set<string>;
  onToggleAll: (urls: DiscoveredUrl[], val: boolean) => void;
  onToggle: (url: DiscoveredUrl) => void;
}) {
  const [open, setOpen] = useState(groupKey === '/');
  const allSelected = urls.every((u) => selected.has(u.url));
  const someSelected = urls.some((u) => selected.has(u.url));

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleAll(urls, !allSelected);
          }}
          className="shrink-0"
        >
          {allSelected ? (
            <CheckSquare className="w-4 h-4 text-[#06D6A0]" />
          ) : someSelected ? (
            <MinusSquare className="w-4 h-4 text-[#06D6A0]/60" />
          ) : (
            <Square className="w-4 h-4 text-white/30 hover:text-white/60 transition-colors" />
          )}
        </div>

        <Globe className="w-3.5 h-3.5 text-white/40 shrink-0" />

        <span className="text-sm font-medium text-white/80 flex-1 text-left font-mono">
          {groupKey}
        </span>

        <span className="text-xs text-white/30 mr-1">
          {urls.filter((u) => selected.has(u.url)).length}/{urls.length}
        </span>

        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-white/30" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-1.5 space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {urls.map((u) => (
                <UrlRow
                  key={u.url}
                  url={u}
                  selected={selected.has(u.url)}
                  onToggle={() => onToggle(u)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SiteDiscovery({
  universityId: _universityId,
  discoveredUrls,
  crawlConfig,
  isDiscovering,
  onDiscover,
  onSaveConfig,
  onStartCrawl,
  isSaving,
  isCrawling,
}: SiteDiscoveryProps) {
  const [mode, setMode] = useState<CrawlMode>(crawlConfig.crawl_mode);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(
      discoveredUrls
        .filter((u) => !crawlConfig.user_excluded_urls.includes(u.url))
        .map((u) => u.url)
    )
  );
  const [search, setSearch] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [manualUrls, setManualUrls] = useState<string[]>(crawlConfig.manual_urls);
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return discoveredUrls;
    const q = search.toLowerCase();
    return discoveredUrls.filter(
      (u) => u.url.toLowerCase().includes(q) || u.title.toLowerCase().includes(q)
    );
  }, [discoveredUrls, search]);

  const groups = useMemo(() => groupUrls(filtered), [filtered]);

  const toggleUrl = useCallback((url: DiscoveredUrl) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url.url)) next.delete(url.url);
      else next.add(url.url);
      return next;
    });
    setDirty(true);
  }, []);

  const toggleGroup = useCallback((urls: DiscoveredUrl[], val: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      urls.forEach((u) => (val ? next.add(u.url) : next.delete(u.url)));
      return next;
    });
    setDirty(true);
  }, []);

  const selectAll = () => {
    setSelected(new Set(discoveredUrls.map((u) => u.url)));
    setDirty(true);
  };

  const deselectAll = () => {
    setSelected(new Set());
    setDirty(true);
  };

  const addManualUrl = () => {
    const url = manualInput.trim();
    if (!url || manualUrls.includes(url)) return;
    setManualUrls((prev) => [...prev, url]);
    setManualInput('');
    setDirty(true);
  };

  const removeManualUrl = (url: string) => {
    setManualUrls((prev) => prev.filter((u) => u !== url));
    setDirty(true);
  };

  const handleSave = () => {
    const excluded = discoveredUrls
      .filter((u) => !selected.has(u.url))
      .map((u) => u.url);
    onSaveConfig({
      crawl_mode: mode,
      manual_urls: mode === 'manual' ? [...manualUrls, ...Array.from(selected)] : manualUrls,
      user_excluded_urls: excluded,
    });
    setDirty(false);
  };

  const selectedCount = mode === 'manual' ? manualUrls.length : selected.size;

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div>
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Crawl Mode
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map((opt) => {
            const isCF = opt.value === 'cloudflare';
            const cfUnavailable = isCF && !crawlConfig.cf_available;
            return (
              <button
                key={opt.value}
                onClick={() => { if (!cfUnavailable) { setMode(opt.value); setDirty(true); } }}
                disabled={cfUnavailable}
                className={cn(
                  'flex flex-col gap-2 p-3 rounded-xl border text-left transition-all',
                  mode === opt.value
                    ? 'border-[#06D6A0]/40 bg-[rgba(6,214,160,0.08)]'
                    : cfUnavailable
                    ? 'border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed'
                    : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    mode === opt.value ? 'bg-[#06D6A0]/15 text-[#06D6A0]' : 'bg-white/5 text-white/40'
                  )}>
                    {opt.icon}
                  </span>
                  {mode === opt.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]" />
                  )}
                </div>
                <div>
                  <p className={cn(
                    'text-xs font-semibold',
                    mode === opt.value ? 'text-white' : 'text-white/60'
                  )}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">
                    {opt.desc}
                    {cfUnavailable && ' (No CF credentials)'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discovery panel — shown for auto + cloudflare modes */}
      {mode !== 'manual' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Discovered URLs</p>
              <p className="text-xs text-white/40 mt-0.5">
                {discoveredUrls.length > 0
                  ? `${discoveredUrls.length} URLs found via sitemap & homepage scan`
                  : 'Run discovery to see all pages before crawling'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscover}
              loading={isDiscovering}
              icon={isDiscovering ? undefined : <RefreshCw className="w-3.5 h-3.5" />}
            >
              {isDiscovering ? 'Scanning…' : discoveredUrls.length > 0 ? 'Rescan' : 'Discover URLs'}
            </Button>
          </div>

          {discoveredUrls.length > 0 && (
            <>
              {/* Search + stats bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search URLs…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white/[0.04] border border-white/8 rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#06D6A0]/40 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <button onClick={selectAll} className="hover:text-[#06D6A0] transition-colors">
                    All
                  </button>
                  <span>/</span>
                  <button onClick={deselectAll} className="hover:text-red-400 transition-colors">
                    None
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]" />
                  <span className="text-xs text-white/60">
                    <span className="text-white font-medium">{selected.size}</span> selected
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-xs text-white/60">
                    <span className="text-white/50 font-medium">{discoveredUrls.length - selected.size}</span> excluded
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
                  <AlertCircle className="w-3 h-3" />
                  Only selected URLs will be crawled in manual mode
                </div>
              </div>

              {/* URL tree */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {Array.from(groups.entries()).map(([key, urls]) => (
                  <UrlGroup
                    key={key}
                    groupKey={key}
                    urls={urls}
                    selected={selected}
                    onToggleAll={toggleGroup}
                    onToggle={toggleUrl}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Manual URL input — shown for manual mode */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">Specific Pages to Crawl</p>
            <p className="text-xs text-white/40">
              Add exact URLs you want to audit. Only these pages will be fetched.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="https://university.edu/admissions/apply"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManualUrl()}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={addManualUrl}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add
            </Button>
          </div>

          {manualUrls.length > 0 ? (
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {manualUrls.map((url) => (
                <div
                  key={url}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(6,214,160,0.06)] border border-[rgba(6,214,160,0.15)] group"
                >
                  <FileText className="w-3.5 h-3.5 text-[#06D6A0]/60 shrink-0" />
                  <span className="text-xs text-white/70 flex-1 truncate font-mono">{url}</span>
                  <button
                    onClick={() => removeManualUrl(url)}
                    className="shrink-0 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-xl">
              <MousePointer2 className="w-8 h-8 text-white/15 mb-2" />
              <p className="text-sm text-white/40">No URLs added yet</p>
              <p className="text-xs text-white/25 mt-1">Add specific pages you want to audit above</p>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div className="text-xs text-white/40">
          {selectedCount > 0 && (
            <span>
              <span className="text-white/70 font-medium">{selectedCount}</span> pages will be crawled
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              loading={isSaving}
            >
              Save Settings
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onStartCrawl}
            loading={isCrawling}
            disabled={selectedCount === 0 && mode === 'manual'}
            icon={isCrawling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          >
            Start Crawl
          </Button>
        </div>
      </div>
    </div>
  );
}
