import { useEffect, useState } from 'react';
import { getKV, putKV } from '../lib/db';

export function useIndexedDBValue<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getKV<T>(key, initialValue);
      if (cancelled) return;
      setValue(stored);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    void putKV(key, value);
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
