import { TAG_COLOR_META } from '../../lib/utils';
import type { TagColor } from '../../types';

interface EventChipProps {
  label: string;
  time?: string;
  color?: TagColor;
  onClick: () => void;
}

// color=undefined renders a neutral chip — used for due-date tasks, which are
// secondary annotations on the calendar rather than scheduled event blocks.
export function EventChip({ label, time, color, onClick }: EventChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition ${
        color
          ? `${TAG_COLOR_META[color].bg} ${TAG_COLOR_META[color].text} hover:opacity-80`
          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
      }`}
    >
      {time && <span className="shrink-0 opacity-70">{time}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}
