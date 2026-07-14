import { useState } from 'react';
import { Pause, PictureInPicture2, Play, RotateCcw, Settings, SkipForward, Target, Undo2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  // The pip variant's own design size — the SVG's viewBox coordinate space,
  // not its rendered pixel size (that's fluid, via vmin below, so the ring
  // fills whatever size the user drags the PiP window to instead of staying
  // pinned to a fixed pixel size that looks lost in a larger window). `vmin`
  // here refers to the PiP window's own viewport — it's a separate document,
  // not the main tab — so it tracks that window's size live, no JS needed.
  const size = variant === 'pip' ? 120 : 208;
  const linkedTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : undefined;
  const activePreset = activePresetId ? presets.find((p) => p.id === activePresetId) : undefined;

  if (variant === 'placeholder') {
    return (
      <div className={`flex items-center justify-between rounded-2xl border border-stone-200 p-4 ${meta.soft}`}>
        <div>
          <div className={`text-xs font-medium ${meta.text}`}>{t(meta.labelKey)}</div>
          <div className="font-mono text-2xl font-bold text-stone-800">{formatTime(timeLeft)}</div>
        </div>
        <button
          onClick={onClosePiP}
          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50"
        >
          <Undo2 size={13} /> {t('pomodoro.returnToPage')}
        </button>
      </div>
    );
  }

  return (
    <div
      key={flashKey}
      className={`flex flex-col items-center rounded-3xl border border-stone-200 bg-white shadow-sm animate-phase-flash ${
        variant === 'pip' ? 'gap-[clamp(0.5rem,3vmin,1rem)] p-[clamp(0.75rem,4vmin,1.5rem)]' : 'gap-4 p-6'
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.soft} ${meta.text}`}>{t(meta.labelKey)}</span>
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
              aria-label={t('pomodoro.settingsAria')}
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

      <div
        className={`relative ${variant === 'pip' ? 'aspect-square w-[clamp(90px,45vmin,220px)]' : ''}`}
        style={variant === 'pip' ? undefined : { width: size, height: size }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
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
        <div
          className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-stone-800 ${variant === 'pip' ? 'text-[clamp(0.85rem,7vmin,1.5rem)]' : 'text-3xl'}`}
        >
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

      <div className={`flex items-center ${variant === 'pip' ? 'gap-1.5' : 'gap-2'}`}>
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 rounded-full bg-brand-600 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95 ${
            variant === 'pip' ? 'p-2.5 text-sm' : 'px-6 py-2 text-sm'
          }`}
        >
          {isActive ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          {variant !== 'pip' && (isActive ? t('pomodoro.pause') : t('pomodoro.start'))}
        </button>
        <button
          onClick={reset}
          className={`flex items-center gap-1.5 rounded-full bg-stone-100 font-medium text-stone-600 hover:bg-stone-200 ${
            variant === 'pip' ? 'p-2.5 text-sm' : 'px-4 py-2 text-sm'
          }`}
        >
          <RotateCcw size={15} /> {variant !== 'pip' && t('pomodoro.reset')}
        </button>
        <button
          onClick={skip}
          className={`flex items-center gap-1.5 rounded-full bg-stone-100 font-medium text-stone-600 hover:bg-stone-200 ${
            variant === 'pip' ? 'p-2.5 text-sm' : 'px-4 py-2 text-sm'
          }`}
        >
          <SkipForward size={15} /> {variant !== 'pip' && t('pomodoro.next')}
        </button>
      </div>

      {variant === 'main' && (
        <>
          <div className="grid w-full grid-cols-2 gap-2 border-t border-stone-100 pt-4 text-center">
            <div>
              <div className="text-lg font-bold text-stone-800">{stats.todaySessions}</div>
              <div className="text-xs text-stone-400">{t('pomodoro.todaySessions')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stone-800">
                {stats.todayFocusMinutes} {t('pomodoro.minutesSuffix')}
              </div>
              <div className="text-xs text-stone-400">{t('pomodoro.todayFocusMinutes')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stone-800">{stats.totalSessions}</div>
              <div className="text-xs text-stone-400">{t('pomodoro.totalSessions')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stone-800">
                {stats.totalFocusMinutes} {t('pomodoro.minutesSuffix')}
              </div>
              <div className="text-xs text-stone-400">{t('pomodoro.totalFocusMinutes')}</div>
            </div>
          </div>
          {pipSupported && (
            <button
              onClick={onOpenPiP}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-900 active:scale-[0.98]"
            >
              <PictureInPicture2 size={16} /> {t('pomodoro.openPip')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
