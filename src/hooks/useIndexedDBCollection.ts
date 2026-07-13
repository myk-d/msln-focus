import { useEffect, useState } from 'react';
import { getAllRecords, replaceAllRecords, type CollectionStoreName } from '../lib/db';

// Drop-in replacement shape for useState<T[]>: callers read/update the array
// exactly as before, unaware persistence now happens against IndexedDB.
export function useIndexedDBCollection<T>(store: CollectionStoreName, seed: T[]) {
  const [value, setValue] = useState<T[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await getAllRecords<T>(store);
      if (cancelled) return;
      if (existing.length > 0) setValue(existing);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Gated on `hydrated` so this can never fire (and overwrite real stored data
  // with the seed) before the initial read above has had a chance to run.
  useEffect(() => {
    if (!hydrated) return;
    void replaceAllRecords(store, value);
  }, [store, value, hydrated]);

  return [value, setValue] as const;
}
