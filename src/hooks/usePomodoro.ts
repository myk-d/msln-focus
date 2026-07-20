import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFirestoreValue } from './useFirestoreValue';
import { useFirestoreCollection } from './useFirestoreCollection';
import { FirebaseFactory } from '../config/firebase.factory';
import { firebaseCollections, firestoreDb } from '../config/firebase.config';
import { useAuth } from '../context/AuthContext';
import { normalizeStatsForToday, genId } from '../lib/utils';
import type { PomodoroPhase, PomodoroPreset, PomodoroSettings, PomodoroStats } from '../types';


const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartNext: true,
};

// Backfills `autoStartNext` for presets persisted before the field existed.
function normalizePreset(preset: PomodoroPreset): PomodoroPreset {
  return { ...preset, autoStartNext: preset.autoStartNext ?? true };
}

const DEFAULT_STATS: PomodoroStats = {
  todayDate: '',
  todaySessions: 0,
  todayFocusMinutes: 0,
  totalSessions: 0,
  totalFocusMinutes: 0,
};

function durationFor(phase: PomodoroPhase, settings: PomodoroSettings): number {
  if (phase === 'focus') return settings.focusMinutes * 60;
  if (phase === 'shortBreak') return settings.shortBreakMinutes * 60;
  return settings.longBreakMinutes * 60;
}

