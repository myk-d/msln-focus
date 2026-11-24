import { useSyncExternalStore } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';

export const THEME_PREFS: ThemePref[] = ['system', 'light', 'dark'];

// Per-device preference (not per account): the theme is a property of the screen
// in front of the user. index.html applies the same key before first paint, so
// keep the key name in sync with the inline script there.
const STORAGE_KEY = 'axo-theme';

function readPref(): ThemePref {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : 'system';
  } catch {
    return 'system';
  }
}

let current: ThemePref = readPref();
const listeners = new Set<() => void>();

// `system` leaves <html> without data-theme so the CSS follows prefers-color-scheme;
// an explicit choice pins it. The PiP window mirrors this attribute (useDocumentPiP).
function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
}

export function setThemePref(pref: ThemePref) {
  current = pref;
  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Storage blocked (private mode): the choice still applies for this session.
  }
  applyTheme(pref);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => current);
  return { pref, setPref: setThemePref };
}
