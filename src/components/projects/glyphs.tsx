import { useTranslation } from 'react-i18next';
import { STATUS_META, TYPE_META } from '../../lib/projects';
import type { WorkItemStatus, WorkItemType } from '../../types';

// Work item type as shape + colour (never colour alone): epic = star, story = square,
// task = ring, bug = dot. Colours come from the --color-type-* tokens via TYPE_META.stripe.
export function TypeGlyph({ type, size = 12, className = '' }: { type: WorkItemType; size?: number; className?: string }) {
  const { t } = useTranslation();
  const color = TYPE_META[type].stripe;
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className={`shrink-0 ${className}`} role="img" aria-label={t(TYPE_META[type].labelKey)}>
      {type === 'epic' && <path d="M6 .8l1.6 3.4 3.6.4-2.7 2.5.8 3.6L6 8.9l-3.3 1.8.8-3.6L.8 4.6l3.6-.4z" fill={color} />}
      {type === 'story' && <rect x="1" y="1" width="10" height="10" rx="2" fill={color} />}
      {type === 'task' && <circle cx="6" cy="6" r="4.6" fill="none" stroke={color} strokeWidth="2" />}
      {type === 'bug' && <circle cx="6" cy="6" r="5.2" fill={color} />}
    </svg>
  );
}

// Status as colour + shape: backlog and cancelled are hollow rings (not two near-identical greys).
export function StatusDot({ status, size = 8 }: { status: WorkItemStatus; size?: number }) {
  const hollow = status === 'backlog' || status === 'cancelled';
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 rounded-full ${hollow ? 'shadow-[inset_0_0_0_1.5px_var(--color-muted)]' : STATUS_META[status].dot}`}
    />
  );
}

// Status label text; cancelled is struck through so it reads as "not happening" without colour.
export function StatusLabel({ status, className = '' }: { status: WorkItemStatus; className?: string }) {
  const { t } = useTranslation();
  return <span className={`${status === 'cancelled' ? 'line-through' : ''} ${className}`}>{t(STATUS_META[status].labelKey)}</span>;
}
