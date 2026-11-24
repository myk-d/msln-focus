import { AXL, type AxlEmotion } from './brandPaths';

type Props = {
  emotion?: AxlEmotion;
  width?: number;
  className?: string;
  /** Accessible name; pass `null` for a purely decorative mascot next to explanatory text. */
  label?: string | null;
};

// The axl. mascot. Use only in empty states, "done" moments, errors and the landing page
// (docs/product/brand/foundations.html#mascot) — never in spinners, cards, notifications or PiP.
export function Axl({ emotion = 'neutral', width = 96, className = 'text-primary', label = null }: Props) {
  const { width: w, height: h, path } = AXL[emotion];
  return (
    <svg
      width={width}
      height={(width * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={path} />
    </svg>
  );
}
