import type { Priority, PomodoroPhase, PomodoroStats, Task, TagColor, Tag, GroupBy, SortBy } from '../types';

export function genId(): string {
  return crypto.randomUUID();
}

export function getLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeStatsForToday(stats: PomodoroStats): PomodoroStats {
  const todayKey = getLocalDateKey(new Date());
  if (stats.todayDate === todayKey) return stats;
  return { ...stats, todayDate: todayKey, todaySessions: 0, todayFocusMinutes: 0 };
}

export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const todayKey = getLocalDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDate === todayKey) return 'Сьогодні';
  if (dueDate === getLocalDateKey(tomorrow)) return 'Завтра';
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

export function isOverdue(dueDate: string): boolean {
  return dueDate < getLocalDateKey(new Date());
}

export function sortTasksForDisplay(tasks: Task[]): Task[] {
  return sortTasksBy(tasks, 'sequence', []);
}

export function sortTasksBy(tasks: Task[], sortBy: SortBy, tags: Tag[]): Task[] {
  const tagLabel = (t: Task) => tags.find((tg) => tg.id === t.tagIds[0])?.name ?? '';
  const compare: Record<SortBy, (a: Task, b: Task) => number> = {
    sequence: (a, b) => a.order - b.order,
    date: (a, b) => (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99'),
    createdAt: (a, b) => b.createdAt - a.createdAt,
    updatedAt: (a, b) => b.updatedAt - a.updatedAt,
    name: (a, b) => a.text.localeCompare(b.text, 'uk'),
    tag: (a, b) => tagLabel(a).localeCompare(tagLabel(b), 'uk'),
    priority: (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  };
  return [...tasks].sort((a, b) => Number(b.pinned) - Number(a.pinned) || compare[sortBy](a, b));
}

export interface TaskGroup {
  key: string;
  label: string;
  tasks: Task[];
}

function dateBucket(dueDate: string | null): { key: string; label: string; rank: number } {
  if (!dueDate) return { key: 'none', label: 'Без дати', rank: 5 };
  const todayKey = getLocalDateKey(new Date());
  if (dueDate < todayKey) return { key: 'overdue', label: 'Прострочено', rank: 0 };
  if (dueDate === todayKey) return { key: 'today', label: 'Сьогодні', rank: 1 };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDate === getLocalDateKey(tomorrow)) return { key: 'tomorrow', label: 'Завтра', rank: 2 };
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  if (dueDate <= getLocalDateKey(weekAhead)) return { key: 'week', label: 'Найближчим часом', rank: 3 };
  return { key: 'later', label: 'Пізніше', rank: 4 };
}

export function groupTasksBy(tasks: Task[], groupBy: GroupBy, tags: Tag[]): TaskGroup[] {
  if (groupBy === 'sequence' || groupBy === 'none') {
    return [{ key: 'all', label: '', tasks }];
  }

  if (groupBy === 'priority') {
    return PRIORITY_ORDER.map((p) => ({
      key: p,
      label: PRIORITY_META[p].label,
      tasks: tasks.filter((t) => t.priority === p),
    })).filter((g) => g.tasks.length > 0);
  }

  if (groupBy === 'tag') {
    const tagGroups = tags
      .map((tag) => ({ key: tag.id, label: tag.name, tasks: tasks.filter((t) => t.tagIds.includes(tag.id)) }))
      .filter((g) => g.tasks.length > 0);
    const untagged = tasks.filter((t) => t.tagIds.length === 0);
    return untagged.length > 0 ? [...tagGroups, { key: 'none', label: 'Без міток', tasks: untagged }] : tagGroups;
  }

  if (groupBy === 'date') {
    const buckets = new Map<string, TaskGroup & { rank: number }>();
    tasks.forEach((t) => {
      const b = dateBucket(t.dueDate);
      if (!buckets.has(b.key)) buckets.set(b.key, { ...b, tasks: [] });
      buckets.get(b.key)!.tasks.push(t);
    });
    return [...buckets.values()].sort((a, b) => a.rank - b.rank);
  }

  // createdAt: bucket by calendar day, newest day first.
  const buckets = new Map<string, TaskGroup>();
  tasks.forEach((t) => {
    const key = getLocalDateKey(new Date(t.createdAt));
    if (!buckets.has(key)) buckets.set(key, { key, label: formatDueDate(key), tasks: [] });
    buckets.get(key)!.tasks.push(t);
  });
  return [...buckets.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export const GROUP_BY_ORDER: GroupBy[] = ['sequence', 'date', 'createdAt', 'tag', 'priority', 'none'];
export const SORT_BY_ORDER: SortBy[] = ['sequence', 'date', 'createdAt', 'updatedAt', 'name', 'tag', 'priority'];

export const GROUP_BY_META: Record<GroupBy, { label: string }> = {
  sequence: { label: 'Послідовність' },
  date: { label: 'Дата' },
  createdAt: { label: 'Час створення' },
  tag: { label: 'Мітка' },
  priority: { label: 'Пріоритет' },
  none: { label: 'Немає' },
};

export const SORT_BY_META: Record<SortBy, { label: string }> = {
  sequence: { label: 'Послідовність' },
  date: { label: 'Дата' },
  createdAt: { label: 'Час створення' },
  updatedAt: { label: 'Час зміни' },
  name: { label: 'Назва' },
  tag: { label: 'Мітка' },
  priority: { label: 'Пріоритет' },
};

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export const PRIORITY_META: Record<Priority, { label: string; colorClass: string; dotClass: string }> = {
  high: { label: 'Високий', colorClass: 'text-red-500', dotClass: 'bg-red-500' },
  medium: { label: 'Середній', colorClass: 'text-amber-500', dotClass: 'bg-amber-500' },
  low: { label: 'Низький', colorClass: 'text-blue-500', dotClass: 'bg-blue-500' },
  none: { label: 'Без пріоритету', colorClass: 'text-stone-400', dotClass: 'bg-stone-300' },
};

export const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low', 'none'];

export const PHASE_META: Record<PomodoroPhase, { label: string; ring: string; text: string; soft: string }> = {
  focus: { label: 'Фокус', ring: 'stroke-brand-500', text: 'text-brand-700', soft: 'bg-brand-50' },
  shortBreak: { label: 'Коротка перерва', ring: 'stroke-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50' },
  longBreak: { label: 'Довга перерва', ring: 'stroke-indigo-500', text: 'text-indigo-700', soft: 'bg-indigo-50' },
};

export const TAG_COLOR_ORDER: TagColor[] = ['rose', 'amber', 'emerald', 'sky', 'violet', 'stone'];

export const TAG_COLOR_META: Record<TagColor, { bg: string; text: string; dot: string }> = {
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  stone: { bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' },
};

export function nextTagColor(existingCount: number): TagColor {
  return TAG_COLOR_ORDER[existingCount % TAG_COLOR_ORDER.length];
}
