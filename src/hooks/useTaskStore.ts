import { useMemo, useState } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import { firebaseCollections } from '../config/firebase.config';
import i18n from '../i18n';
import { computeNextOccurrenceDate, genId, nextTagColor } from '../lib/utils';
import type { Task, TaskList, Section, Priority, RecurrenceRule, Subtask, Tag } from '../types';

function nextOrder(items: { order: number }[]): number {
  return items.length === 0 ? 0 : Math.max(...items.map((i) => i.order)) + 1;
}

// With auto-complete-with-subtasks on, `completed` tracks "every subtask is
// done" — a task with zero subtasks is left alone (the feature only applies
// once there's at least one to track).
function deriveCompleted(autoComplete: boolean, subtasks: Subtask[], fallback: boolean): boolean {
  return autoComplete && subtasks.length > 0 ? subtasks.every((s) => s.completed) : fallback;
}

function seedData(): { lists: TaskList[]; sections: Section[]; tasks: Task[] } {
  const listId = genId();
  const sectionId = genId();
  const now = Date.now();
  return {
    lists: [
      { id: listId, name: i18n.t('tasks.defaultListName'), isDefault: true, createdAt: now, groupBy: 'sequence', sortBy: 'sequence' },
    ],
    sections: [{ id: sectionId, listId, name: i18n.t('tasks.defaultSectionName'), order: 0, createdAt: now }],
    tasks: [],
  };
}

// Backfills fields added to the Task/TaskList shape after some records were
// already persisted to IndexedDB, so older rows don't crash consumers expecting them.
function normalizeTask(task: Task): Task {
  return {
    ...task,
    description: task.description ?? '',
    pinned: task.pinned ?? false,
    tagIds: task.tagIds ?? [],
    subtasks: task.subtasks ?? [],
    recurrence: task.recurrence ?? null,
    recurrenceAnchorDate: task.recurrenceAnchorDate ?? null,
    autoCompleteWithSubtasks: task.autoCompleteWithSubtasks ?? false,
    completedAt: task.completedAt ?? null,
    updatedAt: task.updatedAt ?? task.createdAt,
  };
}

function normalizeList(list: TaskList): TaskList {
  return {
    ...list,
    groupBy: list.groupBy ?? 'sequence',
    sortBy: list.sortBy ?? 'sequence',
  };
}

