// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'bear' | 'base' | 'bull' | 'neutral' | 'warn' | 'default';

interface BadgeProps {
  value: string;
  label?: string;
  variant?: BadgeVariant;
}

export function Badge({ value, label, variant = 'default' }: BadgeProps) {
  return (
    <div
      className={`badge-root badge-${variant} inline-flex items-center gap-1 px-2 py-1 rounded`}
    >
      <span className={`badge-dot badge-dot-${variant} inline-block w-1.5 h-1.5 rounded-full flex-shrink-0`} />
      {label && (
        <span className="badge-label text-11">
          {label}
        </span>
      )}
      <span className={`badge-value badge-value-${variant} text-12 font-medium`}>
        {value}
      </span>
    </div>
  );
}
