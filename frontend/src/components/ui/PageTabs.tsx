import { NavLink } from 'react-router-dom';

interface Tab {
  to: string;
  label: string;
}

interface PageTabsProps {
  tabs: Tab[];
}

/**
 * PageTabs — Horizontal sub-navigation tabs.
 * Used on pages with child routes: /agents/:id, /vms/:id, /settings.
 */
export function PageTabs({ tabs }: PageTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border-subtle mb-6 -mx-6 px-6">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            `relative px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
