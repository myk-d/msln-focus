import { createPortal } from 'react-dom';
import { useDocumentPiP } from '../hooks/useDocumentPiP';
import { usePomodoroContext } from '../context/PomodoroContext';
import { PomodoroTimer } from './PomodoroTimer';
import { PomodoroPresetList } from './PomodoroPresetList';

export function PomodoroPage() {
  const { pipWindow, isSupported, openPiP, closePiP } = useDocumentPiP();
  const { presets, activePresetId, isActive, runPreset, addPreset, updatePreset, deletePreset } = usePomodoroContext();

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black tracking-tight text-stone-900">Помодоро</h1>
        <p className="mt-1 text-sm text-stone-500">Фокусуйтесь на одній задачі за раз</p>
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        <PomodoroPresetList
          presets={presets}
          activePresetId={activePresetId}
          isActive={isActive}
          onRun={runPreset}
          onAdd={addPreset}
          onUpdate={updatePreset}
          onDelete={deletePreset}
        />

        <div className="w-full max-w-sm">
          {pipWindow ? (
            <PomodoroTimer variant="placeholder" onClosePiP={closePiP} />
          ) : (
            <PomodoroTimer variant="main" pipSupported={isSupported} onOpenPiP={openPiP} />
          )}
        </div>
      </div>

      {pipWindow &&
        createPortal(
          <div className="flex h-dvh items-center justify-center p-3">
            <PomodoroTimer variant="pip" />
          </div>,
          pipWindow.document.body
        )}
    </div>
  );
}
