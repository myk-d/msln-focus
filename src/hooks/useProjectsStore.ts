import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestoreDb, firebaseCollections } from '../config/firebase.config';
import { useAuth } from '../context/AuthContext';
import { genId } from '../lib/utils';
import { normalizeItem } from '../lib/projects';
import type { CommentAuthor, Project, WorkItem, WorkItemComment, WorkItemStatus, WorkItemType } from '../types';

// The projects module is shared with the agent API (functions/), so unlike the
// rest of the app it does NOT use useFirestoreCollection: that hook's diff-sync
// would overwrite agent changes with stale local state. Reads are realtime
// (onSnapshot), writes touch only the fields that changed.

const projectsCol = collection(firestoreDb, firebaseCollections.projects);
const itemsCol = collection(firestoreDb, firebaseCollections.workItems);
const commentsCol = collection(firestoreDb, firebaseCollections.workItemComments);

function useOwnedCollection<T>(col: typeof projectsCol, uid: string | undefined, extra?: [string, string]) {
  const [state, setState] = useState<{ key: string; data: T[] } | null>(null);
  const key = `${uid ?? ''}|${extra?.join('=') ?? ''}`;

  useEffect(() => {
    if (!uid) return;
    const filters = [where('userId', '==', uid), ...(extra ? [where(extra[0], '==', extra[1])] : [])];
    return onSnapshot(
      query(col, ...filters),
      (snap) => setState({ key, data: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T) }),
      (err) => console.error(`onSnapshot ${col.path}`, err),
    );
    // `key` captures uid + extra filter; listing the array itself would resubscribe every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col, key]);

  // Derived, not stored: data from a previous filter is never shown for the current one.
  return state?.key === key ? state.data : null;
}

export interface NewItemInput {
  type: WorkItemType;
  title: string;
  status?: WorkItemStatus;
  parentId?: string | null;
}

export type ItemPatch = Partial<
  Pick<
    WorkItem,
    | 'type'
    | 'status'
    | 'title'
    | 'description'
    | 'acceptanceCriteria'
    | 'reproSteps'
    | 'priority'
    | 'severity'
    | 'assignee'
    | 'parentId'
    | 'blockedBy'
    | 'related'
    | 'labels'
    | 'order'
  >
>;

export function useProjectsStore() {
  const { user } = useAuth();
  const uid = user?.uid;
  const projects = useOwnedCollection<Project>(projectsCol, uid);
  const rawItems = useOwnedCollection<WorkItem>(itemsCol, uid);
  const items = rawItems && rawItems.map(normalizeItem);

  const createProject = async (p: { key: string; name: string; repo: string | null }) => {
    if (!uid) return null;
    if (projects?.some((x) => x.key === p.key)) throw new Error('duplicate-key');
    const now = Date.now();
    const id = genId();
    const project: Project = { ...p, id, userId: uid, defaultBranch: 'main', nextNumber: 1, createdAt: now, updatedAt: now };
    await writeBatch(firestoreDb).set(doc(projectsCol, id), project).commit();
    return project;
  };

  // Same numbering as the API: a transaction on project.nextNumber.
  const createItem = async (projectId: string, input: NewItemInput) => {
    if (!uid) return null;
    const projectRef = doc(projectsCol, projectId);
    const itemRef = doc(itemsCol, genId());
    return runTransaction(firestoreDb, async (tx) => {
      const p = await tx.get(projectRef);
      if (!p.exists()) throw new Error('project-not-found');
      const number = (p.data().nextNumber as number | undefined) ?? 1;
      const now = Date.now();
      const item: WorkItem = {
        id: itemRef.id,
        userId: uid,
        projectId,
        number,
        type: input.type,
        status: input.status ?? 'backlog',
        title: input.title,
        description: '',
        acceptanceCriteria: [],
        reproSteps: '',
        priority: 'none',
        parentId: input.parentId ?? null,
        blockedBy: [],
        related: [],
        assignee: null,
        severity: null,
        labels: [],
        branch: null,
        prUrl: null,
        order: now,
        createdAt: now,
        updatedAt: now,
      };
      tx.set(itemRef, item);
      tx.update(projectRef, { nextNumber: number + 1, updatedAt: now });
      return item;
    });
  };

  const updateItem = (id: string, patch: ItemPatch) =>
    updateDoc(doc(itemsCol, id), { ...patch, updatedAt: Date.now() }).catch((err) => console.error('updateItem', err));

  // Deletes the item and its comments; children are detached rather than deleted.
  const deleteItem = async (id: string) => {
    if (!uid) return;
    const batch = writeBatch(firestoreDb);
    const comments = await getDocs(query(commentsCol, where('userId', '==', uid), where('itemId', '==', id)));
    comments.docs.forEach((c) => batch.delete(c.ref));
    (items ?? []).filter((i) => i.parentId === id).forEach((c) => batch.update(doc(itemsCol, c.id), { parentId: null }));
    (items ?? [])
      .filter((i) => i.blockedBy.includes(id) || i.related.includes(id))
      .forEach((b) =>
        batch.update(doc(itemsCol, b.id), {
          blockedBy: b.blockedBy.filter((x) => x !== id),
          related: b.related.filter((x) => x !== id),
        }),
      );
    batch.delete(doc(itemsCol, id));
    await batch.commit();
  };

  const addComment = async (itemId: string, body: string, author: CommentAuthor = 'me') => {
    if (!uid) return;
    const now = Date.now();
    const id = genId();
    const comment: WorkItemComment = { id, userId: uid, itemId, author, body, createdAt: now };
    const batch = writeBatch(firestoreDb);
    batch.set(doc(commentsCol, id), comment);
    batch.update(doc(itemsCol, itemId), { updatedAt: now });
    await batch.commit();
  };

  return {
    loading: projects === null || items === null,
    projects: projects ?? [],
    items: items ?? [],
    createProject,
    createItem,
    updateItem,
    deleteItem,
    addComment,
  };
}

export function useItemComments(itemId: string) {
  const { user } = useAuth();
  const comments = useOwnedCollection<WorkItemComment>(commentsCol, user?.uid, ['itemId', itemId]);
  return comments ? [...comments].sort((a, b) => a.createdAt - b.createdAt) : null;
}

export type ProjectsStore = ReturnType<typeof useProjectsStore>;
