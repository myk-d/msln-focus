import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '../ui/DatePicker';
import { RecurrencePicker } from '../ui/RecurrencePicker';
import { Switch } from '../ui/Switch';
import { useConfirm } from '../../context/ConfirmContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { inputClass } from '../../lib/ui';
import { TAG_COLOR_META, TAG_COLOR_ORDER, minutesToTime, timeToMinutes } from '../../lib/utils';
import type { CalendarEvent, RecurrenceRule, TagColor } from '../../types';

type RecurrenceScope = 'this' | 'all';

interface EventDetailDrawerProps {
  event: CalendarEvent | null;
  defaultDate: string;
  defaultStartTime?: string;
  onCreate: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>, scope: RecurrenceScope) => void;
  onDelete: (id: string, scope: RecurrenceScope) => void;
  onClose: () => void;
}

// One drawer handles both create (event=null) and edit to avoid a duplicate form.
export function EventDetailDrawer({
  event,
  defaultDate,
  defaultStartTime,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: EventDetailDrawerProps) {
  const { t } = useTranslation();
  const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
    { value: null, label: t('calendar.reminderNone') },
    { value: 5, label: t('calendar.reminder5') },
    { value: 15, label: t('calendar.reminder15') },
    { value: 30, label: t('calendar.reminder30') },
    { value: 60, label: t('calendar.reminder60') },
    { value: 1440, label: t('calendar.reminder1440') },
  ];
  const initialStart = event?.startTime ?? defaultStartTime ?? '09:00';
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [date, setDate] = useState(event?.date ?? defaultDate);
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(event?.endTime ?? minutesToTime(timeToMinutes(initialStart) + 60));
  const [location, setLocation] = useState(event?.location ?? '');
  const [color, setColor] = useState<TagColor>(event?.color ?? 'sky');
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(event?.reminderMinutes ?? 15);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(event?.recurrence ?? null);
  // Recurring events/occurrences default to editing just this one instance —
  // the safer, less-surprising choice — rather than silently rewriting the
  // whole series.
  const [scope, setScope] = useState<RecurrenceScope>('this');
  const [error, setError] = useState('');
  const confirm = useConfirm();
  useBodyScrollLock(true);

  // True for a series master (opened via a virtual occurrence, which carries
  // the master's `recurrence` along) or a standalone single-occurrence
  // override (`recurrenceMasterId` set) — either way, edits/deletes need a
  // this-occurrence-vs-whole-series scope choice.
  const isSeriesRelated = !!(event?.recurrence || event?.recurrenceMasterId);

  const [initial] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    date: event?.date ?? defaultDate,
    allDay: event?.allDay ?? false,
    startTime: initialStart,
    endTime: event?.endTime ?? minutesToTime(timeToMinutes(initialStart) + 60),
    location: event?.location ?? '',
    color: event?.color ?? 'sky',
    reminderMinutes: event?.reminderMinutes ?? 15,
    recurrence: event?.recurrence ?? null,
  });
  const isDirty =
    title !== initial.title ||
    description !== initial.description ||
    date !== initial.date ||
    allDay !== initial.allDay ||
    startTime !== initial.startTime ||
    endTime !== initial.endTime ||
    location !== initial.location ||
    color !== initial.color ||
    reminderMinutes !== initial.reminderMinutes ||
    JSON.stringify(recurrence) !== JSON.stringify(initial.recurrence);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('calendar.errorTitleRequired'));
      return;
    }
    if (!allDay && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError(t('calendar.errorEndAfterStart'));
      return;
    }
    if (!event) {
      onCreate({
        title: trimmedTitle,
        description,
        date,
        allDay,
        startTime,
        endTime,
        location,
        color,
        reminderMinutes,
        recurrence,
        recurrenceExceptions: [],
        recurrenceMasterId: null,
      });
      onClose();
      return;
    }
    const effectiveScope: RecurrenceScope = isSeriesRelated ? scope : 'this';

    // Clearing recurrence for the whole series cancels every future occurrence
    // it would otherwise have generated — a destructive action worth a
    // confirmation, unlike turning recurrence off on a plain event.
    if (effectiveScope === 'all' && event.recurrence && !recurrence) {
      const confirmed = await confirm({
        title: t('recurrence.stopRepeatingTitle'),
        message: t('recurrence.stopRepeatingMessage'),
        confirmLabel: t('recurrence.stopRepeatingConfirm'),
      });
      if (!confirmed) return;
    }

    onUpdate(
      event.id,
      {
        title: trimmedTitle,
        description,
        allDay,
        startTime,
        endTime,
        location,
        color,
        reminderMinutes,
        recurrence,
        // Applying "all events" shouldn't silently shift the series' anchor
        // date to whichever single occurrence happened to be open.
        ...(effectiveScope === 'all' ? {} : { date }),
      },
      effectiveScope
    );
    onClose();
  };

  const handleClose = async () => {
    if (
      !isDirty ||
      (await confirm({
        title: t('calendar.discardChangesTitle'),
        message: t('calendar.discardChangesMessage'),
        confirmLabel: t('calendar.discardChangesConfirm'),
        cancelLabel: t('calendar.discardChangesCancel'),
      }))
    ) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    const effectiveScope: RecurrenceScope = isSeriesRelated ? scope : 'this';
    const confirmTitle =
      effectiveScope === 'all' ? t('recurrence.deleteAllTitle', { name: event.title }) : t('calendar.deleteEventTitle', { name: event.title });
    if (await confirm({ title: confirmTitle, confirmLabel: t('tasks.delete') })) {
      onDelete(event.id, effectiveScope);
      onClose();
    }
  };

  return (
    <>
      <div onClick={handleClose} className="animate-fade-in fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" />
      <aside className="animate-slide-in-right fixed inset-y-0 right-0 z-40 flex h-full w-full flex-col overflow-y-auto border-l border-stone-200 bg-white px-5 py-6 md:w-100">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          {event ? t('calendar.event') : t('calendar.newEvent')}
        </h2>
        <div className="flex items-center gap-1">
          {event && (
            <button
              onClick={handleDelete}
              className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
              aria-label={t('calendar.deleteEventAria')}
            >
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={handleClose} className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>
      </div>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('calendar.eventTitlePlaceholder')}
        className={`${inputClass} mb-4 w-full text-base font-semibold`}
      />

      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('tasks.date')}</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <DatePicker value={date} onChange={(d) => setDate(d ?? defaultDate)} />
            {(!isSeriesRelated || scope === 'all') && (
              <RecurrencePicker value={recurrence} anchorDate={date} onChange={setRecurrence} />
            )}
          </div>
        </div>

        {isSeriesRelated && (
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('recurrence.applyTo')}</div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setScope('this')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  scope === 'this' ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {t('recurrence.scopeThis')}
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  scope === 'all' ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {t('recurrence.scopeAll')}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">{t('calendar.allDay')}</span>
          <Switch checked={allDay} onChange={setAllDay} />
        </div>

        {!allDay && (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <span className="text-stone-400">–</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`${inputClass} flex-1`}
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('calendar.location')}</div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('calendar.addLocationPlaceholder')}
            className={`${inputClass} w-full`}
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('calendar.color')}</div>
          <div className="flex items-center gap-2">
            {TAG_COLOR_ORDER.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ${TAG_COLOR_META[c].dot} ${
                  color === c ? 'ring-2 ring-offset-2 ring-stone-400' : ''
                }`}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('calendar.reminder')}</div>
          <select
            value={reminderMinutes ?? ''}
            onChange={(e) => setReminderMinutes(e.target.value === '' ? null : Number(e.target.value))}
            className={`${inputClass} w-full`}
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value ?? 'none'} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('tasks.description')}</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('tasks.descriptionPlaceholder')}
            rows={4}
            className={`${inputClass} w-full resize-none`}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {event ? t('calendar.save') : t('calendar.create')}
        </button>
      </div>
      </aside>
    </>
  );
}
