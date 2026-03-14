// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'bear' | 'base' | 'bull' | 'neutral' | 'warn' | 'default';

interface BadgeProps {
  value: string;
  label?: string;
  variant?: BadgeVariant;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  bear:    { bg: 'rgba(248,81,73,0.12)',  text: 'var(--color-bear)',    dot: 'var(--color-bear)' },
  base:    { bg: 'rgba(88,166,255,0.12)', text: 'var(--color-neutral)', dot: 'var(--color-neutral)' },
  bull:    { bg: 'rgba(63,185,80,0.12)',  text: 'var(--color-bull)',    dot: 'var(--color-bull)' },
  neutral: { bg: 'rgba(88,166,255,0.12)', text: 'var(--color-neutral)', dot: 'var(--color-neutral)' },
  warn:    { bg: 'rgba(210,153,34,0.12)', text: 'var(--color-warn)',    dot: 'var(--color-warn)' },
  default: { bg: 'var(--color-surface-alt)', text: 'var(--color-text-muted)', dot: 'var(--color-text-muted)' },
};

export function Badge({ value, label, variant = 'default' }: BadgeProps) {
  const colors = VARIANT_COLORS[variant];

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.dot}33`,
        fontFamily: 'DM Mono',
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: colors.dot }}
      />
      {label && (
        <span className="text-11" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          {label}
        </span>
      )}
      <span className="text-12 font-medium" style={{ color: colors.text }}>
        {value}
      </span>
    </div>
  );
}