export function useTaskStore() {
  const seed = useMemo(() => seedData(), []);
  const [rawLists, setRawLists] = useFirestoreCollection<TaskList>(firebaseCollections.lists, seed.lists);
  const lists = useMemo(() => rawLists.map(normalizeList), [rawLists]);
  const setLists = (updater: (prev: TaskList[]) => TaskList[]) => {
    setRawLists((prev) => updater(prev.map(normalizeList)));
  };
  const [sections, setSections] = useFirestoreCollection<Section>(firebaseCollections.sections, seed.sections);
  const [rawTasks, setRawTasks] = useFirestoreCollection<Task>(firebaseCollections.tasks, seed.tasks);
  const tasks = useMemo(() => rawTasks.map(normalizeTask), [rawTasks]);
  // Normalizes `prev` before every mutation so updaters below never have to
  // account for stale pre-migration records missing newer Task fields.
  const setTasks = (updater: (prev: Task[]) => Task[]) => {
    setRawTasks((prev) => updater(prev.map(normalizeTask)));
  };
  const [tags, setTags] = useFirestoreCollection<Tag>(firebaseCollections.tags, []);

  // Derived rather than stored: falls back to the first list whenever the
  // previously-selected one no longer exists (e.g. IndexedDB hydration swaps
  // in different lists after mount, or the active list gets deleted).
  const [activeListIdPreference, setActiveListId] = useState('');
  const activeListId = lists.some((l) => l.id === activeListIdPreference)
    ? activeListIdPreference
    : (lists[0]?.id ?? '');

  const addList = (name: string) => {
    const listId = genId();
    const sectionId = genId();
    const now = Date.now();
    setLists((prev) => [...prev, { id: listId, name, createdAt: now, groupBy: 'sequence', sortBy: 'sequence' }]);
    setSections((prev) => [...prev, { id: sectionId, listId, name: i18n.t('tasks.defaultSectionName'), order: 0, createdAt: now }]);
    setActiveListId(listId);
  };

  const renameList = (id: string, name: string) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  };

  const setListGroupBy = (id: string, groupBy: TaskList['groupBy']) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, groupBy } : l)));
  };

  const setListSortBy = (id: string, sortBy: TaskList['sortBy']) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, sortBy } : l)));
  };

  // Exactly one list is ever `isDefault` — that's the one `deleteList` refuses
  // to remove, so reassigning it is what unlocks deleting the previous default.
  const setDefaultList = (id: string) => {
    setLists((prev) => prev.map((l) => ({ ...l, isDefault: l.id === id })));
  };

  const deleteList = (id: string) => {
    const list = lists.find((l) => l.id === id);
    if (!list || list.isDefault) return;
    const removedSectionIds = new Set(sections.filter((s) => s.listId === id).map((s) => s.id));
    setLists((prev) => prev.filter((l) => l.id !== id));
    setSections((prev) => prev.filter((s) => s.listId !== id));
    setTasks((prev) => prev.filter((t) => !removedSectionIds.has(t.sectionId)));
    // No explicit fallback needed here: `activeListId` above is derived and
    // automatically falls back to the first remaining list once this one is gone.
  };

  const addSection = (listId: string, name = ''): string => {
    const id = genId();
    const siblings = sections.filter((s) => s.listId === listId);
    setSections((prev) => [...prev, { id, listId, name, order: nextOrder(siblings), createdAt: Date.now() }]);
    return id;
  };

  const insertSection = (referenceSectionId: string, position: 'above' | 'below'): string => {
    const reference = sections.find((s) => s.id === referenceSectionId);
    if (!reference) return addSection(activeListId);
    const id = genId();
    const insertOrder = position === 'above' ? reference.order : reference.order + 1;
    setSections((prev) => {
      const shifted = prev.map((s) =>
        s.listId === reference.listId && s.order >= insertOrder ? { ...s, order: s.order + 1 } : s
      );
      return [...shifted, { id, listId: reference.listId, name: '', order: insertOrder, createdAt: Date.now() }];
    });
    return id;
  };

  const renameSection = (id: string, name: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const deleteSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    const siblings = sections.filter((s) => s.listId === section.listId);
    if (siblings.length <= 1) return;
    const fallback = siblings.filter((s) => s.id !== id).sort((a, b) => a.order - b.order)[0];
    setSections((prev) => prev.filter((s) => s.id !== id));
    setTasks((prev) => prev.map((t) => (t.sectionId === id ? { ...t, sectionId: fallback.id } : t)));
  };

  const moveSectionToList = (sectionId: string, targetListId: string) => {
    const targetSiblings = sections.filter((s) => s.listId === targetListId);
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, listId: targetListId, order: nextOrder(targetSiblings) } : s))
    );
  };

  const addTask = (sectionId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const siblings = tasks.filter((t) => t.sectionId === sectionId);
    const now = Date.now();
    setTasks((prev) => [
      ...prev,
      {
        id: genId(),
        sectionId,
        text: trimmed,
        description: '',
        completed: false,
        pinned: false,
        priority: 'none',
        dueDate: null,
        recurrence: null,
        recurrenceAnchorDate: null,
        autoCompleteWithSubtasks: false,
        completedAt: null,
        tagIds: [],
        subtasks: [],
        order: nextOrder(siblings),
        createdAt: now,
        updatedAt: now,
      },
    ]);
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)));
  };

  // Completing a recurring task advances it to its next occurrence in place
  // instead of marking it done — the row instantly represents the next
  // occurrence, with no lingering checked state (matches Todoist/Things).
  // Once the rule's endDate/count is exhausted, it falls through to a normal
  // completion and the recurrence ends for good.
  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (!t.completed && t.recurrence && t.dueDate && t.recurrenceAnchorDate) {
          const next = computeNextOccurrenceDate(t.dueDate, t.recurrenceAnchorDate, t.recurrence);
          if (next) return { ...t, dueDate: next, completedAt: Date.now(), updatedAt: Date.now() };
          return { ...t, completed: true, recurrence: null, recurrenceAnchorDate: null, completedAt: Date.now(), updatedAt: Date.now() };
        }
        return { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : null, updatedAt: Date.now() };
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const togglePin = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned, updatedAt: Date.now() } : t)));
  };

  const duplicateTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const siblings = tasks.filter((t) => t.sectionId === task.sectionId);
    const now = Date.now();
    setTasks((prev) => [
      ...prev,
      {
        ...task,
        id: genId(),
        completed: false,
        pinned: false,
        subtasks: task.subtasks.map((st) => ({ ...st, id: genId() })),
        order: nextOrder(siblings),
        createdAt: now,
        updatedAt: now,
      },
    ]);
  };

  const moveTaskToList = (taskId: string, targetListId: string) => {
    const targetSection = sections
      .filter((s) => s.listId === targetListId)
      .sort((a, b) => a.order - b.order)[0];
    if (!targetSection) return;
    moveTask(taskId, targetSection.id, Number.MAX_SAFE_INTEGER);
  };

  const moveTask = (taskId: string, targetSectionId: string, newIndex: number) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;
      const sourceSectionId = task.sectionId;

      const targetList = prev
        .filter((t) => t.sectionId === targetSectionId && t.id !== taskId)
        .sort((a, b) => a.order - b.order);
      const clampedIndex = Math.max(0, Math.min(newIndex, targetList.length));
      targetList.splice(clampedIndex, 0, { ...task, sectionId: targetSectionId });

      const reindexed = new Map<string, Task>();
      targetList.forEach((t, i) => reindexed.set(t.id, { ...t, order: i }));

      if (sourceSectionId !== targetSectionId) {
        const sourceList = prev
          .filter((t) => t.sectionId === sourceSectionId && t.id !== taskId)
          .sort((a, b) => a.order - b.order);
        sourceList.forEach((t, i) => reindexed.set(t.id, { ...t, order: i }));
      }

      return prev.map((t) => reindexed.get(t.id) ?? t);
    });
  };

  const reorderSection = (sectionId: string, orderedTaskIds: string[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.sectionId !== sectionId) return t;
        const idx = orderedTaskIds.indexOf(t.id);
        return idx === -1 ? t : { ...t, order: idx };
      })
    );
  };

  const addSubtask = (taskId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = [...t.subtasks, { id: genId(), text: trimmed, completed: false }];
        return { ...t, subtasks, completed: deriveCompleted(t.autoCompleteWithSubtasks, subtasks, t.completed), updatedAt: Date.now() };
      })
    );
  };

  const updateSubtask = (taskId: string, subtaskId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, text: trimmed } : st)), updatedAt: Date.now() }
          : t
      )
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st));
        return { ...t, subtasks, completed: deriveCompleted(t.autoCompleteWithSubtasks, subtasks, t.completed), updatedAt: Date.now() };
      })
    );
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.filter((st) => st.id !== subtaskId);
        return { ...t, subtasks, completed: deriveCompleted(t.autoCompleteWithSubtasks, subtasks, t.completed), updatedAt: Date.now() };
      })
    );
  };

  // Toggling the switch on immediately syncs `completed` to the subtasks'
  // current state too, not just future changes.
  const setAutoCompleteWithSubtasks = (taskId: string, value: boolean) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, autoCompleteWithSubtasks: value, completed: deriveCompleted(value, t.subtasks, t.completed), updatedAt: Date.now() }
          : t
      )
    );
  };

  const setPriority = (taskId: string, priority: Priority) => updateTask(taskId, { priority });

  // Manually rescheduling a recurring task re-anchors its interval/weekday
  // math to the new date, rather than leaving it pinned to whenever
  // recurrence was first turned on.
  const setDueDate = (taskId: string, dueDate: string | null) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, dueDate, recurrenceAnchorDate: t.recurrence ? dueDate : t.recurrenceAnchorDate, updatedAt: Date.now() }
          : t
      )
    );
  };

  const setTaskRecurrence = (taskId: string, rule: RecurrenceRule | null) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, recurrence: rule, recurrenceAnchorDate: rule ? t.dueDate : null, updatedAt: Date.now() }
          : t
      )
    );
  };

  const createTag = (name: string): string => {
    const id = genId();
    setTags((prev) => [...prev, { id, name: name.trim(), color: nextTagColor(prev.length), createdAt: Date.now() }]);
    return id;
  };

  const updateTag = (tagId: string, patch: Partial<Pick<Tag, 'name' | 'color'>>) => {
    setTags((prev) => prev.map((t) => (t.id === tagId ? { ...t, ...patch } : t)));
  };

  const deleteTag = (tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setTasks((prev) =>
      prev.map((t) => (t.tagIds.includes(tagId) ? { ...t, tagIds: t.tagIds.filter((id) => id !== tagId) } : t))
    );
  };

  const toggleTaskTag = (taskId: string, tagId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              tagIds: t.tagIds.includes(tagId) ? t.tagIds.filter((id) => id !== tagId) : [...t.tagIds, tagId],
              updatedAt: Date.now(),
            }
          : t
      )
    );
  };

  return {
    lists,
    sections,
    tasks,
    tags,
    activeListId,
    setActiveListId,
    addList,
    renameList,
    setListGroupBy,
    setListSortBy,
    setDefaultList,
    deleteList,
    addSection,
    insertSection,
    renameSection,
    deleteSection,
    moveSectionToList,
    addTask,
    updateTask,
    toggleTaskCompleted,
    deleteTask,
    togglePin,
    duplicateTask,
    moveTaskToList,
    moveTask,
    reorderSection,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    setAutoCompleteWithSubtasks,
    setPriority,
    setDueDate,
    setTaskRecurrence,
    createTag,
    updateTag,
    deleteTag,
    toggleTaskTag,
  };
}

export type TaskStore = ReturnType<typeof useTaskStore>;
