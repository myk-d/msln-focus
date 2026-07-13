export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  sectionId: string;
  text: string;
  description: string;
  completed: boolean;
  pinned: boolean;
  priority: Priority;
  dueDate: string | null;
  tagIds: string[];
  subtasks: Subtask[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type GroupBy = 'sequence' | 'date' | 'createdAt' | 'tag' | 'priority' | 'none';
export type SortBy = 'sequence' | 'date' | 'createdAt' | 'updatedAt' | 'name' | 'tag' | 'priority';

export type TagColor = 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'stone';

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
  createdAt: number;
}

export interface Section {
  id: string;
  listId: string;
  name: string;
  order: number;
  createdAt: number;
}

export interface TaskList {
  id: string;
  name: string;
  isDefault?: boolean;
  createdAt: number;
  groupBy: GroupBy;
  sortBy: SortBy;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  color: TagColor;
  reminderMinutes: number | null;
  createdAt: number;
  updatedAt: number;
}

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartNext: boolean;
}

export interface PomodoroPreset {
  id: string;
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartNext: boolean;
  createdAt: number;
}

export interface PomodoroStats {
  todayDate: string;
  todaySessions: number;
  todayFocusMinutes: number;
  totalSessions: number;
  totalFocusMinutes: number;
}
