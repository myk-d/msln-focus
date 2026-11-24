import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { GitPullRequest, ListChecks, Lock } from 'lucide-react';
import { PRIORITY_META } from '../../lib/utils';
import { SEVERITY_META, TYPE_META, isOpen, itemRef } from '../../lib/projects';
import { useAuth } from '../../context/AuthContext';
import { AssigneeAvatar } from './fields';
import { TypeGlyph } from './glyphs';
import type { Project, WorkItem } from '../../types';

interface ItemCardProps {
  item: WorkItem;
  project: Project;
  allItems: WorkItem[];
  showParent?: boolean;
  onSelect: (id: string) => void;
  // Row the card lives in (story id or 'none'); set only where the card can be dragged.
  rowKey?: string;
}

// Axo card: 4px type stripe (left border), 16px radius, border-first; the float shadow only on hover/drag.
const cardClass =
  'flex w-full flex-col gap-2 rounded-2xl border border-l-4 border-border bg-surface py-3 pl-3.5 pr-3 text-left transition hover:border-border-strong hover:shadow-[0_8px_24px_rgb(0_0_0/0.08)]';
const chipClass = 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold';

// Draggable card for the taskboard. The dragged copy is rendered by DragOverlay (ItemCardOverlay), so the
// original stays in its cell, dimmed, and is never transformed (the scroller would clip a transformed one).
export function ItemCard({ item, project, allItems, showParent = true, onSelect, rowKey }: ItemCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, disabled: rowKey === undefined, data: { rowKey, status: item.status } });
  return (
    <button
      ref={setNodeRef}
      {...(rowKey === undefined ? {} : { ...attributes, ...listeners })}
      onClick={() => onSelect(item.id)}
      style={{ borderLeftColor: TYPE_META[item.type].stripe }}
      className={`${cardClass} ${isDragging ? 'opacity-40' : ''}`}
    >
      <ItemCardContent item={item} project={project} allItems={allItems} showParent={showParent} />
    </button>
  );
}

export function ItemCardOverlay({ item, project, allItems, showParent = true }: Omit<ItemCardProps, 'onSelect' | 'rowKey'>) {
  return (
    <div style={{ borderLeftColor: TYPE_META[item.type].stripe }} className={`${cardClass} -rotate-1 cursor-grabbing shadow-[0_12px_32px_rgb(0_0_0/0.12)]`}>
      <ItemCardContent item={item} project={project} allItems={allItems} showParent={showParent} />
    </div>
  );
}

function ItemCardContent({ item, project, allItems, showParent }: Omit<ItemCardProps, 'onSelect' | 'rowKey'>) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const parent = showParent && item.parentId ? allItems.find((i) => i.id === item.parentId) : undefined;
  const children = allItems.filter((i) => i.parentId === item.id);
  const doneChildren = children.filter((c) => c.status === 'done').length;
  const blocker = item.blockedBy
    .map((b) => allItems.find((i) => i.id === b))
    .find((b): b is WorkItem => !!b && isOpen(b));
  const hasChips = !!item.severity || !!blocker || item.labels.length > 0 || children.length > 0 || !!item.prUrl;

  return (
    <>
      <div className="flex items-center gap-2">
        <TypeGlyph type={item.type} />
        <span className="font-mono text-xs font-medium text-muted">{itemRef(project, item)}</span>
        <span className="flex-1" />
        {item.priority !== 'none' && (
          <span className={`h-2 w-2 rounded-full ${PRIORITY_META[item.priority].dotClass}`} title={t(PRIORITY_META[item.priority].labelKey)} />
        )}
        <AssigneeAvatar assignee={item.assignee} photoURL={user?.photoURL} size={24} />
      </div>
      <p className={`line-clamp-3 text-sm font-bold text-text ${item.status === 'cancelled' ? 'text-muted line-through' : ''}`}>{item.title}</p>
      {parent && (
        <span className="truncate text-xs text-muted">
          <span className="font-mono">{itemRef(project, parent)}</span> · {parent.title}
        </span>
      )}
      {hasChips && (
        <div className="flex flex-wrap items-center gap-1.5">
          {item.severity && <span className={`${chipClass} ${SEVERITY_META[item.severity].chip}`}>{t(SEVERITY_META[item.severity].labelKey)}</span>}
          {blocker && (
            <span className={`${chipClass} bg-warning-soft text-warning`} title={t('projects.blocked')}>
              <Lock size={12} />
              <span className="font-mono">{itemRef(project, blocker)}</span>
            </span>
          )}
          {item.labels.map((l) => (
            <span key={l} className={`${chipClass} bg-surface-sunken text-muted`}>
              #{l}
            </span>
          ))}
          {children.length > 0 && (
            <span className={`${chipClass} bg-surface-sunken text-muted`} title={t('projects.link.child')}>
              <ListChecks size={12} />
              {doneChildren}/{children.length}
            </span>
          )}
          {item.prUrl && (
            <span className={`${chipClass} bg-primary-soft text-primary`}>
              <GitPullRequest size={12} /> PR
            </span>
          )}
        </div>
      )}
    </>
  );
}
