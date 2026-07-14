import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { usePomodoroContext } from '../context/PomodoroContext';
import { getFocusMinutesHistory, getTasksByPriority, getTasksByTag, getTasksCompletedHistory } from '../lib/utils';
import type { Priority, TagColor } from '../types';

const TREND_DAYS = 14;
const MAX_TAGS_SHOWN = 8;

// Recharts needs raw color values, not Tailwind classes — these mirror the
// exact shades PRIORITY_META/TAG_COLOR_META use elsewhere in the app, so the
// charts stay visually consistent with the flag icons/tag pills.
const BRAND_HEX = '#e1552f'; // brand-500
const PRIORITY_HEX: Record<Priority, string> = {
  high: '#ef4444', // red-500
  medium: '#f59e0b', // amber-500
  low: '#3b82f6', // blue-500
  none: '#a8a29e', // stone-400
};
const TAG_HEX: Record<TagColor, string> = {
  rose: '#f43f5e',
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  stone: '#a8a29e',
};

const tooltipContentStyle = {
  borderRadius: 12,
  border: '1px solid #e7e5e4',
  fontSize: 12,
  padding: '6px 10px',
};

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-700">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="flex h-40 items-center justify-center text-sm text-stone-400">{message}</p>;
}

export function StatsPage() {
  const { t } = useTranslation();
  const { tasks, tags } = useTaskStoreContext();
  const { stats } = usePomodoroContext();

  const focusHistory = getFocusMinutesHistory(stats, TREND_DAYS);
  const completedHistory = getTasksCompletedHistory(tasks, TREND_DAYS);
  const byPriority = getTasksByPriority(tasks);
  const byTag = getTasksByTag(tasks, tags).slice(0, MAX_TAGS_SHOWN);

  const hasFocusHistory = focusHistory.some((d) => d.value > 0);
  const hasCompletedHistory = completedHistory.some((d) => d.value > 0);

  return (
    <div className="h-full overflow-y-auto px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900">{t('stats.heading')}</h1>
          <p className="mt-1 text-sm text-stone-500">{t('stats.subheading')}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-center">
          <div>
            <div className="text-lg font-bold text-stone-800">
              {stats.totalFocusMinutes} {t('pomodoro.minutesSuffix')}
            </div>
            <div className="text-xs text-stone-400">{t('pomodoro.totalFocusMinutes')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-stone-800">{stats.totalSessions}</div>
            <div className="text-xs text-stone-400">{t('pomodoro.totalSessions')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-stone-800">{tasks.filter((task) => task.completed).length}</div>
            <div className="text-xs text-stone-400">{t('stats.totalTasksCompleted')}</div>
          </div>
        </div>

        <ChartCard title={t('stats.focusMinutesTitle', { count: TREND_DAYS })}>
          {hasFocusHistory ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={focusHistory} margin={{ left: -20 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#a8a29e" />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={tooltipContentStyle}
                  formatter={(value) => [`${value} ${t('pomodoro.minutesSuffix')}`, t('stats.focusMinutes')]}
                />
                <Bar dataKey="value" fill={BRAND_HEX} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t('stats.noDataYet')} />
          )}
        </ChartCard>

        <ChartCard title={t('stats.tasksCompletedTitle', { count: TREND_DAYS })}>
          {hasCompletedHistory ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completedHistory} margin={{ left: -20 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#a8a29e" />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={tooltipContentStyle}
                  formatter={(value) => [String(value), t('stats.tasksCompleted')]}
                />
                <Bar dataKey="value" fill={BRAND_HEX} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t('stats.noDataYet')} />
          )}
        </ChartCard>

        <div className="grid gap-6 sm:grid-cols-2">
          <ChartCard title={t('stats.byPriorityTitle')}>
            {byPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(80, byPriority.length * 40)}>
                <BarChart data={byPriority} layout="vertical" margin={{ right: 24 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={70} tickLine={false} axisLine={false} fontSize={12} stroke="#57534e" />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={tooltipContentStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {byPriority.map((point) => (
                      <Cell key={point.key} fill={PRIORITY_HEX[point.key as Priority]} />
                    ))}
                    <LabelList dataKey="value" position="right" fontSize={12} fill="#57534e" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={t('stats.noDataYet')} />
            )}
          </ChartCard>

          <ChartCard title={t('stats.byTagTitle')}>
            {byTag.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(80, byTag.length * 40)}>
                <BarChart data={byTag} layout="vertical" margin={{ right: 24 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={70} tickLine={false} axisLine={false} fontSize={12} stroke="#57534e" />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={tooltipContentStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {byTag.map((point) => (
                      <Cell key={point.key} fill={TAG_HEX[point.color]} />
                    ))}
                    <LabelList dataKey="value" position="right" fontSize={12} fill="#57534e" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={t('stats.noDataYet')} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
