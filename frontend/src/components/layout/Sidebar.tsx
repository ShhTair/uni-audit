import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  GraduationCap,
  Globe,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { useUniversities } from '@/lib/api';
import Tooltip from '@/components/ui/Tooltip';
import type { University } from '@/lib/types';

function statusDot(status: string) {
  const cls: Record<string, string> = {
    completed:  'bg-emerald-400',
    analyzing:  'bg-sky-400 animate-pulse',
    crawling:   'bg-amber-400 animate-pulse',
    discovering:'bg-violet-400 animate-pulse',
    crawled:    'bg-teal-400',
    failed:     'bg-red-500',
    pending:    'bg-white/20',
  };
  return cls[status] ?? 'bg-white/20';
}

function UniListItem({ uni, collapsed }: { uni: University; collapsed: boolean }) {
  const params = useParams();
  const active = params.id === uni.id;
  const isLoading = ['crawling', 'analyzing', 'discovering'].includes(uni.status);

  const inner = (
    <Link
      to={`/university/${uni.id}`}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all relative',
        active
          ? 'text-white bg-white/[0.07] font-medium'
          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
      )}
    >
      <div className="relative shrink-0">
        <Globe className={cn('w-4 h-4', active ? 'text-[#06D6A0]' : 'text-white/30')} />
        {isLoading && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        )}
      </div>

      {!collapsed && (
        <>
          <span className="truncate flex-1 text-[13px]">{uni.name}</span>
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot(uni.status))} />
        </>
      )}
    </Link>
  );

  return collapsed ? (
    <Tooltip content={uni.name} position="right">
      {inner}
    </Tooltip>
  ) : inner;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [uniListOpen, setUniListOpen] = useState(true);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { data: universities } = useUniversities();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      className={cn(
        'h-screen sticky top-0 flex flex-col z-40',
        'border-r border-white/[0.07] bg-[#0d0d0d]',
        'transition-all duration-300'
      )}
      animate={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.07] shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #06D6A0 0%, #7877FF 100%)' }}
        >
          <GraduationCap className="w-4 h-4 text-black" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-baseline gap-0.5 whitespace-nowrap"
            >
              <span className="text-[15px] font-semibold text-white tracking-tight">Uni</span>
              <span
                className="text-[15px] font-bold tracking-tight"
                style={{ background: 'linear-gradient(90deg, #06D6A0, #7877FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Audit
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden py-3 px-2 space-y-0.5">
        {/* Main nav */}
        {[
          { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        ].map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          const item = (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all relative group',
                active
                  ? 'text-white bg-white/[0.07]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              )}
            >
              {active && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ background: 'linear-gradient(180deg, #06D6A0, #7877FF)' }}
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#06D6A0]' : 'text-white/35 group-hover:text-white/60')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={path} content={label} position="right">{item}</Tooltip>
          ) : item;
        })}

        {/* University list */}
        {!collapsed && universities && universities.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setUniListOpen(!uniListOpen)}
              className="flex items-center justify-between w-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors"
            >
              <span>Universities</span>
              <motion.div animate={{ rotate: uniListOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </button>
            <AnimatePresence>
              {uniListOpen && (
                <motion.div
                  className="mt-1 space-y-0.5"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {universities.map((uni) => (
                    <UniListItem key={uni.id} uni={uni} collapsed={collapsed} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Collapsed university icons */}
        {collapsed && universities && universities.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {universities.map((uni) => (
              <UniListItem key={uni.id} uni={uni} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.07] p-2 space-y-0.5 shrink-0">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && (
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronLeft className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
