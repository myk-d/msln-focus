import express, { type NextFunction, type Request, type Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { ZodError } from 'zod';
import { commentInput, ITEM_STATUSES, itemCreate, itemPatch, itemQuery, parseRef, projectInput } from './lib/schema.js';
import { toJson, toMarkdown } from './lib/spec.js';
import type { ItemChanges, Store, WorkItem } from './lib/store.js';
import { buildView, refResolver, sortItems, toBrief } from './lib/view.js';

class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

const safeEqual = (a: string, b: string) => {
	const ba = Buffer.from(a);
	const bb = Buffer.from(b);
	return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export const createApp = (store: Store, getApiKey: () => string) => {
	const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

	const projectOrThrow = async (key: string) => {
		const p = await store.getProjectByKey(key.trim().toUpperCase());
		if (!p) throw new HttpError(404, `Project ${key} not found`);
		return p;
	};
	const itemOrThrow = async (ref: string, status = 404): Promise<WorkItem> => {
		const parsed = parseRef(ref);
		if (!parsed) throw new HttpError(400, `Invalid ref "${ref}", expected e.g. FOC-12`);
		const p = await store.getProjectByKey(parsed.key);
		const item = p && (await store.getItemByNumber(p.id, parsed.number));
		if (!item) throw new HttpError(status, `Item ${ref} not found`);
		return item;
	};
	/** Hierarchy rules (same as the UI's validParentTypes): epic → no parent, story → epic, task/bug → story or epic. */
	const PARENT_TYPES: Record<WorkItem['type'], WorkItem['type'][]> = { epic: [], story: ['epic'], task: ['story', 'epic'], bug: ['story', 'epic'] };
	const checkParentType = async (type: WorkItem['type'], parentId: string | null) => {
		if (!parentId) return;
		const parent = await store.getItem(parentId);
		if (parent && !PARENT_TYPES[type].includes(parent.type)) {
			const allowed = PARENT_TYPES[type].join(' or ') || 'no parent';
			const an = (w: string) => (/^[aeiou]/.test(w) ? 'an' : 'a');
			throw new HttpError(400, `${an(type) === 'an' ? 'An' : 'A'} ${type} cannot have ${an(parent.type)} ${parent.type} as parent (allowed: ${allowed})`);
		}
	};
	/** parent / blockedBy приходять посиланнями (FOC-12), зберігаються як id. Невідоме посилання → 400. */
	const resolveLinks = async (self: WorkItem | null, parent: string | null | undefined, blockedBy: string[] | undefined, related?: string[]) => {
		const out: Pick<ItemChanges, 'parentId' | 'blockedBy' | 'related'> = {};
		if (parent !== undefined) {
			const p = parent === null ? null : await itemOrThrow(parent, 400);
			if (p && self && p.id === self.id) throw new HttpError(400, 'An item cannot be its own parent');
			out.parentId = p?.id ?? null;
		}
		if (blockedBy !== undefined) {
			const ids = await Promise.all([...new Set(blockedBy)].map(async (r) => (await itemOrThrow(r, 400)).id));
			if (self && ids.includes(self.id)) throw new HttpError(400, 'An item cannot block itself');
			out.blockedBy = ids;
		}
		if (related !== undefined) {
			const ids = await Promise.all([...new Set(related)].map(async (r) => (await itemOrThrow(r, 400)).id));
			if (self && ids.includes(self.id)) throw new HttpError(400, 'An item cannot be related to itself');
			out.related = ids;
		}
		return out;
	};

	const router = express.Router();

	router.use((req, _res, next) => {
		const key = getApiKey();
		const provided = req.header('x-api-key') ?? req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
		if (!key || !safeEqual(provided, key)) return next(new HttpError(401, 'Invalid or missing API key'));
		next();
	});

	router.get('/health', (_req, res) => res.json({ ok: true }));

	router.get('/docs', (req, res) => {
		const host = req.get('x-forwarded-host') ?? req.get('host');
		const baseUrl = `https://${host}${req.baseUrl}`;
		if (req.query.format === 'json') return void res.json(toJson(baseUrl));
		res.type('text/markdown; charset=utf-8').send(toMarkdown(baseUrl));
	});

	router.get(
		'/projects',
		wrap(async (_req, res) => {
			const projects = (await store.listProjects()).map(({ userId: _u, ...p }) => p);
			res.json({ projects });
		}),
	);

	router.post(
		'/projects',
		wrap(async (req, res) => {
			const body = projectInput.parse(req.body);
			if (await store.getProjectByKey(body.key)) throw new HttpError(409, `Project ${body.key} already exists`);
			const { userId: _u, ...project } = await store.createProject({ ...body, repo: body.repo ?? null });
			res.status(201).json({ project });
		}),
	);

	router.get(
		'/projects/:key',
		wrap(async (req, res) => {
			const { userId: _u, ...project } = await projectOrThrow(req.params.key);
			const items = await store.listItems({ projectId: project.id });
			const counts = Object.fromEntries(ITEM_STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]));
			res.json({ project, counts });
		}),
	);

	router.get(
		'/items',
		wrap(async (req, res) => {
			const q = itemQuery.parse(req.query);
			const projectId = q.project ? (await projectOrThrow(q.project)).id : undefined;
			const parentId = q.parent ? (await itemOrThrow(q.parent, 400)).id : undefined;
			const items = sortItems(await store.listItems({ projectId, parentId, status: q.status, type: q.type, assignee: q.assignee })).slice(0, q.limit);
			const r = refResolver(store);
			res.json({ count: items.length, items: await Promise.all(items.map(r.summary)) });
		}),
	);

	router.get(
		'/next',
		wrap(async (req, res) => {
			const limit = Math.min(Number(req.query.limit) || 5, 50);
			const projectId = typeof req.query.project === 'string' && req.query.project ? (await projectOrThrow(req.query.project)).id : undefined;
			const todo = (await store.listItems({ projectId, status: ['todo'] })).filter((i) => i.type !== 'epic');
			const blockerIds = [...new Set(todo.flatMap((i) => i.blockedBy))];
			const open = new Set((await store.getItems(blockerIds)).filter((b) => b.status !== 'done' && b.status !== 'cancelled').map((b) => b.id));
			const ready = sortItems(todo.filter((i) => !i.blockedBy.some((b) => open.has(b)))).slice(0, limit);
			const r = refResolver(store);
			res.json({ items: await Promise.all(ready.map(r.summary)) });
		}),
	);

	router.post(
		'/items',
		wrap(async (req, res) => {
			const { project: key, parent, blockedBy, related, ...fields } = itemCreate.parse(req.body);
			const project = await projectOrThrow(key);
			const links = await resolveLinks(null, parent, blockedBy, related);
			await checkParentType(fields.type, links.parentId ?? null);
			const item = await store.createItem(project.id, {
				...fields,
				severity: fields.type === 'bug' ? fields.severity : null,
				parentId: links.parentId ?? null,
				blockedBy: links.blockedBy ?? [],
				related: links.related ?? [],
			});
			res.status(201).json({ item: await buildView(store, item) });
		}),
	);

	router.get(
		'/items/:ref',
		wrap(async (req, res) => {
			const view = await buildView(store, await itemOrThrow(req.params.ref));
			if (req.query.format === 'md') return void res.type('text/markdown; charset=utf-8').send(toBrief(view));
			res.json({ item: view });
		}),
	);

	router.patch(
		'/items/:ref',
		wrap(async (req, res) => {
			const patch = itemPatch.parse(req.body);
			const item = await itemOrThrow(req.params.ref);
			const { parent, blockedBy, related, ...rest } = patch;
			const links = await resolveLinks(item, parent, blockedBy, related);
			// Checked only when the parent or the type changes, so items saved before this rule still update.
			if (parent !== undefined || rest.type !== undefined) {
				await checkParentType(rest.type ?? item.type, links.parentId !== undefined ? links.parentId : item.parentId);
			}
			const updated = await store.updateItem(item.id, { ...rest, ...links });
			res.json({ item: await buildView(store, updated) });
		}),
	);

	router.post(
		'/items/:ref/comments',
		wrap(async (req, res) => {
			const { author, body } = commentInput.parse(req.body);
			const item = await itemOrThrow(req.params.ref);
			const { userId: _u, itemId: _i, ...comment } = await store.addComment(item.id, author, body);
			res.status(201).json({ comment });
		}),
	);

	const app = express();
	app.locals.router = router; // для тесту відповідності документації
	app.use(express.json({ limit: '1mb' }));
	// Працює і через Hosting-rewrite (/api/...), і напряму за URL функції.
	app.use('/api', router);
	app.use('/', router);
	app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
	app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
		if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
		if (err instanceof ZodError) return void res.status(400).json({ error: 'Validation failed', issues: err.issues });
		if (err instanceof SyntaxError) return void res.status(400).json({ error: 'Invalid JSON' });
		console.error(err);
		res.status(500).json({ error: 'Internal error' });
	});
	return app;
};
