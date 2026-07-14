import { useState } from 'react';

// Building one DOM text node per CSS rule (Tailwind alone generates hundreds)
// is what was making PiP open janky/freeze-y — a single `textContent` string
// assignment per stylesheet is the same visual result for a fraction of the
// DOM work. External stylesheets are re-linked instead of read, which also
// sidesteps the cross-origin cssRules restriction entirely for those.
function copyStyles(targetDoc: Document) {
  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      if (styleSheet.href) {
        const link = targetDoc.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        targetDoc.head.appendChild(link);
        return;
      }
      if (!styleSheet.cssRules) return;
      const newStyle = targetDoc.createElement('style');
      newStyle.textContent = Array.from(styleSheet.cssRules)
        .map((rule) => rule.cssText)
        .join('\n');
      targetDoc.head.appendChild(newStyle);
    } catch {
      // Skips cross-origin stylesheets (e.g. Google Fonts links).
    }
  });
}

export function useDocumentPiP() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const openPiP = async () => {
    if (pipWindow || !window.documentPictureInPicture) return;
    try {
      const win = await window.documentPictureInPicture.requestWindow({ width: 260, height: 320 });
      copyStyles(win.document);
      win.document.body.className = 'bg-stone-900 text-stone-50 antialiased';
      win.addEventListener('pagehide', () => setPipWindow(null));
      setPipWindow(win);
    } catch (error) {
      console.error('Помилка PiP API:', error);
    }
  };

  const closePiP = () => {
    if (!pipWindow) return;
    pipWindow.close();
    setPipWindow(null);
  };

  return { pipWindow, isSupported, openPiP, closePiP };
}
