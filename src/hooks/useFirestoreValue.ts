import { useEffect, useRef, useState } from 'react';
import { FirebaseFactory } from '../config/firebase.factory';
import { firestoreDb } from '../config/firebase.config';
import { useAuth } from '../context/AuthContext';

// Drop-in replacement shape for the old useIndexedDBValue: a singleton value
// per user, stored as one Firestore doc keyed by the user's own uid (no
// `userId` field needed — the doc id itself scopes it). Only mounts inside
// the authenticated tree (see AuthGate), so `user` is expected to be set.
export function useFirestoreValue<T extends object>(collectionName: string, initial: T) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const factoryRef = useRef(new FirebaseFactory<T & { id: string }>(firestoreDb, collectionName));

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const existing = await factoryRef.current.getById(uid);
      if (cancelled) return;
      if (existing) {
        const rest: Record<string, unknown> = { ...existing };
        delete rest.id;
        setValue(rest as unknown as T);
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, collectionName]);

  useEffect(() => {
    if (!hydrated || !uid) return;
    void factoryRef.current.create({ ...value, id: uid });
  }, [value, hydrated, uid]);

  return [value, setValue] as const;
}
