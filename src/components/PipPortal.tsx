import { createPortal } from 'react-dom';
import { PomodoroTimer } from './PomodoroTimer';

// Rendered from FocusDashboard (always mounted, unlike PomodoroPage) so the
// portaled timer keeps updating in the real pip window regardless of which
// page is currently active.
export function PipPortal({ pipWindow }: { pipWindow: Window }) {
  return createPortal(
    <div className="flex h-dvh items-center justify-center p-3">
      <PomodoroTimer variant="pip" />
    </div>,
    pipWindow.document.body
  );
}
