import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, MouseSensor, TouchSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { ChevronsDownUp, ChevronsUpDown, FolderKanban } from 'lucide-react';
import { BOARD_STATUSES, STATUS_META, buildTaskboard, type TaskboardRow } from '../../lib/projects';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { ItemCard } from './ItemCard';
import { QuickAddItem } from './QuickAddItem';
import { StoryHeader } from './StoryHeader';
import type { Project, WorkItem, WorkItemStatus, WorkItemType } from '../../types';
import type { NewItemInput } from '../../hooks/useProjectsStore';

interface ProjectBoardProps {
  project: Project;
  // Every item of the project: rows are derived from it, so stories and parents are always known.
  items: WorkItem[];
  typeFilter: WorkItemType | null;
  showCancelled: boolean;
  onSelect: (id: string) => void;
  onCreate: (input: NewItemInput) => Promise<unknown>;
  onMove: (id: string, status: WorkItemStatus) => void;
}

const STORY_COLUMN = '16rem';
const STATUS_COLUMN = '18rem';

export function ProjectBoard({ project, items, typeFilter, showCancelled, onSelect, onCreate, onMove }: ProjectBoardProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // Collapse state lives in memory only (keyed by story id): after a reload every story is expanded.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const statuses: WorkItemStatus[] = showCancelled ? [...BOARD_STATUSES, 'cancelled'] : BOARD_STATUSES;
  const rows = useMemo(() => buildTaskboard(items, typeFilter, showCancelled), [items, typeFilter, showCancelled]);
  const allCollapsed = rows.length > 0 && rows.every((r) => collapsed.has(r.key));

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(rows.map((r) => r.key)));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 pt-3 md:px-6">
        <QuickAddItem defaultType={typeFilter ?? 'task'} onCreate={onCreate} />
        {rows.length > 0 && (
          <button
            onClick={toggleAll}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-stone-500 transition hover:bg-white hover:text-stone-700"
          >
            {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
            {t(allCollapsed ? 'projects.board.expandAll' : 'projects.board.collapseAll')}
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <FolderKanban size={36} className="text-stone-300" />
          <p className="max-w-sm text-sm text-stone-500">{t('projects.board.empty')}</p>
        </div>
      ) : isDesktop ? (
        <TaskboardGrid
          project={project}
          rows={rows}
          statuses={statuses}
          allItems={items}
          collapsed={collapsed}
          onToggle={toggle}
          onSelect={onSelect}
          onMove={onMove}
        />
      ) : (
        <TaskboardStack project={project} rows={rows} statuses={statuses} allItems={items} collapsed={collapsed} onToggle={toggle} onSelect={onSelect} />
      )}
    </div>
  );
}

interface BoardViewProps {
  project: Project;
  rows: TaskboardRow[];
  statuses: WorkItemStatus[];
  allItems: WorkItem[];
  collapsed: Set<string>;
  onToggle: (key: string) => void;
  onSelect: (id: string) => void;
}

function TaskboardGrid({ project, rows, statuses, allItems, collapsed, onToggle, onSelect, onMove }: BoardViewProps & { onMove: (id: string, status: WorkItemStatus) => void }) {
  const { t } = useTranslation();
  // MouseSensor + TouchSensor (not PointerSensor) so touch gets its own constraint: a long-press, so a
  // horizontal swipe scrolls the board instead of grabbing a card.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  // Cell ids are `${rowKey}:${status}`; dropping on any cell changes the status (row restriction comes with FOC-5).
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const id = String(over.id);
    const status = id.slice(id.lastIndexOf(':') + 1) as WorkItemStatus;
    const item = allItems.find((i) => i.id === active.id);
    if (item && item.status !== status) onMove(item.id, status);
  };

  const count = (status: WorkItemStatus) => rows.reduce((n, r) => n + r.byStatus[status].length, 0);
  const headCell = 'sticky top-0 z-20 flex items-center gap-2 border-b border-stone-200 bg-canvas px-3 py-2 text-sm font-medium text-stone-600';

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="scrollbar-visible min-h-0 min-w-0 flex-1 overflow-auto px-4 pb-4 md:px-6">
        <div className="grid w-max min-w-full" style={{ gridTemplateColumns: `${STORY_COLUMN} repeat(${statuses.length}, ${STATUS_COLUMN})` }}>
          <div className="contents">
            <div className={`${headCell} left-0 z-30`}>{t('projects.board.storyColumn')}</div>
            {statuses.map((status) => (
              <div key={status} className={headCell}>
                <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
                {t(STATUS_META[status].labelKey)}
                <span className="ml-auto text-xs text-stone-400">{count(status)}</span>
              </div>
            ))}
          </div>
          {rows.map((row) => {
            const isCollapsed = collapsed.has(row.key);
            return (
              <div key={row.key} className="contents">
                <div className="sticky left-0 z-10 border-b border-r border-stone-200 bg-canvas p-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                  <StoryHeader row={row} project={project} collapsed={isCollapsed} onToggle={() => onToggle(row.key)} onSelect={onSelect} />
                </div>
                {isCollapsed ? (
                  <div className="border-b border-stone-200" style={{ gridColumn: '2 / -1' }} />
                ) : row.story && row.childCount === 0 ? (
                  <div className="border-b border-stone-200 p-3 text-sm text-stone-400" style={{ gridColumn: '2 / -1' }}>
                    {t('projects.board.emptyStory')}
                  </div>
                ) : (
                  statuses.map((status) => (
                    <DropCell key={status} id={`${row.key}:${status}`}>
                      {row.byStatus[status].map((item) => (
                        <ItemCard key={item.id} item={item} project={project} allItems={allItems} showParent={!row.story} onSelect={onSelect} />
                      ))}
                    </DropCell>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

function DropCell({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-16 flex-col gap-2 border-b border-stone-200 p-2 transition ${isOver ? 'bg-brand-50 ring-2 ring-inset ring-brand-200' : ''}`}
    >
      {children}
    </div>
  );
}

// Below `md`: one card per story, children grouped under non-empty status headings. No drag here —
// the status is changed from the detail panel.
function TaskboardStack({ project, rows, statuses, allItems, collapsed, onToggle, onSelect }: BoardViewProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const isCollapsed = collapsed.has(row.key);
          const groups = statuses.filter((s) => row.byStatus[s].length > 0);
          return (
            <section key={row.key} className="rounded-2xl bg-stone-100/70 p-3">
              <StoryHeader row={row} project={project} collapsed={isCollapsed} onToggle={() => onToggle(row.key)} onSelect={onSelect} />
              {!isCollapsed && (
                <div className="mt-3 flex flex-col gap-3">
                  {row.story && row.childCount === 0 && <p className="text-sm text-stone-400">{t('projects.board.emptyStory')}</p>}
                  {groups.map((status) => (
                    <div key={status} className="flex flex-col gap-2">
                      <h3 className="flex items-center gap-2 text-xs font-medium text-stone-500">
                        <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
                        {t(STATUS_META[status].labelKey)}
                        <span className="text-stone-400">{row.byStatus[status].length}</span>
                      </h3>
                      {row.byStatus[status].map((item) => (
                        <ItemCard key={item.id} item={item} project={project} allItems={allItems} showParent={!row.story} onSelect={onSelect} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
