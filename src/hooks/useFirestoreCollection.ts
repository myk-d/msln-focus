import { useEffect, useRef, useState } from 'react';
import { where } from 'firebase/firestore';
import { FirebaseFactory } from '../config/firebase.factory';
import { firestoreDb } from '../config/firebase.config';
import { useAuth } from '../context/AuthContext';

type WithUser<T> = T & { userId: string };

function omitUserId<T>(doc: WithUser<T>): T {
  const rest: Record<string, unknown> = { ...doc };
  delete rest.userId;
  return rest as unknown as T;
}

// Drop-in replacement shape for the old useIndexedDBCollection: callers read/
// update the array exactly as before, unaware persistence now happens against
// a flat Firestore collection scoped by a `userId` field. Only mounts inside
// the authenticated tree (see AuthGate), so `user` is expected to be set.
export function useFirestoreCollection<T extends { id: string }>(collectionName: string, seed: T[]) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [value, setValue] = useState<T[]>(seed);
  const [hydrated, setHydrated] = useState(false);
  const lastSyncedRef = useRef<WithUser<T>[]>([]);
  const factoryRef = useRef(new FirebaseFactory<WithUser<T>>(firestoreDb, collectionName));

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const docs = await factoryRef.current.query(where('userId', '==', uid));
      if (cancelled) return;
      lastSyncedRef.current = docs;
      if (docs.length > 0) setValue(docs.map(omitUserId));
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, collectionName]);

  // Gated on `hydrated` so this can never fire (and overwrite real stored data
  // with the seed) before the initial query above has had a chance to run.
  useEffect(() => {
    if (!hydrated || !uid) return;
    const prev = lastSyncedRef.current;
    const prevById = new Map(prev.map((p) => [p.id, p]));
    const nextIds = new Set(value.map((v) => v.id));

    const writes: Promise<unknown>[] = [];
    for (const item of value) {
      const withUser: WithUser<T> = { ...item, userId: uid };
      const prevItem = prevById.get(item.id);
      if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(withUser)) {
        writes.push(factoryRef.current.create(withUser));
      }
    }
    for (const id of prevById.keys()) {
      if (!nextIds.has(id)) writes.push(factoryRef.current.delete(id));
    }
    lastSyncedRef.current = value.map((item) => ({ ...item, userId: uid }));
    void Promise.all(writes);
  }, [value, hydrated, uid]);

  return [value, setValue] as const;
}
