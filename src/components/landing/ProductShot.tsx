import { useTranslation } from 'react-i18next';
import { ItemCard } from '../projects/ItemCard';
import { StatusDot } from '../projects/glyphs';
import type { Assignee, Project, WorkItem, WorkItemStatus, WorkItemType } from '../../types';

// Sample data for the landing page only: rendered through the real ItemCard so the shot
// always matches the app. Never persisted, never sent anywhere.
const PROJECT: Project = { id: 'demo', userId: 'demo', key: 'AXO', name: 'Axo', repo: null, defaultBranch: 'main', nextNumber: 30, createdAt: 0, updatedAt: 0 };

function sampleItem(number: number, type: WorkItemType, status: WorkItemStatus, title: string, assignee: Assignee, extra: Partial<WorkItem> = {}): WorkItem {
  return {
    id: `demo-${number}`,
    userId: 'demo',
    projectId: 'demo',
    number,
    type,
    status,
    title,
    description: '',
    acceptanceCriteria: [],
    reproSteps: '',
    priority: 'none',
    parentId: null,
    blockedBy: [],
    related: [],
    assignee,
    severity: null,
    labels: [],
    branch: null,
    prUrl: null,
    order: number,
    createdAt: 0,
    updatedAt: 0,
    ...extra,
  };
}

const noop = () => {};

// Static timer in the Pomodoro card's style (the real timer needs the signed-in Pomodoro context).
export function TimerPreview({ size = 130, digits = '12:40', progress = 0.49, label }: { size?: number; digits?: string; progress?: number; label: string }) {
  const stroke = size > 100 ? 8 : 6;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">{label}</span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-sunken" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" className="stroke-phase-focus" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono font-semibold tabular-nums text-text" style={{ fontSize: size * 0.2 }}>
          {digits}
        </span>
      </div>
    </div>
  );
}

export function ProductShot() {
  const { t } = useTranslation();
  const t1 = sampleItem(17, 'task', 'in-progress', t('welcome.shot.task1'), 'claude', { labels: ['brand'] });
  const t2 = sampleItem(15, 'bug', 'in-progress', t('welcome.shot.task2'), 'me', { severity: '1-critical' });
  const t3 = sampleItem(16, 'task', 'in-review', t('welcome.shot.task3'), 'antigravity', { prUrl: 'https://example.invalid' });
  const columns: [WorkItemStatus, string, WorkItem[]][] = [
    ['in-progress', t('welcome.shot.inProgress'), [t1, t2]],
    ['in-review', t('welcome.shot.inReview'), [t3]],
  ];

  // Decorative: hidden from assistive tech and not focusable (the cards are real buttons).
  return (
    <div className="relative pb-10 pr-0 md:pr-10" aria-hidden inert>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgb(0_0_0/0.08)]">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-border-strong" />
          <span className="h-2 w-2 rounded-full bg-border-strong" />
          <span className="h-2 w-2 rounded-full bg-border-strong" />
          <span className="ml-2 font-mono text-xs text-muted">axo · AXO</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {columns.map(([status, label, items], i) => (
            <div key={status} className={`flex flex-col gap-2.5 ${i > 0 ? 'hidden sm:flex' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-text">
                <StatusDot status={status} />
                {label}
              </div>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} project={PROJECT} allItems={[t1, t2, t3]} onSelect={noop} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 rounded-2xl border border-border-strong bg-surface-raised p-4 shadow-[0_12px_32px_rgb(0_0_0/0.12)]">
        <TimerPreview size={110} label={t('pomodoro.focus')} />
        <div className="mt-1 text-center font-mono text-xs text-muted">AXO-17</div>
      </div>
    </div>
  );
}
