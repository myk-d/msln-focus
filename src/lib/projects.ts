import { BookOpen, Bug, Crown, SquareCheck, type LucideIcon } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Assignee, Priority, Project, Severity, WorkItem, WorkItemStatus, WorkItemType } from '../types';

export const STATUS_ORDER: WorkItemStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled'];
// Board columns; `cancelled` is shown only on demand.
export const BOARD_STATUSES: WorkItemStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];
export const TYPE_ORDER: WorkItemType[] = ['story', 'task', 'bug', 'epic'];
export const SEVERITY_ORDER: Severity[] = ['1-critical', '2-high', '3-medium', '4-low'];
export const ASSIGNEE_ORDER: Assignee[] = ['me', 'claude', 'antigravity'];

export const STATUS_META: Record<WorkItemStatus, { labelKey: string; dot: string }> = {
  backlog: { labelKey: 'projects.status.backlog', dot: 'bg-stone-300' },
  todo: { labelKey: 'projects.status.todo', dot: 'bg-sky-400' },
  'in-progress': { labelKey: 'projects.status.inProgress', dot: 'bg-amber-400' },
  'in-review': { labelKey: 'projects.status.inReview', dot: 'bg-violet-400' },
  done: { labelKey: 'projects.status.done', dot: 'bg-emerald-500' },
  cancelled: { labelKey: 'projects.status.cancelled', dot: 'bg-stone-400' },
};

// Colors follow Azure DevOps work item types (Epic orange, User Story blue, Task yellow, Bug red).
export const TYPE_META: Record<WorkItemType, { labelKey: string; icon: LucideIcon; color: string; hex: string }> = {
  epic: { labelKey: 'projects.type.epic', icon: Crown, color: 'text-[#FF7B00]', hex: '#FF7B00' },
  story: { labelKey: 'projects.type.story', icon: BookOpen, color: 'text-[#009CCC]', hex: '#009CCC' },
  task: { labelKey: 'projects.type.task', icon: SquareCheck, color: 'text-[#D9A800]', hex: '#F2CB1D' },
  bug: { labelKey: 'projects.type.bug', icon: Bug, color: 'text-[#CC293D]', hex: '#CC293D' },
};

export const SEVERITY_META: Record<Severity, { labelKey: string; chip: string }> = {
  '1-critical': { labelKey: 'projects.severity.critical', chip: 'bg-red-100 text-red-700' },
  '2-high': { labelKey: 'projects.severity.high', chip: 'bg-orange-100 text-orange-700' },
  '3-medium': { labelKey: 'projects.severity.medium', chip: 'bg-amber-100 text-amber-700' },
  '4-low': { labelKey: 'projects.severity.low', chip: 'bg-stone-100 text-stone-600' },
};

export const ASSIGNEE_META: Record<Assignee, { labelKey: string; initials: string; avatar: string }> = {
  me: { labelKey: 'projects.author.me', initials: '', avatar: 'bg-brand-600 text-white' },
  claude: { labelKey: 'projects.author.claude', initials: 'C', avatar: 'bg-[#D97757] text-white' },
  antigravity: { labelKey: 'projects.author.antigravity', initials: 'AG', avatar: 'bg-sky-600 text-white' },
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };

// Same order as the API (functions/src/lib/view.ts): priority first, then manual order.
export function sortItems(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order);
}

export function itemRef(project: Pick<Project, 'key'> | undefined, item: Pick<WorkItem, 'number'>): string {
  return `${project?.key ?? '?'}-${item.number}`;
}

// Items created before a field existed get its default here (there are no migrations).
export function normalizeItem(i: WorkItem): WorkItem {
  return {
    ...i,
    acceptanceCriteria: i.acceptanceCriteria ?? [],
    blockedBy: i.blockedBy ?? [],
    related: i.related ?? [],
    labels: i.labels ?? [],
    assignee: i.assignee ?? null,
    severity: i.severity ?? null,
  };
}

export function isOpen(i: WorkItem): boolean {
  return i.status !== 'done' && i.status !== 'cancelled';
}

marked.setOptions({ gfm: true, breaks: true });

// Markdown → sanitized HTML. Text comes from the owner and from agents, so it is sanitized either way.
export function renderMarkdown(md: string, inline = false): string {
  const html = inline ? (marked.parseInline(md) as string) : (marked.parse(md) as string);
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
}

export const PROJECT_KEY_RE = /^[A-Z][A-Z0-9]{1,9}$/;

export interface TaskboardRow {
  // `null` marks the "No story" row.
  story: WorkItem | null;
  key: string;
  // Visible children (after the type filter and the cancelled toggle), by status.
  byStatus: Record<WorkItemStatus, WorkItem[]>;
  // Progress over all children except cancelled ones, ignoring filters.
  done: number;
  total: number;
  // Children that exist at all (ignoring filters), to tell "no tasks yet" from "filtered out".
  childCount: number;
}

export const NO_STORY_KEY = 'none';

