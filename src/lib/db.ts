import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'mslnfocus';
const DB_VERSION = 4;

export const COLLECTION_STORES = ['lists', 'sections', 'tasks', 'pomodoroPresets', 'tags', 'events'] as const;
export type CollectionStoreName = (typeof COLLECTION_STORES)[number];

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of COLLECTION_STORES) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      },
    });
  }
  return dbPromise;
}

// One IndexedDB store per collection, records keyed by `id` — mirrors the shape
// of a Firestore collection of documents, so a future swap to Firestore only
// needs a new implementation of these same functions, not changes to callers.
export async function getAllRecords<T>(store: CollectionStoreName): Promise<T[]> {
  const db = await getDB();
  return db.getAll(store);
}

export async function replaceAllRecords<T>(store: CollectionStoreName, items: T[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  await tx.store.clear();
  await Promise.all(items.map((item) => tx.store.put(item)));
  await tx.done;
}

// Singleton values (Pomodoro settings/stats) live in one small key-value store —
// still addressable the same way a single Firestore document would be.
export async function getKV<T>(key: string, fallback: T): Promise<T> {
  const db = await getDB();
  const value = await db.get('kv', key);
  return value === undefined ? fallback : (value as T);
}

export async function putKV<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('kv', value, key);
}
