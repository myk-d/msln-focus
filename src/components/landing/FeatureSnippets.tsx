import { useTranslation } from 'react-i18next';
import { RoundCheck } from '../ui/RoundCheck';
import { StatusDot, StatusLabel } from '../projects/glyphs';
import { TimerPreview } from './ProductShot';
import type { WorkItemStatus } from '../../types';

// Small static illustrations for the landing feature cards, drawn with the app's own tokens and parts.
const snippetClass = 'flex flex-col gap-2 rounded-xl border border-border bg-surface p-3.5';

export function ListsSnippet() {
  const { t } = useTranslation();
  const rows: [string, boolean][] = [
    [t('welcome.shot.list1'), true],
    [t('welcome.shot.list2'), false],
    [t('welcome.shot.list3'), false],
  ];
  return (
    <div className={snippetClass} aria-hidden>
      {rows.map(([text, done]) => (
        <div key={text} className="flex items-center gap-2.5 text-sm">
          <RoundCheck done={done} className={done ? 'text-success' : 'text-border-strong'} />
          <span className={done ? 'text-muted line-through' : 'text-text'}>{text}</span>
        </div>
      ))}
      <div className="flex gap-1.5">
        <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-muted">#brand</span>
        <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">{t('welcome.shot.today')}</span>
      </div>
    </div>
  );
}

export function PomodoroSnippet() {
  const { t } = useTranslation();
  return (
    <div className={`${snippetClass} flex-row items-center gap-4`} aria-hidden>
      <TimerPreview size={84} label={t('pomodoro.focus')} />
      <div className="flex flex-col gap-1">
        <span className="font-mono text-sm font-semibold text-text">AXO-17</span>
        <span className="text-xs text-muted">{t('welcome.shot.preset')}</span>
      </div>
    </div>
  );
}

export function BoardSnippet() {
  const cols: [WorkItemStatus, string[]][] = [
    ['in-progress', ['var(--color-type-task)', 'var(--color-type-bug)']],
    ['in-review', ['var(--color-type-task)']],
    ['done', ['var(--color-type-story)']],
  ];
  return (
    <div className={`${snippetClass} flex-row gap-2`} aria-hidden>
      {cols.map(([status, stripes]) => (
        <div key={status} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <StatusDot status={status} />
            <StatusLabel status={status} className="truncate" />
          </div>
          {stripes.map((color, i) => (
            <div key={i} className="h-7 rounded-lg border border-border bg-bg" style={{ boxShadow: `inset 3px 0 0 ${color}` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CalendarSnippet() {
  const { t } = useTranslation();
  const heights = [34, 58, 22, 46, 30];
  return (
    <div className={`${snippetClass} grid grid-cols-5 gap-1.5`} aria-hidden>
      {t('welcome.shot.weekdays')
        .split(',')
        .map((day, i) => (
          <div key={day} className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">{day}</span>
            <div
              className={`rounded-md ${i === 1 ? 'bg-accent-soft shadow-[inset_3px_0_0_var(--color-accent)]' : 'bg-primary-soft shadow-[inset_3px_0_0_var(--color-primary)]'}`}
              style={{ height: heights[i] }}
            />
          </div>
        ))}
    </div>
  );
}
