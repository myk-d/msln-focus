import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';

type PomodoroValue = ReturnType<typeof usePomodoro>;

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
  const actions = useMemo(() => ({ startForTask: pomodoro.startForTask }), [pomodoro.startForTask]);
  return (
    <PomodoroContext.Provider value={pomodoro}>
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
