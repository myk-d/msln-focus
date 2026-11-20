import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { GitPullRequest, ListChecks } from 'lucide-react';
import { PRIORITY_META } from '../../lib/utils';
import { SEVERITY_META, TYPE_META, isOpen, itemRef } from '../../lib/projects';
import { useAuth } from '../../context/AuthContext';
import { AssigneeAvatar } from './fields';
import type { Project, WorkItem } from '../../types';

export function ItemCard({ item, project, allItems, showParent = true, onSelect }: { item: WorkItem; project: Project; allItems: WorkItem[]; showParent?: boolean; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const { icon: Icon, color, hex } = TYPE_META[item.type];
  const parent = showParent && item.parentId ? allItems.find((i) => i.id === item.parentId) : undefined;
  const children = allItems.filter((i) => i.parentId === item.id);
  const doneChildren = children.filter((c) => c.status === 'done').length;
  const blocked = item.blockedBy.some((b) => {
    const blocker = allItems.find((i) => i.id === b);
    return blocker && isOpen(blocker);
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(item.id)}
      style={{ borderLeftColor: hex, ...(transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {}) }}
      className={`flex w-full flex-col gap-1.5 rounded-lg border border-l-4 border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:shadow-md ${
        isDragging ? 'z-10 rotate-1 shadow-lg' : ''
      }`}
    >
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
    </button>
  );
}
