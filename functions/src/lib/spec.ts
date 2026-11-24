import { createHash } from 'node:crypto';
import { ASSIGNEES, AUTHORS, ITEM_STATUSES, ITEM_TYPES, PRIORITIES, SEVERITIES } from './schema.js';

/**
 * Єдине джерело правди для опису API. З нього генерується GET /docs (markdown і JSON),
 * а тест перевіряє, що кожен маршрут Express описаний тут і навпаки.
 * Змінили API — оновіть цей файл і підніміть API_VERSION.
 */
export const API_VERSION = '1.2.0';

export interface Endpoint {
	method: 'GET' | 'POST' | 'PATCH';
	path: string;
	summary: string;
	query?: Record<string, string>;
	body?: string;
	response?: string;
	notes?: string[];
}

export const ENDPOINTS: Endpoint[] = [
	{ method: 'GET', path: '/health', summary: 'Liveness and key check.', response: '{ "ok": true }' },
	{ method: 'GET', path: '/docs', summary: 'This documentation.', query: { format: '`md` (default) or `json`' }, notes: ['JSON has `version` and `hash` — a skill compares them to know the API changed.'] },
	{ method: 'GET', path: '/projects', summary: 'All projects.', response: '{ "projects": [ { "key": "FOC", "name": "...", "repo": "...", "defaultBranch": "main" } ] }' },
	{
		method: 'POST',
		path: '/projects',
		summary: 'Create a project.',
		body: '{ "key": "FOC", "name": "Focus", "repo": "https://github.com/me/msln-focus", "defaultBranch": "main" }',
		response: '201 { "project": { ... } }',
		notes: ['`key`: 2–10 chars, A–Z/0–9, unique. 409 if it exists.'],
	},
	{ method: 'GET', path: '/projects/:key', summary: 'A project with item counts per status.', response: '{ "project": { ... }, "counts": { "todo": 3, ... } }' },
	{
		method: 'GET',
		path: '/items',
		summary: 'Items, sorted by status → priority → manual order.',
		query: { project: 'project key', status: 'comma-separated statuses', type: 'comma-separated types', assignee: '`me`, `claude` or `antigravity`', parent: 'parent ref, e.g. `FOC-3`', limit: 'default 100, max 500' },
		response: '{ "count": 1, "items": [ { "ref": "FOC-12", "type": "story", "title": "...", "status": "todo", "priority": "high" } ] }',
	},
	{
		method: 'GET',
		path: '/next',
		summary: 'What to work on next: `todo` items, not epics, with every blocker done or cancelled; by priority then order.',
		query: { project: 'project key (optional)', limit: 'default 5' },
		response: '{ "items": [ { "ref", "type", "title", "status", "priority" } ] }',
	},
	{
		method: 'POST',
		path: '/items',
		summary: 'Create an item. The number is assigned atomically per project.',
		body: '{ "project": "FOC", "type": "bug", "title": "Timer resets on tab switch", "reproSteps": "1. ...", "priority": "high", "parent": "FOC-3", "labels": ["pomodoro"] }',
		response: '201 { "item": { "ref": "FOC-13", ... } }',
		notes: ['Required: `project`, `type`, `title`. Defaults: status `backlog`, priority `none`, assignee and severity `null`.', '`parent`, `blockedBy` (predecessors) and `related` take refs; unknown refs → 400.', 'Parent type must fit the hierarchy: an epic has no parent, a story\'s parent is an epic, a task or bug\'s parent is a story or an epic; otherwise 400.', '`severity` is kept only for bugs.'],
	},
	{
		method: 'GET',
		path: '/items/:ref',
		summary: 'One item with parent, children, predecessors (`blockedBy`), successors (`blocking`), related items (both directions) and the last 20 comments.',
		query: { format: '`json` (default) or `md` — a compact brief for agents' },
		response: '{ "item": { "ref": "FOC-12", ..., "parent": {...}, "children": [...], "blockedBy": [...], "comments": [...] } }',
	},
	{
		method: 'PATCH',
		path: '/items/:ref',
		summary: 'Update item fields.',
		body: '{ "status": "in-progress", "assignee": "claude", "branch": "md/FOC-12-timer-fix" }',
		response: '{ "item": { ... } }',
		notes: [
			'Fields: `type`, `status`, `title`, `description` (markdown), `acceptanceCriteria`, `reproSteps` (markdown), `priority`, `severity`, `assignee`, `parent`, `blockedBy`, `related`, `labels`, `branch`, `prUrl`, `order`. Others → 400.',
			'Arrays replace the stored value. `parent: null` detaches.', 'When `parent` or `type` changes, the parent type is checked as in POST /items (400 if it does not fit).',
		],
	},
	{
		method: 'POST',
		path: '/items/:ref/comments',
		summary: 'Add a comment (decisions, summaries, questions).',
		body: '{ "author": "claude", "body": "WAITING: should the timer pause or reset?" }',
		response: '201 { "comment": { ... } }',
	},
];

