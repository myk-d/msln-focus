import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavRail } from './NavRail';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { useEventStoreContext } from '../context/EventStoreContext';
import { usePomodoroContext } from '../context/PomodoroContext';
import { useNotificationReminders } from '../hooks/useNotificationReminders';

// Route-level code splitting — each page (and its own heavy dependencies,
// e.g. Calendar's dnd-kit-driven views/drawer) is only fetched/parsed once
// the user actually navigates there, instead of all three loading upfront.
const TasksPage = lazy(() => import('./TasksPage').then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazy(() => import('./CalendarPage').then((m) => ({ default: m.CalendarPage })));
const PomodoroPage = lazy(() => import('./PomodoroPage').then((m) => ({ default: m.PomodoroPage })));
const StatsPage = lazy(() => import('./StatsPage').then((m) => ({ default: m.StatsPage })));
// Its own lazy chunk (not statically imported here) so FocusDashboard doesn't
// pull in PomodoroTimer eagerly — it only loads once a pip window is
// actually open, same as visiting /pomodoro would.
const PipPortal = lazy(() => import('./PipPortal').then((m) => ({ default: m.PipPortal })));

export function FocusDashboard() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { tasks } = useTaskStoreContext();
  const { events } = useEventStoreContext();
  const { pipWindow } = usePomodoroContext();
  useNotificationReminders(tasks, events);

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      '/tasks': t('nav.tasks'),
      '/calendar': t('nav.calendar'),
      '/pomodoro': t('nav.pomodoro'),
      '/stats': t('nav.stats'),
    };
    const pageTitle = pageTitles[location.pathname];
    document.title = pageTitle ? `${pageTitle} · Focus-Pocus` : 'Focus-Pocus';
  }, [location.pathname, t, i18n.language]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      <NavRail />
      <div className="flex-1 overflow-hidden pb-14 md:pb-0">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            </div>
          }
        >
          <Routes>
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </Suspense>
      </div>
      {pipWindow && (
        <Suspense fallback={null}>
          <PipPortal pipWindow={pipWindow} />
        </Suspense>
      )}
    </div>
  );
}