function emptyByStatus(): Record<WorkItemStatus, WorkItem[]> {
  return { backlog: [], todo: [], 'in-progress': [], 'in-review': [], done: [], cancelled: [] };
}

export type AssigneeFilter = Assignee | 'unassigned';

// Board/backlog filters. Plain data kept in component state (never stored): `null` means "All".
export interface ItemFilters {
  query: string;
  type: WorkItemType | null;
  assignee: AssigneeFilter | null;
  epicId: string | null;
}

export const EMPTY_FILTERS: ItemFilters = { query: '', type: null, assignee: null, epicId: null };

export function hasActiveFilters(f: ItemFilters): boolean {
  return f.query.trim() !== '' || f.type !== null || f.assignee !== null || f.epicId !== null;
}

// Active filters among the select-based ones (search is visible on its own, so it is not counted).
export function activeFilterCount(f: ItemFilters): number {
  return (f.type ? 1 : 0) + (f.assignee ? 1 : 0) + (f.epicId ? 1 : 0);
}

// An item belongs to an epic if it is a story under it, or a task/bug under it directly or through its story.
function inEpic(item: WorkItem, epicId: string, byId: Map<string, WorkItem>): boolean {
  if (item.parentId === epicId) return true;
  const parent = item.parentId ? byId.get(item.parentId) : undefined;
  return parent?.type === 'story' && parent.parentId === epicId;
}

// Case-insensitive substring over ref and title, plus type, assignee and epic, all combined with AND.
// Pass the whole project: the epic chain is resolved inside it. Cancelled items are the caller's concern.
export function filterItems(items: WorkItem[], project: Pick<Project, 'key'> | undefined, f: ItemFilters): WorkItem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const q = f.query.trim().toLowerCase();
  return items.filter((item) => {
    if (q && !itemRef(project, item).toLowerCase().includes(q) && !item.title.toLowerCase().includes(q)) return false;
    if (f.type && item.type !== f.type) return false;
    if (f.assignee && (f.assignee === 'unassigned' ? item.assignee !== null : item.assignee !== f.assignee)) return false;
    if (f.epicId && !inEpic(item, f.epicId, byId)) return false;
    return true;
  });
}

// Taskboard rows: one per story (sorted), then "No story" for tasks/bugs whose parent is missing, an epic or
// not a story. Epics never produce a row or a card. A story row stays when the story or any child matches the
// filters; cards that do not match are hidden. Pure, so it is recomputed from live items on every render.
export function buildTaskboard(items: WorkItem[], project: Pick<Project, 'key'> | undefined, filters: ItemFilters, showCancelled: boolean): TaskboardRow[] {
  const storyIds = new Set(items.filter((i) => i.type === 'story').map((i) => i.id));
  const matching = new Set(filterItems(items, project, filters).map((i) => i.id));
  const childFilter = (i: WorkItem) => matching.has(i.id);
  const makeRow = (story: WorkItem | null, children: WorkItem[]): TaskboardRow => {
    const byStatus = emptyByStatus();
    const counted = children.filter((c) => c.status !== 'cancelled');
    for (const c of sortItems(children)) {
      if (!childFilter(c)) continue;
      if (c.status === 'cancelled' && !showCancelled) continue;
      byStatus[c.status].push(c);
    }
    return {
      story,
      key: story?.id ?? NO_STORY_KEY,
      byStatus,
      done: counted.filter((c) => c.status === 'done').length,
      total: counted.length,
      childCount: children.length,
    };
  };

  const children = items.filter((i) => i.type !== 'epic' && i.type !== 'story');
  const stories = sortItems(items.filter((i) => i.type === 'story' && (showCancelled || i.status !== 'cancelled')));
  const rows = stories
    .map((s) => makeRow(s, children.filter((c) => c.parentId === s.id)))
    .filter((r) => matching.has(r.story!.id) || Object.values(r.byStatus).some((cards) => cards.length > 0));
  const loose = children.filter((c) => !c.parentId || !storyIds.has(c.parentId));
  const looseRow = makeRow(null, loose);
  if (Object.values(looseRow.byStatus).some((cards) => cards.length > 0)) rows.push(looseRow);
  return rows;
}

// Parent rules for creation: an epic has no parent, a story hangs under an epic (or nothing),
// a task/bug under a story or an epic (or nothing).
export function validParentTypes(type: WorkItemType): WorkItemType[] {
  if (type === 'epic') return [];
  if (type === 'story') return ['epic'];
  return ['story', 'epic'];
}

// Live candidates for the parent select of a new item (cancelled items are not offered).
export function parentCandidates(items: WorkItem[], type: WorkItemType): WorkItem[] {
  const allowed = validParentTypes(type);
  return sortItems(items.filter((i) => allowed.includes(i.type) && i.status !== 'cancelled'));
}

// Trimmed title, or null when nothing is left (empty / whitespace-only titles are never created).
export function cleanTitle(raw: string): string | null {
  const title = raw.trim();
  return title ? title : null;
}
