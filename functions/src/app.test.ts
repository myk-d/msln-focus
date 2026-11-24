import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { memoryStore } from './lib/memory-store.js';

let store = memoryStore();
let server: Server;
let base = '';

beforeAll(async () => {
	// Store підміняється перед кожним тестом через замикання.
	server = createApp(
		new Proxy({} as ReturnType<typeof memoryStore>, { get: (_t, k) => (store as never)[k] }),
		() => 'secret',
	).listen(0);
	await new Promise((r) => server.once('listening', r));
	base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => void server.close());
beforeEach(() => {
	store = memoryStore();
});

const call = async (path: string, method = 'GET', body?: unknown, key = 'secret') => {
	const r = await fetch(base + path, {
		method,
		headers: { 'content-type': 'application/json', ...(key ? { 'x-api-key': key } : {}) },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await r.text();
	let json: any = null;
	try {
		json = JSON.parse(text);
	} catch {
		/* markdown */
	}
	return { status: r.status, json, text, type: r.headers.get('content-type') ?? '' };
};

const seed = async () => {
	await call('/projects', 'POST', { key: 'foc', name: 'Focus', repo: 'https://github.com/me/msln-focus' });
	const epic = await call('/items', 'POST', { project: 'FOC', type: 'epic', title: 'Projects module' });
	const story = await call('/items', 'POST', { project: 'FOC', type: 'story', title: 'Board view', parent: 'FOC-1', status: 'todo', priority: 'medium', acceptanceCriteria: ['Columns per status', 'Drag to change status'] });
	const bug = await call('/items', 'POST', { project: 'FOC', type: 'bug', title: 'Timer resets', status: 'todo', priority: 'high', reproSteps: '1. Start\n2. Switch tab' });
	return { epic, story, bug };
};

describe('auth', () => {
	it('401 without or with a wrong key, also for /docs', async () => {
		expect((await call('/health', 'GET', undefined, '')).status).toBe(401);
		expect((await call('/health', 'GET', undefined, 'nope')).status).toBe(401);
		expect((await call('/docs', 'GET', undefined, '')).status).toBe(401);
	});
	it('health works directly and through /api', async () => {
		expect((await call('/health')).status).toBe(200);
		expect((await call('/api/health')).status).toBe(200);
	});
});

describe('projects', () => {
	it('creates with an uppercased key, rejects duplicates and bad keys', async () => {
		const r = await call('/projects', 'POST', { key: 'foc', name: 'Focus' });
		expect(r.status).toBe(201);
		expect(r.json.project).toMatchObject({ key: 'FOC', defaultBranch: 'main', nextNumber: 1, repo: null });
		expect(r.json.project.userId).toBeUndefined();
		expect((await call('/projects', 'POST', { key: 'FOC', name: 'Again' })).status).toBe(409);
		expect((await call('/projects', 'POST', { key: '1x', name: 'Bad' })).status).toBe(400);
		expect((await call('/projects', 'POST', { key: 'AB', name: 'X', extra: 1 })).status).toBe(400);
	});
	it('returns counts per status', async () => {
		await seed();
		const r = await call('/projects/foc');
		expect(r.json.counts).toMatchObject({ backlog: 1, todo: 2, done: 0 });
		expect((await call('/projects/NOPE')).status).toBe(404);
	});
});

describe('items', () => {
	it('numbers items per project and links parent/children', async () => {
		const { epic, story, bug } = await seed();
		expect([epic.json.item.ref, story.json.item.ref, bug.json.item.ref]).toEqual(['FOC-1', 'FOC-2', 'FOC-3']);
		expect(story.json.item.parent).toMatchObject({ ref: 'FOC-1', type: 'epic' });
		const e = await call('/items/foc-1');
		expect(e.json.item.children.map((c: any) => c.ref)).toEqual(['FOC-2']);
	});
	it('validates create: required fields, enums, unknown refs, unknown fields', async () => {
		await seed();
		expect((await call('/items', 'POST', { project: 'FOC', type: 'story' })).status).toBe(400);
		expect((await call('/items', 'POST', { project: 'FOC', type: 'feature', title: 'x' })).status).toBe(400);
		expect((await call('/items', 'POST', { project: 'FOC', type: 'task', title: 'x', parent: 'FOC-99' })).status).toBe(400);
		expect((await call('/items', 'POST', { project: 'FOC', type: 'task', title: 'x', foo: 1 })).status).toBe(400);
		expect((await call('/items', 'POST', { project: 'ZZZ', type: 'task', title: 'x' })).status).toBe(404);
	});
	it('lists sorted by status, then priority, with filters', async () => {
		await seed();
		const all = await call('/items?project=FOC');
		expect(all.json.items.map((i: any) => i.ref)).toEqual(['FOC-1', 'FOC-3', 'FOC-2']); // backlog, todo high, todo medium
		const bugs = await call('/items?type=bug');
		expect(bugs.json.items.map((i: any) => i.ref)).toEqual(['FOC-3']);
		const children = await call('/items?parent=FOC-1');
		expect(children.json.count).toBe(1);
		expect((await call('/items?status=wip')).status).toBe(400);
	});
	it('patches fields, replaces arrays, refuses self links and unknown fields', async () => {
		await seed();
		const r = await call('/items/FOC-2', 'PATCH', { status: 'in-progress', branch: 'md/FOC-2-board', blockedBy: ['FOC-3'] });
		expect(r.status).toBe(200);
		expect(r.json.item).toMatchObject({ status: 'in-progress', branch: 'md/FOC-2-board' });
		expect(r.json.item.blockedBy.map((b: any) => b.ref)).toEqual(['FOC-3']);
		expect((await call('/items/FOC-2', 'PATCH', { parent: 'FOC-2' })).status).toBe(400);
		expect((await call('/items/FOC-2', 'PATCH', { blockedBy: ['FOC-2'] })).status).toBe(400);
		expect((await call('/items/FOC-2', 'PATCH', { owner: 'me' })).status).toBe(400);
		expect((await call('/items/FOC-2', 'PATCH', {})).status).toBe(400);
		expect((await call('/items/FOC-2', 'PATCH', { prUrl: 'not a url' })).status).toBe(400);
		const detached = await call('/items/FOC-2', 'PATCH', { parent: null });
		expect(detached.json.item.parent).toBeNull();
	});
	it('enforces the parent type hierarchy on create and on parent/type changes', async () => {
		await seed(); // FOC-1 epic, FOC-2 story (parent FOC-1), FOC-3 bug
		expect((await call('/items', 'POST', { project: 'FOC', type: 'story', title: 'x', parent: 'FOC-2' })).status).toBe(400);
		expect((await call('/items', 'POST', { project: 'FOC', type: 'epic', title: 'x', parent: 'FOC-1' })).status).toBe(400);
		expect((await call('/items', 'POST', { project: 'FOC', type: 'task', title: 'x', parent: 'FOC-3' })).status).toBe(400);
		expect((await call('/items', 'POST', { project: 'FOC', type: 'task', title: 'under story', parent: 'FOC-2' })).status).toBe(201);
		expect((await call('/items', 'POST', { project: 'FOC', type: 'bug', title: 'under epic', parent: 'FOC-1' })).status).toBe(201);
		expect((await call('/items/FOC-3', 'PATCH', { parent: 'FOC-2' })).status).toBe(200);
		expect((await call('/items/FOC-2', 'PATCH', { parent: 'FOC-3' })).status).toBe(400);
		const err = await call('/items/FOC-2', 'PATCH', { type: 'epic' });
		expect(err.status).toBe(400);
		expect(err.json.error).toMatch(/An epic cannot have an epic as parent/);
		expect((await call('/items/FOC-2', 'PATCH', { type: 'epic', parent: null })).status).toBe(200);
		expect((await call('/items/FOC-3', 'PATCH', { status: 'in-progress' })).status).toBe(200);
	});
	it('404 for a missing item, 400 for a malformed ref', async () => {
		await seed();
		expect((await call('/items/FOC-42')).status).toBe(404);
		expect((await call('/items/focus12')).status).toBe(400);
	});
	it('next: todo, not epic, unblocked, by priority', async () => {
		await seed();
		expect((await call('/next')).json.items.map((i: any) => i.ref)).toEqual(['FOC-3', 'FOC-2']);
		await call('/items/FOC-3', 'PATCH', { blockedBy: ['FOC-2'] });
		expect((await call('/next?project=FOC')).json.items.map((i: any) => i.ref)).toEqual(['FOC-2']);
		await call('/items/FOC-2', 'PATCH', { status: 'done' });
		expect((await call('/next')).json.items.map((i: any) => i.ref)).toEqual(['FOC-3']);
	});
});

describe('ADO-style fields', () => {
	it('assignee, severity (bugs only) and filtering by assignee', async () => {
		await seed();
		const bug = await call('/items', 'POST', { project: 'FOC', type: 'bug', title: 'Crash', severity: '1-critical', assignee: 'claude' });
		expect(bug.json.item).toMatchObject({ severity: '1-critical', assignee: 'claude' });
		const story = await call('/items', 'POST', { project: 'FOC', type: 'story', title: 'S', severity: '2-high' });
		expect(story.json.item.severity).toBeNull();
		expect((await call('/items', 'POST', { project: 'FOC', type: 'bug', title: 'x', severity: 'blocker' })).status).toBe(400);
		expect((await call('/items?assignee=claude')).json.items.map((i: any) => i.ref)).toEqual([bug.json.item.ref]);
		expect((await call('/items?assignee=bob')).status).toBe(400);
		const r = await call('/items/FOC-2', 'PATCH', { assignee: 'antigravity' });
		expect(r.json.item.assignee).toBe('antigravity');
	});
	it('related links show from both sides; successors are derived from blockedBy', async () => {
		await seed();
		await call('/items/FOC-2', 'PATCH', { related: ['FOC-3'], blockedBy: ['FOC-1'] });
		const a = await call('/items/FOC-2');
		expect(a.json.item.related.map((x: any) => x.ref)).toEqual(['FOC-3']);
		const b = await call('/items/FOC-3');
		expect(b.json.item.related.map((x: any) => x.ref)).toEqual(['FOC-2']);
		const e = await call('/items/FOC-1');
		expect(e.json.item.blocking.map((x: any) => x.ref)).toEqual(['FOC-2']);
		expect((await call('/items/FOC-2', 'PATCH', { related: ['FOC-2'] })).status).toBe(400);
		const md = await call('/items/FOC-1?format=md');
		expect(md.text).toContain('## Blocking (successors)');
	});
});

describe('comments and brief', () => {
	it('adds comments and renders a compact markdown brief', async () => {
		await seed();
		const c = await call('/items/FOC-2/comments', 'POST', { author: 'claude', body: 'WAITING: drag or buttons?' });
		expect(c.status).toBe(201);
		expect((await call('/items/FOC-2/comments', 'POST', { author: 'bot', body: 'x' })).status).toBe(400);
		const md = await call('/items/FOC-2?format=md');
		expect(md.type).toContain('text/markdown');
		expect(md.text).toContain('# FOC-2 — Board view');
		expect(md.text).toContain('Parent: FOC-1 [epic, backlog] Projects module');
		expect(md.text).toContain('1. Columns per status');
		expect(md.text).toContain('[claude] WAITING: drag or buttons?');
		const j = await call('/items/FOC-2');
		expect(j.json.item.comments).toHaveLength(1);
		expect(j.json.item.userId).toBeUndefined();
	});
});

describe('docs', () => {
	it('every route is described in spec and vice versa', async () => {
		const { ENDPOINTS } = await import('./lib/spec.js');
		const app = createApp(memoryStore(), () => 'secret');
		const router = app.locals.router as { stack: { route?: { path: string; methods: Record<string, boolean> } }[] };
		const actual = router.stack
			.filter((l) => l.route)
			.flatMap((l) => Object.keys(l.route!.methods).map((m) => `${m.toUpperCase()} ${l.route!.path}`))
			.sort();
		expect(ENDPOINTS.map((e) => `${e.method} ${e.path}`).sort()).toEqual(actual);
	});
	it('GET /docs returns markdown and versioned json', async () => {
		const md = await call('/docs');
		expect(md.type).toContain('text/markdown');
		expect(md.text).toContain('### PATCH /items/:ref');
		const j = await call('/docs?format=json');
		expect(j.json.version).toMatch(/^\d+\.\d+\.\d+$/);
		expect(j.json.hash).toHaveLength(12);
	});
});
