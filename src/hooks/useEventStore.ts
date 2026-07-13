import { useMemo } from 'react';
import { useIndexedDBCollection } from './useIndexedDBCollection';
import { genId } from '../lib/utils';
import type { CalendarEvent } from '../types';

// Backfills fields added to the CalendarEvent shape after some records were
// already persisted to IndexedDB, so older rows don't crash consumers expecting them.
function normalizeEvent(event: CalendarEvent): CalendarEvent {
  return {
    ...event,
    reminderMinutes: event.reminderMinutes === undefined ? 15 : event.reminderMinutes,
  };
}

export function useEventStore() {
  const [rawEvents, setRawEvents] = useIndexedDBCollection<CalendarEvent>('events', []);
  const events = useMemo(() => rawEvents.map(normalizeEvent), [rawEvents]);
  const setEvents = (updater: (prev: CalendarEvent[]) => CalendarEvent[]) => {
    setRawEvents((prev) => updater(prev.map(normalizeEvent)));
  };

  const addEvent = (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = genId();
    const now = Date.now();
    setEvents((prev) => [...prev, { ...event, id, createdAt: now, updatedAt: now }]);
    return id;
  };

  const updateEvent = (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, addEvent, updateEvent, deleteEvent };
}

export type EventStore = ReturnType<typeof useEventStore>;
