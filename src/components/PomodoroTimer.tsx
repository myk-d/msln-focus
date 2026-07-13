import { useState } from 'react';
import { Pause, PictureInPicture2, Play, RotateCcw, Settings, SkipForward, Target, Undo2, X } from 'lucide-react';
import { usePomodoroContext } from '../context/PomodoroContext';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { PomodoroSettingsPanel } from './PomodoroSettingsPanel';
import { PHASE_META, formatTime } from '../lib/utils';

interface PomodoroTimerProps {
  variant: 'main' | 'pip' | 'placeholder';
  pipSupported?: boolean;
  onOpenPiP?: () => void;
  onClosePiP?: () => void;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PomodoroTimer({ variant, pipSupported, onOpenPiP, onClosePiP }: PomodoroTimerProps) {
  const {
    phase,
    timeLeft,
    progress,
    isActive,
    settings,
    stats,
    sessionsInCycle,
    flashKey,
    activeTaskId,
    setActiveTask,
    presets,
    activePresetId,
    updateSettings,
    toggle,
    reset,
    skip,
  } = usePomodoroContext();
  const { tasks } = useTaskStoreContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const meta = PHASE_META[phase];
  const size = variant === 'pip' ? 168 : 208;
  const linkedTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : undefined;
  const activePreset = activePresetId ? presets.find((p) => p.id === activePresetId) : undefined;

  if (variant === 'placeholder') {
    return (
      <div className={`flex items-center justify-between rounded-2xl border border-stone-200 p-4 ${meta.soft}`}>
        <div>
          <div className={`text-xs font-medium ${meta.text}`}>{meta.label}</div>
          <div className="font-mono text-2xl font-bold text-stone-800">{formatTime(timeLeft)}</div>
        </div>
        <button
          onClick={onClosePiP}
          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50"
        >
          <Undo2 size={13} /> Повернути на сторінку
        </button>
      </div>
    );
  }

  return (
    <div
      key={flashKey}
      className={`flex flex-col items-center gap-4 rounded-3xl border border-stone-200 bg-white shadow-sm animate-phase-flash ${
        variant === 'pip' ? 'p-4' : 'p-6'
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.soft} ${meta.text}`}>{meta.label}</span>
          {activePreset && variant !== 'pip' && (
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
              {activePreset.name}
            </span>
          )}
        </div>
        {variant === 'main' && (
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              aria-label="Налаштування"
            >
              <Settings size={16} />
            </button>
            {settingsOpen && (
              <PomodoroSettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setSettingsOpen(false)} />
            )}
          </div>
        )}
      </div>

      {linkedTask && variant !== 'pip' && (
        <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-500">
          <span className="flex min-w-0 items-center gap-1.5">
            <Target size={13} className="shrink-0 text-brand-500" />
            <span className="truncate">{linkedTask.text}</span>
          </span>
          <button onClick={() => setActiveTask(null)} className="shrink-0 text-stone-400 hover:text-red-500">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={RADIUS} fill="none" strokeWidth={8} className="stroke-stone-100" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={8}
            strokeLinecap="round"
            className={`${meta.ring} transition-[stroke-dashoffset] duration-1000 ease-linear`}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * progress}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-3xl font-bold text-stone-800">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {(() => {
          const mod = sessionsInCycle % settings.sessionsBeforeLongBreak;
          const filled = sessionsInCycle > 0 && mod === 0 ? settings.sessionsBeforeLongBreak : mod;
          return Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < filled ? 'bg-brand-500' : 'bg-stone-200'}`} />
          ));
        })()}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
        >
          {isActive ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          {isActive ? 'Пауза' : 'Старт'}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200"
        >
          <RotateCcw size={15} /> Скинути
        </button>
        <button
          onClick={skip}
          className="flex items-center gap-1.5 rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200"
        >
          <SkipForward size={15} /> Далі
        </button>
      </div>

      {variant === 'main' && (
        <>
          <div className="grid w-full grid-cols-2 gap-2 border-t border-stone-100 pt-4 text-center">
            <div>
              <div className="text-lg font-bold text-stone-800">{stats.todaySessions}</div>
              <div className="text-xs text-stone-400">Сьогодні сесій</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stone-800">{stats.todayFocusMinutes} хв</div>
              <div className="text-xs text-stone-400">Сьогодні у фокусі</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stone-800">{stats.totalSessions}</div>
              <div className="text-xs text-stone-400">Всього сесій</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stone-800">{stats.totalFocusMinutes} хв</div>
              <div className="text-xs text-stone-400">Всього у фокусі</div>
            </div>
          </div>
          {pipSupported && (
            <button
              onClick={onOpenPiP}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-900 active:scale-[0.98]"
            >
              <PictureInPicture2 size={16} /> Плаваюче вікно таймера
            </button>
          )}
        </>
      )}
    </div>
  );
}
