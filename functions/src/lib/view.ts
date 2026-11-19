import { ITEM_STATUSES, PRIORITIES } from './schema.js';
import type { Comment, Project, Store, WorkItem } from './store.js';

export interface ItemSummary {
	ref: string;
	type: WorkItem['type'];
	title: string;
	status: WorkItem['status'];
	priority: WorkItem['priority'];
}

export interface ItemView extends Omit<WorkItem, 'userId' | 'projectId' | 'parentId' | 'blockedBy' | 'related'> {
	ref: string;
	project: string;
	parent: ItemSummary | null;
	children: ItemSummary[];
	/** Predecessors (ADO): must be done first. */
	blockedBy: ItemSummary[];
	/** Successors (ADO): items that wait for this one. */
	blocking: ItemSummary[];
	/** Related, in both directions. */
	related: ItemSummary[];
	comments: Omit<Comment, 'userId' | 'itemId'>[];
}

const statusRank = (s: WorkItem['status']) => ITEM_STATUSES.indexOf(s);
const priorityRank = (p: WorkItem['priority']) => -PRIORITIES.indexOf(p);

/** Порядок для списків: за статусом, потім пріоритет (високий вище), потім ручний порядок. */
export const sortItems = (items: WorkItem[]) =>
	[...items].sort((a, b) => statusRank(a.status) - statusRank(b.status) || priorityRank(a.priority) - priorityRank(b.priority) || a.order - b.order);

/** Перетворює id ↔ FOC-12 з кешем проектів на час запиту. */
export const refResolver = (store: Store) => {
	const cache = new Map<string, Project | null>();
	const project = async (id: string) => {
		if (!cache.has(id)) cache.set(id, await store.projectById(id));
		return cache.get(id) ?? null;
	};
	const refOf = async (i: WorkItem) => `${(await project(i.projectId))?.key ?? '?'}-${i.number}`;
	const summary = async (i: WorkItem): Promise<ItemSummary> => ({ ref: await refOf(i), type: i.type, title: i.title, status: i.status, priority: i.priority });
	return { project, refOf, summary, remember: (p: Project) => cache.set(p.id, p) };
};

export const buildView = async (store: Store, item: WorkItem, commentLimit = 20): Promise<ItemView> => {
	const r = refResolver(store);
	const [parent, children, blockers, blocking, relatedOut, relatedIn, comments] = await Promise.all([
		item.parentId ? store.getItem(item.parentId) : Promise.resolve(null),
		store.listItems({ parentId: item.id }),
		store.getItems(item.blockedBy),
		store.listReferencing('blockedBy', item.id),
		store.getItems(item.related),
		store.listReferencing('related', item.id),
		store.listComments(item.id, commentLimit),
	]);
	const related = [...new Map([...relatedOut, ...relatedIn].map((i) => [i.id, i])).values()];
	const { userId: _u, projectId, parentId: _p, blockedBy: _b, related: _r, ...rest } = item;
	return {
		...rest,
		ref: await r.refOf(item),
		project: (await r.project(projectId))?.key ?? '?',
		parent: parent ? await r.summary(parent) : null,
		children: await Promise.all(sortItems(children).map(r.summary)),
		blockedBy: await Promise.all(blockers.map(r.summary)),
		blocking: await Promise.all(sortItems(blocking).map(r.summary)),
		related: await Promise.all(sortItems(related).map(r.summary)),
		comments: comments.map(({ userId: _cu, itemId: _ci, ...c }) => c),
	};
};

const date = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
const line = (s: ItemSummary) => `- ${s.ref} [${s.type}, ${s.status}] ${s.title}`;

/** Компактний brief для агента: усе, що потрібно для /task, одним запитом і мінімумом токенів. */
export const toBrief = (v: ItemView) => {
	const meta = [`Type: ${v.type}`, `Status: ${v.status}`, `Priority: ${v.priority}`];
	if (v.severity) meta.push(`Severity: ${v.severity}`);
	if (v.assignee) meta.push(`Assignee: ${v.assignee}`);
	if (v.labels.length) meta.push(`Tags: ${v.labels.join(', ')}`);
	const out = [`# ${v.ref} — ${v.title}`, meta.join(' · ')];
	if (v.branch || v.prUrl) out.push(`Branch: ${v.branch ?? '—'} · PR: ${v.prUrl ?? '—'}`);
	if (v.parent) out.push('', `Parent: ${v.parent.ref} [${v.parent.type}, ${v.parent.status}] ${v.parent.title}`);
	if (v.description) out.push('', '## Description', v.description);
	if (v.acceptanceCriteria.length) out.push('', '## Acceptance criteria', ...v.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`));
	if (v.reproSteps) out.push('', '## Repro steps', v.reproSteps);
	if (v.blockedBy.length) out.push('', '## Blocked by (predecessors)', ...v.blockedBy.map(line));
	if (v.blocking.length) out.push('', '## Blocking (successors)', ...v.blocking.map(line));
	if (v.related.length) out.push('', '## Related', ...v.related.map(line));
	if (v.children.length) out.push('', '## Children', ...v.children.map(line));
	if (v.comments.length) out.push('', '## Comments', ...v.comments.map((c) => `- ${date(c.createdAt)} [${c.author}] ${c.body.replace(/\n+/g, ' ')}`));
	return out.join('\n') + '\n';
};