export const WORKFLOW = [
	'Start of `/task <ref>`: `GET /items/<ref>?format=md` — the brief is the whole context; read JSON only when you need ids or exact fields.',
	'After the user confirms the plan: `PATCH` `{ "status": "in-progress", "assignee": "<claude|antigravity>", "branch": "<branch>" }`. Taking over from another tool: set `assignee` to yourself.',
	'Waiting for the user on a question: also post it as a comment starting with `WAITING:`.',
	'After `/pr`: `PATCH` `{ "status": "in-review", "prUrl": "<url>" }` and a short summary comment.',
	'`done` is set only when the user says the PR is merged.',
	'Filing a new bug/story from chat: `POST /items` with `project` and `type`, and show the user the returned ref.',
];

export const toJson = (baseUrl: string) => {
	const body = {
		version: API_VERSION,
		baseUrl,
		auth: 'Header `x-api-key` (or `Authorization: Bearer`)',
		enums: { type: ITEM_TYPES, status: ITEM_STATUSES, priority: PRIORITIES, severity: SEVERITIES, assignee: ASSIGNEES, author: AUTHORS },
		workflow: WORKFLOW,
		endpoints: ENDPOINTS,
	};
	const hash = createHash('sha256').update(JSON.stringify({ ...body, baseUrl: '' })).digest('hex').slice(0, 12);
	return { ...body, hash };
};

export const toMarkdown = (baseUrl: string) => {
	const j = toJson(baseUrl);
	const list = (xs: readonly string[]) => xs.map((x) => `\`${x}\``).join(', ');
	const lines = [
		`# Focus tracker API v${j.version} (hash ${j.hash})`,
		'',
		`Base URL: \`${baseUrl}\``,
		'Every request: header `x-api-key: <FOCUS_API_KEY>`, JSON body. Errors: 401 key, 400 validation (`issues`), 404 not found, 409 conflict.',
		'Items are addressed by ref: `<PROJECT KEY>-<number>`, e.g. `FOC-12`.',
		'',
		'## Workflow for agents',
		...WORKFLOW.map((w, i) => `${i + 1}. ${w}`),
		'',
		'## Values',
		`- type: ${list(ITEM_TYPES)}`,
		`- status: ${list(ITEM_STATUSES)}`,
		`- priority: ${list(PRIORITIES)}`,
		`- severity (bugs): ${list(SEVERITIES)}`,
		`- assignee: ${list(ASSIGNEES)}`,
		`- comment author: ${list(AUTHORS)}`,
		'',
		'## Endpoints',
	];
	for (const e of ENDPOINTS) {
		lines.push('', `### ${e.method} ${e.path}`, e.summary);
		if (e.query) lines.push('', 'Query:', ...Object.entries(e.query).map(([k, v]) => `- \`${k}\` — ${v}`));
		if (e.body) lines.push('', 'Body:', '```json', e.body, '```');
		if (e.response) lines.push('', `Response: \`${e.response}\``);
		if (e.notes) lines.push('', ...e.notes.map((n) => `- ${n}`));
	}
	return lines.join('\n') + '\n';
};
