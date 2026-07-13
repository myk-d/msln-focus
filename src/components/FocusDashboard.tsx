import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { NavRail } from './NavRail';
import { TasksPage } from './TasksPage';
import { CalendarPage } from './CalendarPage';
import { PomodoroPage } from './PomodoroPage';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { useEventStoreContext } from '../context/EventStoreContext';
import { useNotificationReminders } from '../hooks/useNotificationReminders';

const PAGE_TITLES: Record<string, string> = {
  '/tasks': 'Завдання',
  '/calendar': 'Календар',
  '/pomodoro': 'Помодоро',
};

export function FocusDashboard() {
  const location = useLocation();
  const { tasks } = useTaskStoreContext();
  const { events } = useEventStoreContext();
  useNotificationReminders(tasks, events);

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname];
    document.title = pageTitle ? `${pageTitle} · Focus-Pocus` : 'Focus-Pocus';
  }, [location.pathname]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      <NavRail />
      <div className="flex-1 overflow-hidden pb-14 md:pb-0">
        <Routes>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </div>
    </div>
  );
}
