import { useTranslation } from 'react-i18next';
import { STATUS_META, TYPE_META } from '../../lib/projects';
import type { WorkItemStatus, WorkItemType } from '../../types';

// Work item type: the type's own icon (crown / book / square-check / bug) in its --color-type-* token,
// so the type reads by shape as well as colour.
export function TypeGlyph({ type, size = 14, className = '' }: { type: WorkItemType; size?: number; className?: string }) {
  const { t } = useTranslation();
  const { icon: Icon, color, labelKey } = TYPE_META[type];
  return <Icon size={size} className={`shrink-0 ${color} ${className}`} role="img" aria-label={t(labelKey)} />;
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
