import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarToolbarProps {
  view: CalendarViewType;
  onSetView: (view: CalendarViewType) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

export function CalendarToolbar({ view, onSetView, title, onPrev, onNext, onToday, onAddEvent }: CalendarToolbarProps) {
  const { t } = useTranslation();
  const VIEW_OPTIONS: { value: CalendarViewType; label: string }[] = [
    { value: 'month', label: t('calendar.month') },
    { value: 'week', label: t('calendar.week') },
    { value: 'day', label: t('calendar.day') },
    { value: 'agenda', label: t('calendar.agenda') },
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold capitalize text-text">{title}</h1>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="rounded-full p-1.5 text-muted hover:bg-surface-sunken hover:text-text">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onToday}
            className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-muted hover:bg-surface-strong"
          >
            {t('calendar.today')}
          </button>
          <button onClick={onNext} className="rounded-full p-1.5 text-muted hover:bg-surface-sunken hover:text-text">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-full bg-surface-sunken p-0.5">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSetView(option.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${option.value === 'week' ? 'hidden md:inline-flex' : ''} ${
                view === option.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={onAddEvent}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus size={14} /> {t('calendar.addEvent')}
        </button>
      </div>
    </div>
  );
}
