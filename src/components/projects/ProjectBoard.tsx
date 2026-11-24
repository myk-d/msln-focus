import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  MouseSensor,
  TouchSensor,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type CollisionDetection,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type ScreenReaderInstructions,
} from '@dnd-kit/core';
import { ChevronsDownUp, ChevronsUpDown, SearchX } from 'lucide-react';
import { BOARD_STATUSES, STATUS_META, buildTaskboard, hasActiveFilters, itemRef, type ItemFilters, type TaskboardRow } from '../../lib/projects';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { ItemCard, ItemCardOverlay } from './ItemCard';
import { NewItemForm, NewItemButton } from './NewItemForm';
import { StoryHeader } from './StoryHeader';
import { StatusDot, StatusLabel } from './glyphs';
import { Axl } from '../brand/Axl';
import type { Project, WorkItem, WorkItemStatus } from '../../types';
import type { NewItemInput } from '../../hooks/useProjectsStore';

interface ProjectBoardProps {
  project: Project;
  // Every item of the project: rows are derived from it, so stories and parents are always known.
  items: WorkItem[];
  filters: ItemFilters;
  onClearFilters: () => void;
  showCancelled: boolean;
  onSelect: (id: string) => void;
  onCreate: (input: NewItemInput) => Promise<unknown>;
  onMove: (id: string, status: WorkItemStatus) => void;
}

const STORY_COLUMN = '16rem';
const STATUS_COLUMN = '18rem';

export function ProjectBoard({ project, items, filters, onClearFilters, showCancelled, onSelect, onCreate, onMove }: ProjectBoardProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // Collapse state lives in memory only (keyed by story id): after a reload every story is expanded.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const statuses: WorkItemStatus[] = showCancelled ? [...BOARD_STATUSES, 'cancelled'] : BOARD_STATUSES;
  const rows = useMemo(() => buildTaskboard(items, project, filters, showCancelled), [items, project, filters, showCancelled]);
  const allCollapsed = rows.length > 0 && rows.every((r) => collapsed.has(r.key));

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  // Row key whose inline quick-add is open (one at a time).
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const addProps = { items, addingKey, onAddTask: (key: string) => setAddingKey((k) => (k === key ? null : key)), onCloseAdd: () => setAddingKey(null), onCreate };
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(rows.map((r) => r.key)));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 pt-3 md:px-6">
        {rows.length > 0 && (
          <button
            onClick={toggleAll}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-surface hover:text-text"
          >
            {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
            {t(allCollapsed ? 'projects.board.expandAll' : 'projects.board.collapseAll')}
          </button>
        )}
      </div>
      {rows.length === 0 && hasActiveFilters(filters) ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <SearchX size={36} className="text-faint" />
          <p className="max-w-sm text-sm text-muted">{t('projects.board.noResults')}</p>
          <button onClick={onClearFilters} className="rounded-lg px-2 py-1 text-sm text-primary hover:bg-primary-soft">
            {t('projects.filter.clear')}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Axl emotion="playful" width={120} />
          <p className="max-w-sm text-sm text-muted">{t('projects.board.empty')}</p>
          <NewItemButton project={project} items={items} types={['story', 'epic', 'task', 'bug']} label={t('projects.newItem.newStory')} onCreate={onCreate} />
        </div>
      ) : isDesktop ? (
        <TaskboardGrid
          project={project}
          rows={rows}
          statuses={statuses}
          allItems={items}
          collapsed={collapsed}
          {...addProps}
          onToggle={toggle}
          onSelect={onSelect}
          onMove={onMove}
        />
      ) : (
        <TaskboardStack project={project} rows={rows} statuses={statuses} allItems={items} collapsed={collapsed} onToggle={toggle} onSelect={onSelect} {...addProps} />
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
  items: WorkItem[];
  addingKey: string | null;
  onAddTask: (rowKey: string) => void;
  onCloseAdd: () => void;
  onCreate: (input: NewItemInput) => Promise<unknown>;
}

// Quick-add for a row: story preselected as parent ("No story": none), types task/bug.
function RowAddForm({ row, project, items, onCreate, onClose }: { row: TaskboardRow; project: Project; items: WorkItem[]; onCreate: (input: NewItemInput) => Promise<unknown>; onClose: () => void }) {
  return <NewItemForm project={project} items={items} allowedTypes={['task', 'bug']} defaultType="task" parentId={row.story?.id ?? null} onCreate={onCreate} onClose={onClose} />;
}

// Cell ids are `${rowKey}:${status}`; rowKey is a story id or 'none', so split on the last colon.
const cellId = (rowKey: string, status: WorkItemStatus) => `${rowKey}:${status}`;
const parseCell = (id: string) => ({ rowKey: id.slice(0, id.lastIndexOf(':')), status: id.slice(id.lastIndexOf(':') + 1) as WorkItemStatus });

// Arrow left/right jumps to the neighbouring cell of the card's own row (the default 25 px step is
// useless in a grid of variable-height cells); up/down do nothing, so the card never leaves the row.
const rowKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context: { active, droppableRects, droppableContainers, over } }) => {
  const dir = event.code === KeyboardCode.Right ? 1 : event.code === KeyboardCode.Left ? -1 : 0;
  if (!dir || !active) return undefined;
  const rowKey = active.data.current?.rowKey as string | undefined;
  if (rowKey === undefined) return undefined;
  const cells = droppableContainers
    .toArray()
    .filter((c) => !c.disabled && parseCell(String(c.id)).rowKey === rowKey && droppableRects.get(c.id))
    .sort((a, b) => droppableRects.get(a.id)!.left - droppableRects.get(b.id)!.left);
  const currentId = over?.id ?? cellId(rowKey, active.data.current?.status as WorkItemStatus);
  const next = cells[cells.findIndex((c) => c.id === currentId) + dir];
  if (!next) return undefined;
  event.preventDefault();
  const rect = droppableRects.get(next.id)!;
  // Top-left corner of the target cell plus padding.
  return { x: rect.left + 8, y: rect.top + 8 };
};

