import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_STORAGE_KEY = 'axo.chunkReloadAt';
const RELOAD_WINDOW_MS = 30_000;

const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Expected a JavaScript-or-Wasm module script',
  'ChunkLoadError',
];

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

// Reload at most once per short window so a genuine offline failure cannot loop.
export function reloadOnceForStaleChunk(): boolean {
  const now = Date.now();
  try {
    const previous = Number(sessionStorage.getItem(RELOAD_STORAGE_KEY) ?? '0');
    if (previous && now - previous < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_STORAGE_KEY, String(now));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function installChunkReloadHandler(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnceForStaleChunk()) {
      event.preventDefault();
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
        // Hold Suspense fallback while the browser reloads into the latest bundle.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
