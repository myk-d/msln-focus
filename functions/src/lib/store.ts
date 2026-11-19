import type { Assignee, Author, ItemCreate, ItemPatch, ItemStatus, ItemType, Priority, Severity } from './schema.js';

/** Документи у Firestore. Поле `userId` — як в усіх інших колекціях застосунку: так їх бачить UI. */
export interface Project {
	id: string;
	userId: string;
	key: string;
	name: string;
	repo: string | null;
	defaultBranch: string;
	nextNumber: number;
	createdAt: number;
	updatedAt: number;
}

export interface WorkItem {
	id: string;
	userId: string;
	projectId: string;
	number: number;
	type: ItemType;
	status: ItemStatus;
	title: string;
	description: string;
	acceptanceCriteria: string[];
	reproSteps: string;
	priority: Priority;
	parentId: string | null;
	blockedBy: string[]; // id задач-попередників (Predecessor у ADO)
	related: string[]; // id пов'язаних задач (Related у ADO; зворотний бік обчислюється)
	assignee: Assignee | null;
	severity: Severity | null;
	labels: string[];
	branch: string | null;
	prUrl: string | null;
	order: number;
	createdAt: number;
	updatedAt: number;
}

export interface Comment {
	id: string;
	userId: string;
	itemId: string;
	author: Author;
	body: string;
	createdAt: number;
}

export interface ItemFilter {
	projectId?: string;
	status?: ItemStatus[];
	type?: ItemType[];
	parentId?: string;
	assignee?: Assignee;
}

/** Внутрішнє представлення змін: посилання (FOC-12) вже перетворені на id. */
export type ItemChanges = Omit<ItemPatch, 'parent' | 'blockedBy' | 'related'> & { parentId?: string | null; blockedBy?: string[]; related?: string[] };
export type NewItem = Omit<ItemCreate, 'project' | 'parent' | 'blockedBy' | 'related'> & { parentId: string | null; blockedBy: string[]; related: string[] };

/**
 * Шар доступу до даних. Firestore-реалізація — firestore-store.ts, у тестах — memory-store.ts.
 * Усі методи працюють лише з даними власника (uid задається при створенні).
 */
export interface Store {
	listProjects(): Promise<Project[]>;
	getProjectByKey(key: string): Promise<Project | null>;
	createProject(p: Pick<Project, 'key' | 'name' | 'repo' | 'defaultBranch'>): Promise<Project>;
	listItems(filter: ItemFilter): Promise<WorkItem[]>;
	getItem(id: string): Promise<WorkItem | null>;
	getItemByNumber(projectId: string, number: number): Promise<WorkItem | null>;
	getItems(ids: string[]): Promise<WorkItem[]>;
	/** Задачі, що посилаються на id у полі `blockedBy` або `related` (зворотні зв'язки). */
	listReferencing(field: 'blockedBy' | 'related', id: string): Promise<WorkItem[]>;
	/** Атомарно бере project.nextNumber і створює задачу. */
	createItem(projectId: string, item: NewItem): Promise<WorkItem>;
	updateItem(id: string, changes: ItemChanges): Promise<WorkItem>;
	addComment(itemId: string, author: Author, body: string): Promise<Comment>;
	listComments(itemId: string, limit: number): Promise<Comment[]>;
	projectById(id: string): Promise<Project | null>;
}

/** Документи, створені до появи нових полів, отримують значення за замовчуванням (міграцій немає). */
export const normalizeItem = (i: WorkItem): WorkItem => ({
	...i,
	blockedBy: i.blockedBy ?? [],
	related: i.related ?? [],
	labels: i.labels ?? [],
	acceptanceCriteria: i.acceptanceCriteria ?? [],
	assignee: i.assignee ?? null,
	severity: i.severity ?? null,
});
