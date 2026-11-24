import { GillsMark } from './GillsMark';

type Props = {
  size?: number;
  className?: string;
  /** Accessible name; pass `null` when the icon sits next to visible "Axo" text. */
  label?: string | null;
};

// L1 app icon: the gills mark on a rounded tile. The tile takes `currentColor`
// (default: the primary token), the mark the on-primary token, so it follows the theme.
export function AxoIcon({ size = 32, className = 'text-primary', label = 'Axo' }: Props) {
  const simple = size <= 32;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <rect width="100" height="100" rx="24" fill="currentColor" />
      <g transform={simple ? 'translate(2 18)' : 'translate(6 20) scale(0.917)'}>
        <GillsMark ink="var(--color-on-primary, #FFFFFF)" spark="var(--color-icon-spark, #F0895C)" simple={simple} />
      </g>
    </svg>
  );
}
