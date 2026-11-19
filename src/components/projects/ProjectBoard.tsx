import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { GitPullRequest, ListChecks, Plus } from 'lucide-react';
import { PRIORITY_META } from '../../lib/utils';
import { BOARD_STATUSES, SEVERITY_META, STATUS_META, TYPE_META, TYPE_ORDER, isOpen, itemRef, sortItems } from '../../lib/projects';
import { useAuth } from '../../context/AuthContext';
import { AssigneeAvatar } from './fields';
import type { Project, WorkItem, WorkItemStatus, WorkItemType } from '../../types';
import type { NewItemInput } from '../../hooks/useProjectsStore';

interface ProjectBoardProps {
  project: Project;
  items: WorkItem[];
  allItems: WorkItem[];
  showCancelled: boolean;
  defaultType: WorkItemType;
  onSelect: (id: string) => void;
  onCreate: (input: NewItemInput) => Promise<unknown>;
  onMove: (id: string, status: WorkItemStatus) => void;
}

export function ProjectBoard({ project, items, allItems, showCancelled, defaultType, onSelect, onCreate, onMove }: ProjectBoardProps) {
  // A small distance threshold keeps a plain click (open the card) distinct from a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const statuses: WorkItemStatus[] = showCancelled ? [...BOARD_STATUSES, 'cancelled'] : BOARD_STATUSES;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const status = over?.id as WorkItemStatus | undefined;
    const item = items.find((i) => i.id === active.id);
    if (item && status && item.status !== status) onMove(item.id, status);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 gap-3 overflow-x-auto p-4 md:p-6">
        {statuses.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            project={project}
            items={sortItems(items.filter((i) => i.status === status))}
            allItems={allItems}
            defaultType={defaultType}
            onSelect={onSelect}
            onCreate={onCreate}
          />
        ))}
      </div>
    </DndContext>
  );
}

interface BoardColumnProps {
  status: WorkItemStatus;
  project: Project;
  items: WorkItem[];
  allItems: WorkItem[];
  defaultType: WorkItemType;
  onSelect: (id: string) => void;
  onCreate: (input: NewItemInput) => Promise<unknown>;
}

function BoardColumn({ status, project, items, allItems, defaultType, onSelect, onCreate }: BoardColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkItemType>(defaultType);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return setAdding(false);
    setTitle('');
    await onCreate({ type, title: trimmed, status });
  };

  return (
    <section
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl p-2 transition ${isOver ? 'bg-brand-50 ring-2 ring-brand-200' : 'bg-stone-100/70'}`}
    >
      <h3 className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-stone-600">
        <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
        {t(STATUS_META[status].labelKey)}
        <span className="ml-auto text-xs text-stone-400">{items.length}</span>
      </h3>
      <div className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto pb-1">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} project={project} allItems={allItems} onSelect={onSelect} />
        ))}
      </div>
      {adding ? (
        <form onSubmit={(e) => void submit(e)} className="mt-1 flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
          <textarea
            autoFocus
            rows={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit(e);
              }
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder={t('projects.itemTitlePlaceholder')}
            className="resize-none text-sm outline-none placeholder:text-stone-400"
          />
          <div className="flex items-center gap-1">
            {TYPE_ORDER.map((tp) => {
              const { icon: Icon, color, labelKey } = TYPE_META[tp];
              return (
                <button
                  key={tp}
                  type="button"
                  title={t(labelKey)}
                  onClick={() => setType(tp)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                    type === tp ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-stone-100'
                  }`}
                >
                  <Icon size={14} className={color} />
                </button>
              );
            })}
            <button type="submit" className="ml-auto rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700">
              {t('projects.add')}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => {
            setType(defaultType);
            setAdding(true);
          }}
          className="mt-1 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-stone-400 transition hover:bg-white hover:text-stone-600"
        >
          <Plus size={15} />
          {t('projects.addItem')}
        </button>
      )}
    </section>
  );
}

function ItemCard({ item, project, allItems, onSelect }: { item: WorkItem; project: Project; allItems: WorkItem[]; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const { icon: Icon, color, hex } = TYPE_META[item.type];
  const parent = item.parentId ? allItems.find((i) => i.id === item.parentId) : undefined;
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
      className={`flex w-full touch-none flex-col gap-1.5 rounded-lg border border-l-4 border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:shadow-md ${
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
