import { AX_WORDMARK } from './brandPaths';
import { GillsMark } from './GillsMark';

type Props = {
  /** Rendered height in px; width follows the aspect ratio. */
  height?: number;
  className?: string;
  label?: string | null;
};

// L3 logo: outlined "ax" (Literata SemiBold) + the gills mark as the "o".
// Letters and mark use `currentColor`; the spark uses the accent token.
export function AxoWordmark({ height = 28, className = 'text-primary', label = 'Axo' }: Props) {
  const [, , w, h] = AX_WORDMARK.viewBox.split(' ').map(Number);
  const { x, y, scale } = AX_WORDMARK.mark;
  return (
    <svg
      height={height}
      width={(height * w) / h}
      viewBox={AX_WORDMARK.viewBox}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path fill="currentColor" d={AX_WORDMARK.path} />
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <GillsMark ink="currentColor" spark="var(--color-accent, #B8451C)" />
      </g>
    </svg>
  );
}
