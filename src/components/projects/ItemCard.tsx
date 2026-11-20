import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { GitPullRequest, ListChecks } from 'lucide-react';
import { PRIORITY_META } from '../../lib/utils';
import { SEVERITY_META, TYPE_META, isOpen, itemRef } from '../../lib/projects';
import { useAuth } from '../../context/AuthContext';
import { AssigneeAvatar } from './fields';
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

const cardClass = 'flex w-full flex-col gap-1.5 rounded-lg border border-l-4 border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:shadow-md';

// Draggable card for the taskboard. The dragged copy is rendered by DragOverlay (ItemCardOverlay), so the
// original stays in its cell, dimmed, and is never transformed (the scroller would clip a transformed one).
export function ItemCard({ item, project, allItems, showParent = true, onSelect, rowKey }: ItemCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, data: { rowKey, status: item.status } });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(item.id)}
      style={{ borderLeftColor: TYPE_META[item.type].hex }}
      className={`${cardClass} ${isDragging ? 'opacity-40' : ''}`}
    >
      <ItemCardContent item={item} project={project} allItems={allItems} showParent={showParent} />
    </button>
  );
}

export function ItemCardOverlay({ item, project, allItems, showParent = true }: Omit<ItemCardProps, 'onSelect' | 'rowKey'>) {
  return (
    <div style={{ borderLeftColor: TYPE_META[item.type].hex }} className={`${cardClass} rotate-1 cursor-grabbing shadow-lg`}>
      <ItemCardContent item={item} project={project} allItems={allItems} showParent={showParent} />
    </div>
  );
}

function ItemCardContent({ item, project, allItems, showParent }: Omit<ItemCardProps, 'onSelect' | 'rowKey'>) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { icon: Icon, color } = TYPE_META[item.type];
  const parent = showParent && item.parentId ? allItems.find((i) => i.id === item.parentId) : undefined;
  const children = allItems.filter((i) => i.parentId === item.id);
  const doneChildren = children.filter((c) => c.status === 'done').length;
  const blocked = item.blockedBy.some((b) => {
    const blocker = allItems.find((i) => i.id === b);
    return blocker && isOpen(blocker);
  });

  return (
    <>
      <div className="flex items-start gap-1.5">
        <Icon size={14} className={`mt-0.5 shrink-0 ${color}`} />
        <p className="line-clamp-3 text-sm text-stone-800">
          <span className="mr-1.5 font-semibold text-stone-500">{item.number}</span>
          {item.title}
        </p>
      </div>
      {parent && (
        <span className="truncate text-[11px] text-stone-400">
          {itemRef(project, parent)} · {parent.title}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
        <AssigneeAvatar assignee={item.assignee} photoURL={user?.photoURL} size={18} />
        {item.priority !== 'none' && (
          <span className="flex items-center gap-1" title={t(PRIORITY_META[item.priority].labelKey)}>
            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_META[item.priority].dotClass}`} />
          </span>
        )}
        {item.severity && <span className={`rounded px-1.5 ${SEVERITY_META[item.severity].chip}`}>{t(SEVERITY_META[item.severity].labelKey)}</span>}
        {blocked && <span className="rounded bg-red-50 px-1.5 text-red-600">{t('projects.blocked')}</span>}
        {children.length > 0 && (
          <span className="flex items-center gap-1" title={t('projects.link.child')}>
            <ListChecks size={12} />
            {doneChildren}/{children.length}
          </span>
        )}
        {item.prUrl && <GitPullRequest size={12} className="text-violet-500" />}
      </div>
      {item.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.labels.map((l) => (
            <span key={l} className="rounded bg-sky-50 px-1.5 text-[10px] text-sky-800">
              {l}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
