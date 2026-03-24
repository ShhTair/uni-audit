import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Palette,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Settings,
  GraduationCap,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { useUniversities } from '@/lib/api';
import Tooltip from '@/components/ui/Tooltip';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [uniListOpen, setUniListOpen] = useState(true);
  const location = useLocation();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const { data: universities } = useUniversities();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/brandbook', label: 'Brandbook', icon: Palette },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface z-40',
        'transition-all duration-300'
      )}
      animate={{ width: collapsed ? 64 : 256 }}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-light-border dark:border-dark-border shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="text-lg font-semibold whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-light-text dark:text-dark-text">Uni</span>
              <span className="font-bold gradient-text">Audit</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hidden py-3 px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const linkContent = (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
                  active
                    ? 'text-brand-primary bg-brand-primary/10'
                    : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover'
                )}
              >
                {active && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 gradient-bg rounded-full"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.path} content={item.label} position="right">
                {linkContent}
              </Tooltip>
            ) : (
              linkContent
            );
          })}
        </div>

        {!collapsed && universities && universities.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setUniListOpen(!uniListOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              Universities
              <motion.div
                animate={{ rotate: uniListOpen ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
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
                  {universities.map((uni) => {
                    const active = params.id === uni.id;
                    return (
                      <Link
                        key={uni.id}
                        to={`/university/${uni.id}`}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                          active
                            ? 'text-brand-primary bg-brand-primary/10 font-medium'
                            : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover'
                        )}
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        <span className="truncate">{uni.name}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      <div className="border-t border-light-border dark:border-dark-border p-2 space-y-1 shrink-0">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover transition-all"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronLeft className="w-5 h-5 shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
