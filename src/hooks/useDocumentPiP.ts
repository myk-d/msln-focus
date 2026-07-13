import { useState } from 'react';

function copyStyles(targetDoc: Document) {
  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      if (styleSheet.cssRules) {
        const newStyle = targetDoc.createElement('style');
        Array.from(styleSheet.cssRules).forEach((rule) => {
          newStyle.appendChild(targetDoc.createTextNode(rule.cssText));
        });
        targetDoc.head.appendChild(newStyle);
      }
    } catch {
      // Пропускаємо крос-доменні стилі (наприклад, Google Fonts лінки)
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