// Pointer drags only count the cell under the pointer (so a drop over another row or the story column
// returns the card); keyboard drags have no pointer and use the rect of the card moved by the coordinate getter.
const collisionDetection: CollisionDetection = (args) => (args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args));

function TaskboardGrid({ project, rows, statuses, allItems, collapsed, onToggle, onSelect, onMove, items, addingKey, onAddTask, onCloseAdd, onCreate }: BoardViewProps & { onMove: (id: string, status: WorkItemStatus) => void }) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  // MouseSensor + TouchSensor (not PointerSensor) so touch gets its own constraint: a long-press, so a
  // horizontal swipe scrolls the board instead of grabbing a card.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: rowKeyboardCoordinates }),
  );

  const activeItem = activeId ? allItems.find((i) => i.id === activeId) : undefined;
  const activeRow = activeItem ? rows.find((r) => r.key === (activeItem.parentId ?? 'none')) : undefined;

  const label = useCallback(
    (id: string | number) => {
      const item = allItems.find((i) => i.id === id);
      return item ? `${itemRef(project, item)} ${item.title}` : '';
    },
    [allItems, project],
  );
  const statusLabel = useCallback((overId: string | number) => t(STATUS_META[parseCell(String(overId)).status].labelKey), [t]);
  const announcements: Announcements = useMemo(() => {
    const current = (id: string | number) => {
      const item = allItems.find((i) => i.id === id);
      return item ? t(STATUS_META[item.status].labelKey) : '';
    };
    return {
      onDragStart: ({ active }) => t('projects.dnd.pickedUp', { item: label(active.id), status: current(active.id) }),
      // Skip the origin cell, otherwise it would overwrite the 'picked up' announcement right away.
      onDragOver: ({ active, over }) =>
        over && over.id !== cellId(String(active.data.current?.rowKey), active.data.current?.status as WorkItemStatus)
          ? t('projects.dnd.movedTo', { item: label(active.id), status: statusLabel(over.id) })
          : undefined,
      onDragEnd: ({ active, over }) => {
        if (!over) return t('projects.dnd.cancelled', { item: label(active.id) });
        const item = allItems.find((i) => i.id === active.id);
        if (item && item.status === parseCell(String(over.id)).status) return t('projects.dnd.droppedSame', { item: label(active.id) });
        return t('projects.dnd.dropped', { item: label(active.id), status: statusLabel(over.id) });
      },
      onDragCancel: ({ active }) => t('projects.dnd.cancelled', { item: label(active.id) }),
    };
  }, [allItems, label, statusLabel, t]);
  const screenReaderInstructions: ScreenReaderInstructions = useMemo(() => ({ draggable: t('projects.dnd.instructions') }), [t]);

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));
  // Only cells of the card's own row are enabled droppables, so `over` is already a valid target; the
  // rowKey check is a second guard. Same cell, no target, or another row: nothing is written.
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const target = parseCell(String(over.id));
    const item = allItems.find((i) => i.id === active.id);
    if (!item || target.rowKey !== (item.parentId ?? 'none')) return;
    if (item.status !== target.status) onMove(item.id, target.status);
  };

  const count = (status: WorkItemStatus) => rows.reduce((n, r) => n + r.byStatus[status].length, 0);
  // A column with no cards at all shows the empty state once, in the first expanded row that has cells.
  const firstOpenRow = rows.find((r) => !collapsed.has(r.key) && !(r.story && r.childCount === 0))?.key;
  const headCell = 'sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-bg px-3 py-2 text-sm font-medium text-muted';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="scrollbar-visible min-h-0 min-w-0 flex-1 overflow-auto px-4 pb-4 md:px-6">
        <div className="grid w-max min-w-full" style={{ gridTemplateColumns: `${STORY_COLUMN} repeat(${statuses.length}, ${STATUS_COLUMN})` }}>
          <div className="contents">
            <div className={`${headCell} left-0 z-30`}>{t('projects.board.storyColumn')}</div>
            {statuses.map((status) => (
              <div key={status} className={headCell}>
                <StatusDot status={status} />
                <StatusLabel status={status} className="text-text" />
                <span className="ml-auto font-mono text-xs text-muted">{count(status)}</span>
              </div>
            ))}
          </div>
          {rows.map((row) => {
            const isCollapsed = collapsed.has(row.key);
            return (
              <div key={row.key} className="contents">
                <div className="sticky left-0 z-10 border-b border-r border-border bg-bg p-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                  <StoryHeader row={row} project={project} collapsed={isCollapsed} onToggle={() => onToggle(row.key)}
                    onSelect={onSelect}
                    onAddTask={() => onAddTask(row.key)}
                    addForm={addingKey === row.key && <RowAddForm row={row} project={project} items={items} onCreate={onCreate} onClose={onCloseAdd} />}
                  />
                </div>
                {isCollapsed ? (
                  <div className="border-b border-border" style={{ gridColumn: '2 / -1' }} />
                ) : row.story && row.childCount === 0 ? (
                  <div className="border-b border-border p-3 text-sm text-muted" style={{ gridColumn: '2 / -1' }}>
                    {t('projects.board.emptyStory')}
                  </div>
                ) : (
                  statuses.map((status) => (
                    <DropCell key={status} rowKey={row.key} status={status}>
                      {row.key === firstOpenRow && count(status) === 0 && <EmptyColumn />}
                      {row.byStatus[status].map((item) => (
                        <ItemCard key={item.id} item={item} project={project} allItems={allItems} showParent={!row.story} onSelect={onSelect} rowKey={row.key} />
                      ))}
                    </DropCell>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
      <DragOverlay>{activeItem && <ItemCardOverlay item={activeItem} project={project} allItems={allItems} showParent={!activeRow?.story} />}</DragOverlay>
    </DndContext>
  );
}

// Empty column: axl. (neutral) with one short line, per the brand rules (empty states only).
function EmptyColumn() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border-strong px-3 py-4 text-center">
      <Axl emotion="neutral" width={80} />
      <span className="text-sm font-bold text-text">{t('projects.board.emptyColumn')}</span>
    </div>
  );
}

function DropCell({ rowKey, status, children }: { rowKey: string; status: WorkItemStatus; children: React.ReactNode }) {
  const { active } = useDndContext();
  // While a card is dragged, cells of every other row are disabled: no hover style, never a target.
  const foreign = !!active && active.data.current?.rowKey !== rowKey;
  const { setNodeRef, isOver } = useDroppable({ id: cellId(rowKey, status), disabled: foreign });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-16 flex-col gap-2 border-b border-border p-2 transition ${isOver ? 'bg-primary-soft ring-2 ring-inset ring-ring/30' : ''}`}
    >
      {children}
    </div>
  );
}

// Below `md`: one card per story, children grouped under non-empty status headings. No drag here —
// the status is changed from the detail panel.
function TaskboardStack({ project, rows, statuses, allItems, collapsed, onToggle, onSelect, items, addingKey, onAddTask, onCloseAdd, onCreate }: BoardViewProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const isCollapsed = collapsed.has(row.key);
          const groups = statuses.filter((s) => row.byStatus[s].length > 0);
          return (
            <section key={row.key} className="rounded-2xl bg-surface-sunken/70 p-3">
              <StoryHeader row={row} project={project} collapsed={isCollapsed} onToggle={() => onToggle(row.key)}
                    onSelect={onSelect}
                    onAddTask={() => onAddTask(row.key)}
                    addForm={addingKey === row.key && <RowAddForm row={row} project={project} items={items} onCreate={onCreate} onClose={onCloseAdd} />}
                  />
              {!isCollapsed && (
                <div className="mt-3 flex flex-col gap-3">
                  {row.story && row.childCount === 0 && <p className="text-sm text-muted">{t('projects.board.emptyStory')}</p>}
                  {groups.map((status) => (
                    <div key={status} className="flex flex-col gap-2">
                      <h3 className="flex items-center gap-2 text-xs font-medium text-muted">
                        <StatusDot status={status} />
                        <StatusLabel status={status} />
                        <span className="text-muted">{row.byStatus[status].length}</span>
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
