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
