import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Route label map — translates URL segments to human-readable breadcrumbs.
 * Dynamic segments (like :id) are handled separately.
 */
const labels: Record<string, string> = {
  dashboard: 'General',
  agents: 'Agents',
  config: 'Config',
  logs: 'Logs',
  chat: 'Chat',
  skills: 'Skills',
  files: 'Files',
  cron: 'Cron',
  vms: 'Servers',
  access: 'Direct Access',
  terminal: 'Terminal',
  screen: 'Screen',
  ports: 'Ports',
  settings: 'Settings',
  profile: 'Profile',
  security: 'Security',
  billing: 'Billing',
  'api-keys': 'API Keys',
  notifications: 'Notifications',
  team: 'Team',
  integrations: 'Knowledge Hub',
  knowledge: 'Knowledge Hub',
  insights: 'Insights',
  activity: 'Activity Log',
  analytics: 'Analytics',
  templates: 'Templates',
  docs: 'Docs',
  brandbook: 'Brandbook',
  workflows: 'Workflows & Crons',
  commands: 'Agent Commands',
  configs: 'OpenClaw Configs',
  mission: 'Mission Control',
  tasks: 'Tasks',
  content: 'Content',
  memories: 'Memory',
  calendar: 'Calendar',
  office: 'Office',
};

function segmentLabel(segment: string): string {
  if (labels[segment]) return labels[segment];
  // If it looks like an ID (number or UUID), show "#segment"
  if (/^\d+$/.test(segment)) return `#${segment}`;
  // Capitalize fallback
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/**
 * Breadcrumbs — auto-generates breadcrumb trail from the current route.
 */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1.5 text-[13px] text-foreground-muted mb-4 animate-fade-in flex-wrap"
      aria-label="Breadcrumb"
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-0.5 py-0.5 -ml-0.5 transition-colors"
      >
        <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Home</span>
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-foreground-subtle shrink-0" aria-hidden />
            {isLast ? (
              <span className="text-foreground font-medium">{segmentLabel(seg)}</span>
            ) : (
              <Link
                to={path}
                className="hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-0.5 transition-colors"
              >
                {segmentLabel(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