export function usePomodoro() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [settings, setSettings] = useFirestoreValue<PomodoroSettings>(
    firebaseCollections.pomodoroSettings,
    DEFAULT_SETTINGS
  );

  // Custom (not useFirestoreValue) because the loaded value needs a rollover
  // normalize pass before it becomes state — see normalizeStatsForToday.
  const [stats, setStats] = useState<PomodoroStats>(DEFAULT_STATS);
  const [statsHydrated, setStatsHydrated] = useState(false);
  const statsFactoryRef = useRef(
    new FirebaseFactory<PomodoroStats & { id: string }>(firestoreDb, firebaseCollections.pomodoroStats)
  );
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const existing = await statsFactoryRef.current.getById(uid);
      if (cancelled) return;
      const rest: Record<string, unknown> = { ...(existing ?? { id: uid, ...DEFAULT_STATS }) };
      delete rest.id;
      setStats(normalizeStatsForToday(rest as unknown as PomodoroStats));
      setStatsHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);
  useEffect(() => {
    if (!statsHydrated || !uid) return;
    void statsFactoryRef.current.create({ ...stats, id: uid });
  }, [stats, statsHydrated, uid]);

  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [rawTimeLeft, setRawTimeLeft] = useState(() => durationFor('focus', settings));
  const [isActive, setIsActive] = useState(false);
  // Whether the current phase's countdown has ever been engaged. While false,
  // the displayed time tracks live settings (so e.g. IndexedDB hydration
  // loading different durations, or editing settings, updates the idle
  // display immediately) instead of being frozen at whatever it was on mount.
  const [started, setStarted] = useState(false);
  const [sessionsInCycle, setSessionsInCycle] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [activeTaskId, setActiveTask] = useState<string | null>(null);
  const [rawPresets, setPresets] = useFirestoreCollection<PomodoroPreset>(
    firebaseCollections.pomodoroPresets
  );
  const presets = useMemo(() => rawPresets.map(normalizePreset), [rawPresets]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeLeft = started ? rawTimeLeft : durationFor(phase, settings);

  const completePhase = () => {
    setFlashKey((k) => k + 1);
    if (phase === 'focus') {
      setStats((prev) => {
        const normalized = normalizeStatsForToday(prev);
        return {
          ...normalized,
          todaySessions: normalized.todaySessions + 1,
          todayFocusMinutes: normalized.todayFocusMinutes + settings.focusMinutes,
          totalSessions: normalized.totalSessions + 1,
          totalFocusMinutes: normalized.totalFocusMinutes + settings.focusMinutes,
        };
      });
      const nextCount = sessionsInCycle + 1;
      setSessionsInCycle(nextCount);
      const nextPhase: PomodoroPhase = nextCount % settings.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
      setPhase(nextPhase);
      setRawTimeLeft(durationFor(nextPhase, settings));
    } else {
      // A long break finishing marks the end of a cycle — the session-count
      // dots should clear for the new one. A short break finishing is still
      // mid-cycle, so sessionsInCycle stays as-is.
      if (phase === 'longBreak') setSessionsInCycle(0);
      setPhase('focus');
      setRawTimeLeft(durationFor('focus', settings));
    }
    setStarted(settings.autoStartNext);
    setIsActive(settings.autoStartNext);
  };

  // Interval tick only ever calls setState from inside this callback, never
  // synchronously in the effect body; the effect re-arms every second because
  // `rawTimeLeft` is a dependency, so the closure (and `completePhase`) stays fresh.
  useEffect(() => {
    if (!isActive || rawTimeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      if (rawTimeLeft <= 1) {
        completePhase();
        return;
      }
      setRawTimeLeft(rawTimeLeft - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // completePhase intentionally excluded: it's redefined every render and only
    // needs to be fresh at the moment the interval fires, which it already is.
    // Adding it here would re-arm the interval on every render, not just each tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, rawTimeLeft]);

  // `startForTask` is consumed far from the Pomodoro page itself (every
  // TaskRow, TaskDetailPanel — via a narrower context, see PomodoroContext.tsx)
  // specifically so those components don't re-render every second the timer
  // ticks. That only works if `startForTask` (and `start`, which it calls) is
  // referentially stable across renders — reading `timeLeft` through a ref
  // instead of closing over it directly lets `start` stay a stable
  // `useCallback` with an empty dep array while still using the latest value.
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  const start = useCallback(() => {
    setRawTimeLeft(timeLeftRef.current);
    setStarted(true);
    setIsActive(true);
  }, []);
  const pause = () => setIsActive(false);
  const toggle = () => (isActive ? pause() : start());
  const reset = () => {
    setIsActive(false);
    setStarted(false);
    setActiveTask(null);
    setActivePresetId(null);
  };
  const startForTask = useCallback(
    (taskId: string) => {
      setActiveTask(taskId);
      start();
    },
    [start]
  );

  // Applies a preset's durations directly rather than going through start()
  // (which derives `timeLeft` from the *current* `settings`/`phase` closure —
  // reading that right after setSettings()/setPhase() in the same call would
  // still see the pre-update values, since React hasn't re-rendered yet).
  const runPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const nextSettings: PomodoroSettings = {
      focusMinutes: preset.focusMinutes,
      shortBreakMinutes: preset.shortBreakMinutes,
      longBreakMinutes: preset.longBreakMinutes,
      sessionsBeforeLongBreak: preset.sessionsBeforeLongBreak,
      autoStartNext: preset.autoStartNext,
    };
    setSettings(nextSettings);
    setPhase('focus');
    setSessionsInCycle(0);
    setRawTimeLeft(durationFor('focus', nextSettings));
    setStarted(true);
    setIsActive(true);
    setActivePresetId(presetId);
  };

  const addPreset = (preset: Omit<PomodoroPreset, 'id' | 'createdAt'>) => {
    setPresets((prev) => [...prev, { ...preset, id: genId(), createdAt: Date.now() }]);
  };
  const updatePreset = (id: string, patch: Partial<Omit<PomodoroPreset, 'id'>>) => {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
  };
  const skip = () => {
    if (phase === 'focus') {
      const nextCount = sessionsInCycle + 1;
      setSessionsInCycle(nextCount);
      const nextPhase: PomodoroPhase = nextCount % settings.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
      setPhase(nextPhase);
    } else {
      if (phase === 'longBreak') setSessionsInCycle(0);
      setPhase('focus');
    }
    setIsActive(false);
    setStarted(false);
  };

  const updateSettings = (patch: Partial<PomodoroSettings>) => setSettings((prev) => ({ ...prev, ...patch }));

  const totalSeconds = durationFor(phase, settings);
  const progress = totalSeconds === 0 ? 0 : 1 - timeLeft / totalSeconds;

  return {
    settings,
    updateSettings,
    stats,
    phase,
    timeLeft,
    totalSeconds,
    progress,
    isActive,
    sessionsInCycle,
    flashKey,
    activeTaskId,
    setActiveTask,
    presets,
    activePresetId,
    runPreset,
    addPreset,
    updatePreset,
    deletePreset,
    start,
    startForTask,
    pause,
    toggle,
    reset,
    skip,
  };
}
