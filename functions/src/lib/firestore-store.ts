import { FieldPath, type Firestore, type Query } from 'firebase-admin/firestore';
import { normalizeItem, type Comment, type ItemFilter, type Project, type Store, type WorkItem } from './store.js';

export const COLLECTIONS = { projects: 'projects', items: 'workItems', comments: 'workItemComments' } as const;

/**
 * Firestore-реалізація. Колекції плоскі з полем `userId`, як і решта застосунку.
 * Запити лише з рівністю (без orderBy), тож композитні індекси не потрібні; сортування — в пам'яті.
 */
export const firestoreStore = (db: Firestore, uid: string): Store => {
	const projects = db.collection(COLLECTIONS.projects);
	const items = db.collection(COLLECTIONS.items);
	const comments = db.collection(COLLECTIONS.comments);
	const mine = (q: Query) => q.where('userId', '==', uid);
	const data = <T>(d: FirebaseFirestore.DocumentSnapshot) => ({ ...d.data(), id: d.id }) as T;
	const owned = <T extends { userId: string }>(v: T | null) => (v && v.userId === uid ? v : null);

	const store: Store = {
		async listProjects() {
			const snap = await mine(projects).get();
			return snap.docs.map((d) => data<Project>(d)).sort((a, b) => a.key.localeCompare(b.key));
		},
		async getProjectByKey(key) {
			const snap = await mine(projects).where('key', '==', key).limit(1).get();
			return snap.empty ? null : data<Project>(snap.docs[0]);
		},
		async projectById(id) {
			const d = await projects.doc(id).get();
			return d.exists ? owned(data<Project>(d)) : null;
		},
		async createProject(p) {
			const now = Date.now();
			const ref = projects.doc();
			const project: Project = { ...p, id: ref.id, userId: uid, nextNumber: 1, createdAt: now, updatedAt: now };
			await ref.set(project);
			return project;
		},
		async listItems(filter: ItemFilter) {
			let q = mine(items);
			if (filter.projectId) q = q.where('projectId', '==', filter.projectId);
			if (filter.parentId) q = q.where('parentId', '==', filter.parentId);
			if (filter.status?.length === 1) q = q.where('status', '==', filter.status[0]);
			else if (filter.status?.length) q = q.where('status', 'in', filter.status.slice(0, 30));
			if (filter.type?.length === 1) q = q.where('type', '==', filter.type[0]);
			if (filter.assignee) q = q.where('assignee', '==', filter.assignee);
			const snap = await q.get();
			return snap.docs
				.map((d) => normalizeItem(data<WorkItem>(d)))
				.filter((i) => !filter.type?.length || filter.type.includes(i.type));
		},
		async getItem(id) {
			const d = await items.doc(id).get();
			return d.exists ? owned(normalizeItem(data<WorkItem>(d))) : null;
		},
		async getItemByNumber(projectId, number) {
			const snap = await mine(items).where('projectId', '==', projectId).where('number', '==', number).limit(1).get();
			return snap.empty ? null : normalizeItem(data<WorkItem>(snap.docs[0]));
		},
		async getItems(ids) {
			if (!ids.length) return [];
			const out: WorkItem[] = [];
			for (let i = 0; i < ids.length; i += 30) {
				const snap = await mine(items).where(FieldPath.documentId(), 'in', ids.slice(i, i + 30)).get();
				out.push(...snap.docs.map((d) => normalizeItem(data<WorkItem>(d))));
			}
			return out;
		},
		async listReferencing(field, id) {
			const snap = await mine(items).where(field, 'array-contains', id).get();
			return snap.docs.map((d) => normalizeItem(data<WorkItem>(d)));
		},
		async createItem(projectId, item) {
			const projectRef = projects.doc(projectId);
			const itemRef = items.doc();
			return db.runTransaction(async (tx) => {
				const p = await tx.get(projectRef);
				if (!p.exists || p.get('userId') !== uid) throw new Error('project not found');
				const number = (p.get('nextNumber') as number) ?? 1;
				const now = Date.now();
				const doc: WorkItem = {
					...item,
					id: itemRef.id,
					userId: uid,
					projectId,
					number,
					branch: null,
					prUrl: null,
					order: now,
					createdAt: now,
					updatedAt: now,
				};
				tx.set(itemRef, doc);
				tx.update(projectRef, { nextNumber: number + 1, updatedAt: now });
				return doc;
			});
		},
		async updateItem(id, changes) {
			const ref = items.doc(id);
			await ref.update({ ...changes, updatedAt: Date.now() });
			return normalizeItem(data<WorkItem>(await ref.get()));
		},
		async addComment(itemId, author, body) {
			const ref = comments.doc();
			const c: Comment = { id: ref.id, userId: uid, itemId, author, body, createdAt: Date.now() };
			await ref.set(c);
			await items.doc(itemId).update({ updatedAt: c.createdAt });
			return c;
		},
		async listComments(itemId, limit) {
			const snap = await mine(comments).where('itemId', '==', itemId).get();
			return snap.docs
				.map((d) => data<Comment>(d))
				.sort((a, b) => a.createdAt - b.createdAt)
				.slice(-limit);
		},
	};
	return store;
};
