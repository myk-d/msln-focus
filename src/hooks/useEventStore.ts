import { useIndexedDBCollection } from './useIndexedDBCollection';
import { genId } from '../lib/utils';
import type { CalendarEvent } from '../types';

export function useEventStore() {
  const [events, setEvents] = useIndexedDBCollection<CalendarEvent>('events', []);

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
