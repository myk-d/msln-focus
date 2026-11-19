import { z } from 'zod';

export const ITEM_TYPES = ['epic', 'story', 'task', 'bug'] as const;
export const ITEM_STATUSES = ['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled'] as const;
export const PRIORITIES = ['none', 'low', 'medium', 'high'] as const;
export const AUTHORS = ['me', 'claude', 'antigravity'] as const;
export const ASSIGNEES = AUTHORS;
/** Як у ADO: 1 — Critical … 4 — Low. Лише для багів. */
export const SEVERITIES = ['1-critical', '2-high', '3-medium', '4-low'] as const;

export type ItemType = (typeof ITEM_TYPES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Author = (typeof AUTHORS)[number];
export type Assignee = (typeof ASSIGNEES)[number];
export type Severity = (typeof SEVERITIES)[number];

/** Посилання на задачу: ключ проекту + номер, напр. FOC-12. */
export const REF_RE = /^([A-Z][A-Z0-9]{1,9})-(\d+)$/;
export const parseRef = (ref: string) => {
	const m = REF_RE.exec(ref.trim().toUpperCase());
	return m ? { key: m[1], number: Number(m[2]) } : null;
};

const str = (max: number) => z.string().trim().max(max);
const ref = z
	.string()
	.trim()
	.transform((s) => s.toUpperCase())
	.refine((s) => REF_RE.test(s), 'expected a reference like FOC-12');
const csvList = <T extends readonly [string, ...string[]]>(values: T) =>
	z
		.string()
		.optional()
		.transform((s) => (s ? s.split(',').map((v) => v.trim()).filter(Boolean) : []))
		.pipe(z.array(z.enum(values)));

export const projectInput = z
	.object({
		key: z
			.string()
			.trim()
			.transform((s) => s.toUpperCase())
			.refine((s) => /^[A-Z][A-Z0-9]{1,9}$/.test(s), 'key: 2–10 chars, A–Z/0–9, starts with a letter'),
		name: str(120).min(1),
		repo: str(300).url().optional(),
		defaultBranch: str(100).min(1).default('main'),
	})
	.strict();

const itemFields = {
	type: z.enum(ITEM_TYPES),
	status: z.enum(ITEM_STATUSES),
	title: str(300).min(1),
	description: str(20_000),
	acceptanceCriteria: z.array(str(2000).min(1)).max(50),
	reproSteps: str(10_000),
	priority: z.enum(PRIORITIES),
	parent: ref.nullable(),
	blockedBy: z.array(ref).max(50),
	related: z.array(ref).max(50),
	assignee: z.enum(ASSIGNEES).nullable(),
	severity: z.enum(SEVERITIES).nullable(),
	labels: z.array(str(60).min(1)).max(30),
	branch: str(200).nullable(),
	prUrl: str(500).url().nullable(),
	order: z.number().finite(),
};

export const itemCreate = z
	.object({
		project: str(10).min(2),
		type: itemFields.type,
		title: itemFields.title,
		status: itemFields.status.default('backlog'),
		description: itemFields.description.default(''),
		acceptanceCriteria: itemFields.acceptanceCriteria.default([]),
		reproSteps: itemFields.reproSteps.default(''),
		priority: itemFields.priority.default('none'),
		parent: itemFields.parent.default(null),
		blockedBy: itemFields.blockedBy.default([]),
		related: itemFields.related.default([]),
		assignee: itemFields.assignee.default(null),
		severity: itemFields.severity.default(null),
		labels: itemFields.labels.default([]),
	})
	.strict();
export type ItemCreate = z.infer<typeof itemCreate>;

export const itemPatch = z.object(itemFields).partial().strict().refine((p) => Object.keys(p).length > 0, 'empty patch');
export type ItemPatch = z.infer<typeof itemPatch>;

export const commentInput = z.object({ author: z.enum(AUTHORS).default('me'), body: str(10_000).min(1) }).strict();

export const itemQuery = z.object({
	project: str(10).optional(),
	assignee: z.enum(ASSIGNEES).optional(),
	status: csvList(ITEM_STATUSES),
	type: csvList(ITEM_TYPES),
	parent: ref.optional(),
	limit: z.coerce.number().int().min(1).max(500).default(100),
});
