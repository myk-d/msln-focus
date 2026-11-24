import { useTranslation } from 'react-i18next';
import { usePomodoroContext } from '../context/PomodoroContext';
import { PomodoroTimer } from './PomodoroTimer';
import { PomodoroPresetList } from './PomodoroPresetList';

export function PomodoroPage() {
  const { t } = useTranslation();
  const { pipWindow, isSupported, openPiP, closePiP, presets, activePresetId, isActive, runPreset, addPreset, updatePreset, deletePreset } =
    usePomodoroContext();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border bg-surface px-5 py-4 md:px-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">{t('pomodoro.heading')}</h1>
        <p className="text-sm text-muted">{t('pomodoro.subheading')}</p>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-6 p-4 md:p-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {pipWindow ? (
            <PomodoroTimer variant="placeholder" onClosePiP={closePiP} />
          ) : (
            <PomodoroTimer variant="main" pipSupported={isSupported} onOpenPiP={openPiP} />
          )}
        </div>

        <aside className="self-start rounded-2xl border border-border bg-surface p-5">
        <PomodoroPresetList
          presets={presets}
          activePresetId={activePresetId}
          isActive={isActive}
          onRun={runPreset}
          onAdd={addPreset}
          onUpdate={updatePreset}
          onDelete={deletePreset}
        />
        </aside>
      </div>
    </div>
  );
}
