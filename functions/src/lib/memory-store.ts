import type { Comment, ItemFilter, Project, Store, WorkItem } from './store.js';

/** In-memory Store для тестів: та сама поведінка, що й firestore-store, без Firestore. */
export const memoryStore = (uid = 'owner'): Store & { dump(): { projects: Project[]; items: WorkItem[]; comments: Comment[] } } => {
	const projects: Project[] = [];
	const items: WorkItem[] = [];
	const comments: Comment[] = [];
	let seq = 0;
	let clock = 1_700_000_000_000;
	const id = () => `id${++seq}`;
	const now = () => ++clock;
	const clone = <T>(v: T): T => structuredClone(v);

	return {
		dump: () => clone({ projects, items, comments }),
		async listProjects() {
			return clone(projects.filter((p) => p.userId === uid).sort((a, b) => a.key.localeCompare(b.key)));
		},
		async getProjectByKey(key) {
			return clone(projects.find((p) => p.userId === uid && p.key === key) ?? null);
		},
		async projectById(pid) {
			return clone(projects.find((p) => p.userId === uid && p.id === pid) ?? null);
		},
		async createProject(p) {
			const t = now();
			const project: Project = { ...p, id: id(), userId: uid, nextNumber: 1, createdAt: t, updatedAt: t };
			projects.push(project);
			return clone(project);
		},
		async listItems(f: ItemFilter) {
			return clone(
				items
					.filter((i) => i.userId === uid)
					.filter((i) => !f.projectId || i.projectId === f.projectId)
					.filter((i) => !f.parentId || i.parentId === f.parentId)
					.filter((i) => !f.status?.length || f.status.includes(i.status))
					.filter((i) => !f.type?.length || f.type.includes(i.type))
					.filter((i) => !f.assignee || i.assignee === f.assignee),
			);
		},
		async getItem(iid) {
			return clone(items.find((i) => i.userId === uid && i.id === iid) ?? null);
		},
		async getItemByNumber(pid, number) {
			return clone(items.find((i) => i.userId === uid && i.projectId === pid && i.number === number) ?? null);
		},
		async getItems(ids) {
			return clone(items.filter((i) => i.userId === uid && ids.includes(i.id)));
		},
		async listReferencing(field, rid) {
			return clone(items.filter((i) => i.userId === uid && i[field].includes(rid)));
		},
		async createItem(pid, item) {
			const p = projects.find((x) => x.id === pid && x.userId === uid);
			if (!p) throw new Error('project not found');
			const t = now();
			const doc: WorkItem = { ...item, id: id(), userId: uid, projectId: pid, number: p.nextNumber++, branch: null, prUrl: null, order: t, createdAt: t, updatedAt: t };
			p.updatedAt = t;
			items.push(doc);
			return clone(doc);
		},
		async updateItem(iid, changes) {
			const i = items.find((x) => x.id === iid && x.userId === uid);
			if (!i) throw new Error('item not found');
			Object.assign(i, changes, { updatedAt: now() });
			return clone(i);
		},
		async addComment(itemId, author, body) {
			const c: Comment = { id: id(), userId: uid, itemId, author, body, createdAt: now() };
			comments.push(c);
			const i = items.find((x) => x.id === itemId);
			if (i) i.updatedAt = c.createdAt;
			return clone(c);
		},
		async listComments(itemId, limit) {
			return clone(comments.filter((c) => c.userId === uid && c.itemId === itemId).sort((a, b) => a.createdAt - b.createdAt).slice(-limit));
		},
	};
};
