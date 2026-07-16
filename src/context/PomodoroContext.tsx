import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';
import { useDocumentPiP } from '../hooks/useDocumentPiP';

// Document PiP lives here (not in PomodoroPage) so the open pip window
// survives navigating away from /pomodoro — it's a real OS-level window,
// independent of any one page's mount lifetime. Previously, navigating to
// another page unmounted PomodoroPage's own useDocumentPiP() call, orphaning
// the still-open native pip window (left blank) while the app forgot it
// existed and showed the full timer on the page again.
type PomodoroValue = ReturnType<typeof usePomodoro> & ReturnType<typeof useDocumentPiP>;

const PomodoroContext = createContext<PomodoroValue | null>(null);

// A separate, narrower context for the one action consumed far from the
// Pomodoro page itself (every TaskRow, TaskDetailPanel — just to link a task
// to a running session). `usePomodoro()`'s full value changes every second
// the timer ticks (`timeLeft` etc.), which would otherwise re-render every
// task row on every tick; this context's value only changes when
// `startForTask` itself does (effectively never — see usePomodoro.ts).
interface PomodoroActions {
  startForTask: PomodoroValue['startForTask'];
}
const PomodoroActionsContext = createContext<PomodoroActions | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const pomodoro = usePomodoro();
  const pip = useDocumentPiP();
  const value: PomodoroValue = { ...pomodoro, ...pip };
  const actions = useMemo(() => ({ startForTask: pomodoro.startForTask }), [pomodoro.startForTask]);
  return (
    <PomodoroContext.Provider value={value}>
      <PomodoroActionsContext.Provider value={actions}>{children}</PomodoroActionsContext.Provider>
    </PomodoroContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context+provider+hook colocation is intentional
export function usePomodoroContext(): PomodoroValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoroContext must be used within PomodoroProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components -- context+provider+hook colocation is intentional
export function usePomodoroActions(): PomodoroActions {
  const ctx = useContext(PomodoroActionsContext);
  if (!ctx) throw new Error('usePomodoroActions must be used within PomodoroProvider');
  return ctx;
}
