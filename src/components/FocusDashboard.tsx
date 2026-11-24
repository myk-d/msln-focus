import { Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavRail } from './NavRail';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { lazyWithRetry } from '../lib/chunkReload';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { useEventStoreContext } from '../context/EventStoreContext';
import { usePomodoroContext } from '../context/PomodoroContext';
import { useNotificationReminders } from '../hooks/useNotificationReminders';

// Route-level code splitting — each page (and its own heavy dependencies,
// e.g. Calendar's dnd-kit-driven views/drawer) is only fetched/parsed once
// the user actually navigates there, instead of all three loading upfront.
const TasksPage = lazyWithRetry(() => import('./TasksPage').then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazyWithRetry(() => import('./CalendarPage').then((m) => ({ default: m.CalendarPage })));
const PomodoroPage = lazyWithRetry(() => import('./PomodoroPage').then((m) => ({ default: m.PomodoroPage })));
const ProjectsPage = lazyWithRetry(() => import('./projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
// Its own lazy chunk (not statically imported here) so FocusDashboard doesn't
// pull in PomodoroTimer eagerly — it only loads once a pip window is
// actually open, same as visiting /pomodoro would.
const PipPortal = lazyWithRetry(() => import('./PipPortal').then((m) => ({ default: m.PipPortal })));

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
      '/projects': t('nav.projects'),
    };
    const pageTitle = pageTitles[location.pathname];
    document.title = pageTitle ? `${pageTitle} · Axo` : 'Axo';
  }, [location.pathname, t, i18n.language]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg">
      <NavRail />
      <div className="flex-1 overflow-hidden pb-14 md:pb-0">
        <RouteErrorBoundary resetKey={location.pathname}>
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
              </div>
            }
          >
            <Routes>
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="*" element={<Navigate to="/tasks" replace />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </div>
      {pipWindow && (
        <Suspense fallback={null}>
          <PipPortal pipWindow={pipWindow} />
        </Suspense>
      )}
    </div>
  );
}
