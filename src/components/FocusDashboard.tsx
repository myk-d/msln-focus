import { Navigate, Route, Routes } from 'react-router-dom';
import { NavRail } from './NavRail';
import { TasksPage } from './TasksPage';
import { CalendarPage } from './CalendarPage';
import { PomodoroPage } from './PomodoroPage';

export function FocusDashboard() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <NavRail />
      <div className="flex-1 overflow-hidden">
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
