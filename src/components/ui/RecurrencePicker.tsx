import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Repeat, X } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { DatePicker } from './DatePicker';
import { popoverClass } from '../../lib/ui';
import { RECURRENCE_FREQ_META, RECURRENCE_FREQ_ORDER, WEEKDAY_ORDER } from '../../lib/utils';
import type { RecurrenceFreq, RecurrenceRule } from '../../types';

interface RecurrencePickerProps {
  value: RecurrenceRule | null;
  anchorDate: string | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

type EndMode = 'never' | 'onDate' | 'afterCount';

function endModeOf(rule: RecurrenceRule): EndMode {
  if (rule.count) return 'afterCount';
  if (rule.endDate) return 'onDate';
  return 'never';
}

export function RecurrencePicker({ value, anchorDate, onChange }: RecurrencePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const weekdayLabels = [
    t('datePicker.mon'),
    t('datePicker.tue'),
    t('datePicker.wed'),
    t('datePicker.thu'),
    t('datePicker.fri'),
    t('datePicker.sat'),
    t('datePicker.sun'),
  ];

  const summary = value
    ? value.interval === 1
      ? t(RECURRENCE_FREQ_META[value.freq].labelKey)
      : `${t('recurrence.every')} ${value.interval} ${t(RECURRENCE_FREQ_META[value.freq].unitLabelKey)}`
    : t('recurrence.none');

  const setFreq = (freq: RecurrenceFreq) => {
    onChange({ freq, interval: 1, byWeekday: null, endDate: null, count: null });
  };

  const patchRule = (patch: Partial<RecurrenceRule>) => {
    if (!value) return;
    onChange({ ...value, ...patch });
  };

  const toggleWeekday = (day: number) => {
    if (!value || !anchorDate) return;
    const current = value.byWeekday && value.byWeekday.length > 0 ? value.byWeekday : [dayjs(anchorDate).day()];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    patchRule({ byWeekday: next.length > 0 ? next : [dayjs(anchorDate).day()] });
  };

  const setEndMode = (mode: EndMode) => {
    if (mode === 'never') patchRule({ endDate: null, count: null });
    if (mode === 'onDate') patchRule({ endDate: anchorDate ?? dayjs().format('YYYY-MM-DD'), count: null });
    if (mode === 'afterCount') patchRule({ endDate: null, count: 5 });
  };

  // Recurrence needs a date to anchor its interval/weekday math to — hidden
  // entirely (not just disabled) until one is picked, rather than showing a
  // grayed-out control that reads as broken.
  if (!anchorDate) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
          value ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
        }`}
      >
        <Repeat size={13} />
        {summary}
        {value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="rounded-full p-0.5 hover:bg-stone-300/50"
          >
            <X size={11} />
          </span>
        )}
      </button>

      {open && (
        <div className={`${popoverClass} absolute left-0 top-9 z-30 w-72 p-3 text-sm`}>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChange(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                !value ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {t('recurrence.none')}
            </button>
            {RECURRENCE_FREQ_ORDER.map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setFreq(freq)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  value?.freq === freq ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {t(RECURRENCE_FREQ_META[freq].labelKey)}
              </button>
            ))}
          </div>

          {value && (
            <>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-xs text-stone-400">{t('recurrence.every')}</span>
                <input
                  type="number"
                  min={1}
                  value={value.interval}
                  onChange={(e) => patchRule({ interval: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-14 rounded-lg border border-stone-200 px-1.5 py-1 text-xs outline-none focus:border-brand-400"
                />
                <span className="text-xs text-stone-400">{t(RECURRENCE_FREQ_META[value.freq].unitLabelKey)}</span>
              </div>

              {value.freq === 'weekly' && (
                <div className="mb-3 flex gap-1">
                  {WEEKDAY_ORDER.map((day, i) => {
                    const selected = value.byWeekday && value.byWeekday.length > 0 ? value.byWeekday : [dayjs(anchorDate).day()];
                    const isSelected = selected.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {weekdayLabels[i][0]}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-stone-100 pt-2">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {t('recurrence.ends')}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-xs text-stone-600">
                    <input
                      type="radio"
                      checked={endModeOf(value) === 'never'}
                      onChange={() => setEndMode('never')}
                    />
                    {t('recurrence.endsNever')}
                  </label>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-xs text-stone-600">
                      <input
                        type="radio"
                        checked={endModeOf(value) === 'onDate'}
                        onChange={() => setEndMode('onDate')}
                      />
                      {t('recurrence.endsOnDate')}
                    </label>
                    {endModeOf(value) === 'onDate' && (
                      <DatePicker value={value.endDate} onChange={(d) => patchRule({ endDate: d ?? anchorDate })} />
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-stone-600">
                    <input
                      type="radio"
                      checked={endModeOf(value) === 'afterCount'}
                      onChange={() => setEndMode('afterCount')}
                    />
                    {t('recurrence.endsAfter')}
                    {endModeOf(value) === 'afterCount' && (
                      <>
                        <input
                          type="number"
                          min={1}
                          value={value.count ?? 5}
                          onChange={(e) => patchRule({ count: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-14 rounded-lg border border-stone-200 px-1.5 py-1 text-xs outline-none focus:border-brand-400"
                        />
                        {t('recurrence.times')}
                      </>
                    )}
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
