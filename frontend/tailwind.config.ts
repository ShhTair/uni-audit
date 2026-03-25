import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--theme-surface-base)",
        foreground: "var(--theme-text-primary)",
        "surface-base": "var(--theme-surface-base)",
        "surface-raised": "var(--theme-surface-raised)",
        "surface-sunken": "var(--theme-surface-sunken)",
        "surface-overlay": "var(--theme-surface-overlay)",
        "surface-sidebar": "var(--theme-surface-sidebar)",
        "surface-card": "var(--theme-surface-card)",
        "surface-input": "var(--theme-surface-input)",
        "surface-hover": "var(--theme-surface-hover)",
        "surface-active": "var(--theme-surface-active)",
        "surface-selected": "var(--theme-surface-selected)",
        "brand-primary": "var(--theme-brand-primary)",
        "brand-primary-hover": "var(--theme-brand-primary-hover)",
        "brand-primary-active": "var(--theme-brand-primary-active)",
        "brand-primary-subtle": "var(--theme-brand-primary-subtle)",
        "brand-primary-muted": "var(--theme-brand-primary-muted)",
        "brand-secondary": "var(--theme-brand-secondary)",
        "brand-secondary-hover": "var(--theme-brand-secondary-hover)",
        "brand-secondary-subtle": "var(--theme-brand-secondary-subtle)",
        "foreground-secondary": "var(--theme-text-secondary)",
        "foreground-muted": "var(--theme-text-muted)",
        "foreground-subtle": "var(--theme-text-subtle)",
        "lavender": "var(--theme-lavender)",
        "lavender-hover": "var(--theme-lavender-hover)",
        "lavender-active": "var(--theme-lavender-active)",
        "lavender-subtle": "var(--theme-lavender-subtle)",
        "lavender-muted": "var(--theme-lavender-muted)",
        "cf-bg": "var(--theme-surface-base)",
        "cf-surface": "var(--theme-surface-raised)",
        "cf-accent": "var(--theme-brand-primary)",
        "cf-secondary": "var(--theme-text-secondary)",
        "cf-inverse": "var(--theme-text-inverse)",
        "success": "var(--theme-success)",
        "success-foreground": "var(--theme-success-foreground)",
        "success-light": "var(--theme-success-light)",
        "warning": "var(--theme-warning)",
        "warning-foreground": "var(--theme-warning-foreground)",
        "warning-light": "var(--theme-warning-light)",
        "error": "var(--theme-error)",
        "error-foreground": "var(--theme-error-foreground)",
        "error-light": "var(--theme-error-light)",
        "info": "var(--theme-info)",
        "info-foreground": "var(--theme-info-foreground)",
        "info-light": "var(--theme-info-light)",
        "border-default": "var(--theme-border-default)",
        "border-hover": "var(--theme-border-hover)",
        "border-focus": "var(--theme-border-focus)",
        "border-subtle": "var(--theme-border-subtle)"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      borderRadius: {
        "cf-sm": "var(--theme-radius-sm)",
        "cf-md": "var(--theme-radius-md)",
        "cf-lg": "var(--theme-radius-lg)",
        "cf-xl": "var(--theme-radius-xl)",
        "cf-2xl": "var(--theme-radius-2xl)",
        "cf-full": "var(--theme-radius-full)"
      }
    },
  },
  plugins: [],
};

export default config;
