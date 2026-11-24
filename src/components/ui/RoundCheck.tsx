// The brand's round check icon (MYSLENNYA family cue): an outlined circle with a check,
// filled when `done`. Decorative by default; give it a label when it carries meaning alone.
export function RoundCheck({ done = false, size = 18, className = '', label }: { done?: boolean; size?: number; className?: string; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="10" cy="10" r="8.5" fill={done ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6 10.4l2.8 2.8L14.2 7.4"
        fill="none"
        stroke={done ? 'var(--color-surface-raised)' : 'currentColor'}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
