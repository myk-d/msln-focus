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

const secondaryButton = 'flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface font-semibold text-text transition hover:bg-surface-hover';

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
  const isPip = variant === 'pip';
  // The SVG's own design size (its viewBox), not its rendered pixel size. In PiP the ring is fluid
  // (vmin of the PiP window's own viewport), so it fills whatever size the user drags the window to.
  const size = isPip ? 120 : 300;
  const stroke = isPip ? 8 : 10;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const linkedTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : undefined;
  const activePreset = activePresetId ? presets.find((p) => p.id === activePresetId) : undefined;
  const mod = sessionsInCycle % settings.sessionsBeforeLongBreak;
  const filled = sessionsInCycle > 0 && mod === 0 ? settings.sessionsBeforeLongBreak : mod;
  const currentSession = Math.min(filled + 1, settings.sessionsBeforeLongBreak);

  if (variant === 'placeholder') {
    return (
      <div className={`flex items-center justify-between rounded-2xl border border-border p-5 ${meta.soft}`}>
        <div>
          <div className={`text-xs font-semibold ${meta.text}`}>{t(meta.labelKey)}</div>
          <div className="font-mono text-3xl font-semibold tabular-nums text-text">{formatTime(timeLeft)}</div>
        </div>
        <button onClick={onClosePiP} className={`${secondaryButton} min-h-11 px-4 text-sm`}>
          <Undo2 size={15} /> {t('pomodoro.returnToPage')}
        </button>
      </div>
    );
  }

  return (
    <div
      key={flashKey}
      className={`flex flex-col items-center rounded-2xl border border-border bg-surface animate-phase-flash ${
        isPip ? 'gap-[clamp(0.5rem,3vmin,1rem)] p-[clamp(0.75rem,4vmin,1.5rem)]' : 'gap-6 p-5 md:p-9'
      }`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2.5 py-1 text-[13px] font-semibold ${meta.soft} ${meta.text}`}>{t(meta.labelKey)}</span>
          {!isPip && (
            <span className="rounded-md bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-muted">
              {t('pomodoro.sessionOf', { current: currentSession, total: settings.sessionsBeforeLongBreak })}
            </span>
          )}
          {activePreset && !isPip && (
            <span className="rounded-md bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">{activePreset.name}</span>
          )}
        </div>
        {variant === 'main' && (
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="rounded-lg p-2.5 text-muted hover:bg-surface-sunken hover:text-text"
              aria-label={t('pomodoro.settingsAria')}
            >
              <Settings size={18} />
            </button>
            {settingsOpen && (
              <PomodoroSettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setSettingsOpen(false)} />
            )}
          </div>
        )}
      </div>

      <div
        className={`relative ${isPip ? 'aspect-square w-[clamp(90px,45vmin,220px)]' : 'aspect-square w-full max-w-[300px]'}`}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-surface-sunken" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={`${meta.ring} transition-[stroke-dashoffset] duration-1000 ease-linear`}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * progress}
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center font-mono font-semibold tabular-nums tracking-tight text-text ${
            isPip ? 'text-[clamp(0.85rem,7vmin,1.5rem)]' : 'text-5xl md:text-[64px]'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      <div
        role="img"
        className="flex items-center gap-1.5"
        aria-label={t('pomodoro.sessionOf', { current: currentSession, total: settings.sessionsBeforeLongBreak })}
      >
        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => {
          const current = !isPip && isActive && i === filled;
          return (
            <span
              key={i}
              className={`rounded-full ${isPip ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5'} ${
                i < filled ? 'bg-phase-focus' : current ? 'bg-accent ring-[3px] ring-accent-soft' : 'bg-surface-strong'
              }`}
            />
          );
        })}
      </div>

      {linkedTask && !isPip && (
        <div className="flex w-full max-w-md items-center gap-3 rounded-xl bg-surface-sunken px-3.5 py-2">
          <Target size={15} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-text">{linkedTask.text}</span>
          <button
            onClick={() => setActiveTask(null)}
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface-strong hover:text-danger"
            aria-label={t('pomodoro.unlinkTask')}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className={`flex items-center ${isPip ? 'gap-2' : 'w-full max-w-md gap-3'}`}>
        <button
          onClick={toggle}
          aria-label={isActive ? t('pomodoro.pause') : t('pomodoro.start')}
          className={`flex items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary transition hover:bg-primary-hover active:scale-95 ${
            isPip ? 'h-10 w-10' : 'min-h-12 flex-1 px-6 text-base'
          }`}
        >
          {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          {!isPip && (isActive ? t('pomodoro.pause') : t('pomodoro.start'))}
        </button>
        <button onClick={reset} aria-label={t('pomodoro.reset')} className={`${secondaryButton} ${isPip ? 'h-10 w-10' : 'min-h-12 flex-1 px-4 text-base'}`}>
          <RotateCcw size={18} /> {!isPip && t('pomodoro.reset')}
        </button>
        <button onClick={skip} aria-label={t('pomodoro.next')} className={`${secondaryButton} ${isPip ? 'h-10 w-10' : 'min-h-12 px-4 text-base'}`}>
          <SkipForward size={18} /> {!isPip && <span className="hidden sm:inline">{t('pomodoro.next')}</span>}
        </button>
      </div>

      {variant === 'main' && (
        <>
          <div className="grid w-full grid-cols-2 gap-3 border-t border-border-subtle pt-5 md:grid-cols-4">
            {[
              [stats.todaySessions, t('pomodoro.todaySessions')],
              [`${stats.todayFocusMinutes} ${t('pomodoro.minutesSuffix')}`, t('pomodoro.todayFocusMinutes')],
              [stats.totalSessions, t('pomodoro.totalSessions')],
              [`${stats.totalFocusMinutes} ${t('pomodoro.minutesSuffix')}`, t('pomodoro.totalFocusMinutes')],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl bg-surface-hover p-3">
                <div className="text-xs text-muted">{label}</div>
                <div className="font-mono text-2xl font-semibold tabular-nums text-text">{value}</div>
              </div>
            ))}
          </div>
          {pipSupported && (
            <button onClick={onOpenPiP} className={`${secondaryButton} min-h-11 w-full px-4 text-sm`}>
              <PictureInPicture2 size={16} /> {t('pomodoro.openPip')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
