import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-dim': 'var(--color-primary-dim)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-faint': 'var(--color-text-faint)',
        bull: 'var(--color-bull)',
        bear: 'var(--color-bear)',
        neutral: 'var(--color-neutral)',
        warn: 'var(--color-warn)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
      },
      borderRadius: {
        card: '4px',
        input: '2px',
      },
      height: {
        btn: '44px',
      },
    },
  },
  plugins: [],
};

export default config;
