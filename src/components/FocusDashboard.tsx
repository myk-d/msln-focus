import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavRail } from './NavRail';
import { TasksPage } from './TasksPage';
import { CalendarPage } from './CalendarPage';
import { PomodoroPage } from './PomodoroPage';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { useEventStoreContext } from '../context/EventStoreContext';
import { useNotificationReminders } from '../hooks/useNotificationReminders';

export function FocusDashboard() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { tasks } = useTaskStoreContext();
  const { events } = useEventStoreContext();
  useNotificationReminders(tasks, events);

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      '/tasks': t('nav.tasks'),
      '/calendar': t('nav.calendar'),
      '/pomodoro': t('nav.pomodoro'),
    };
    const pageTitle = pageTitles[location.pathname];
    document.title = pageTitle ? `${pageTitle} · Focus-Pocus` : 'Focus-Pocus';
  }, [location.pathname, t, i18n.language]);

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
