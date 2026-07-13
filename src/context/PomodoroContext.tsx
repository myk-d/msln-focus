import { createContext, useContext, type ReactNode } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';

type PomodoroValue = ReturnType<typeof usePomodoro>;

const PomodoroContext = createContext<PomodoroValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const pomodoro = usePomodoro();
  return <PomodoroContext.Provider value={pomodoro}>{children}</PomodoroContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context+provider+hook colocation is intentional
export function usePomodoroContext(): PomodoroValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoroContext must be used within PomodoroProvider');
  return ctx;
}
