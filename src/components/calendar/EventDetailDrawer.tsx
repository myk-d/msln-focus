import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import { Switch } from '../ui/Switch';
import { useConfirm } from '../../context/ConfirmContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { inputClass } from '../../lib/ui';
import { TAG_COLOR_META, TAG_COLOR_ORDER, minutesToTime, timeToMinutes } from '../../lib/utils';
import type { CalendarEvent, TagColor } from '../../types';

const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Без нагадування' },
  { value: 5, label: 'За 5 хвилин' },
  { value: 15, label: 'За 15 хвилин' },
  { value: 30, label: 'За 30 хвилин' },
  { value: 60, label: 'За 1 годину' },
  { value: 1440, label: 'За 1 день' },
];

interface EventDetailDrawerProps {
  event: CalendarEvent | null;
  defaultDate: string;
  defaultStartTime?: string;
  onCreate: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
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
  const [error, setError] = useState('');
  const confirm = useConfirm();
  useBodyScrollLock(true);

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
    reminderMinutes !== initial.reminderMinutes;

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Введіть назву події');
      return;
    }
    if (!allDay && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('Час завершення має бути пізніше часу початку');
      return;
    }
    const payload = { title: trimmedTitle, description, date, allDay, startTime, endTime, location, color, reminderMinutes };
    if (event) onUpdate(event.id, payload);
    else onCreate(payload);
    onClose();
  };

  const handleClose = async () => {
    if (
      !isDirty ||
      (await confirm({
        title: 'Закрити без збереження?',
        message: 'У вас є незбережені зміни, які буде втрачено.',
        confirmLabel: 'Закрити',
        cancelLabel: 'Продовжити редагування',
      }))
    ) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (
      await confirm({
        title: `Видалити подію «${event.title}»?`,
        confirmLabel: 'Видалити',
      })
    ) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <>
      <div onClick={handleClose} className="animate-fade-in fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" />
      <aside className="animate-slide-in-right fixed inset-y-0 right-0 z-40 flex h-full w-full flex-col overflow-y-auto border-l border-stone-200 bg-white px-5 py-6 md:w-100">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          {event ? 'Подія' : 'Нова подія'}
        </h2>
        <div className="flex items-center gap-1">
          {event && (
            <button
              onClick={handleDelete}
              className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Видалити подію"
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
        placeholder="Назва події"
        className={`${inputClass} mb-4 w-full text-base font-semibold`}
      />

      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Дата</div>
          <DatePicker value={date} onChange={(d) => setDate(d ?? defaultDate)} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">Увесь день</span>
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
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Місце</div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Додати місце"
            className={`${inputClass} w-full`}
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Колір</div>
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
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Нагадування</div>
          <select
            value={reminderMinutes ?? ''}
            onChange={(e) => setReminderMinutes(e.target.value === '' ? null : Number(e.target.value))}
            className={`${inputClass} w-full`}
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Опис</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Додати опис..."
            rows={4}
            className={`${inputClass} w-full resize-none`}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {event ? 'Зберегти' : 'Створити'}
        </button>
      </div>
      </aside>
    </>
  );
}
