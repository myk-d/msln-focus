import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ASSIGNEE_META, ASSIGNEE_ORDER, TYPE_META, TYPE_ORDER, activeFilterCount, hasActiveFilters, itemRef, type ItemFilters } from '../../lib/projects';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { popoverClass } from '../../lib/ui';
import type { Assignee, Project, WorkItem, WorkItemType } from '../../types';

interface ProjectToolbarProps {
  project: Project;
  // Epics offered in the epic filter (already narrowed by the caller).
  epics: WorkItem[];
  filters: ItemFilters;
  onChange: (next: ItemFilters) => void;
  onClear: () => void;
  showCancelled: boolean;
  onToggleCancelled: () => void;
}

const selectClass = 'rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 outline-none focus:border-brand-400';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function ProjectToolbar({ project, epics, filters, onChange, onClear, showCancelled, onToggleCancelled }: ProjectToolbarProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(popoverRef, () => setOpen(false));

  // "/" focuses the search unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const count = activeFilterCount(filters);

  const selects = (
    <>
      <select value={filters.type ?? ''} onChange={(e) => onChange({ ...filters, type: (e.target.value || null) as WorkItemType | null })} className={selectClass} aria-label={t('projects.filter.type')}>
        <option value="">{t('projects.filter.type')}: {t('projects.filter.all')}</option>
        {TYPE_ORDER.map((type) => (
          <option key={type} value={type}>
            {t(TYPE_META[type].labelKey)}
          </option>
        ))}
      </select>
      <select
        value={filters.assignee ?? ''}
        onChange={(e) => onChange({ ...filters, assignee: (e.target.value || null) as ItemFilters['assignee'] })}
        className={selectClass}
        aria-label={t('projects.filter.assignee')}
      >
        <option value="">{t('projects.filter.assignee')}: {t('projects.filter.all')}</option>
        {ASSIGNEE_ORDER.map((a: Assignee) => (
          <option key={a} value={a}>
            {t(ASSIGNEE_META[a].labelKey)}
          </option>
        ))}
        <option value="unassigned">{t('projects.filter.unassigned')}</option>
      </select>
      <select value={filters.epicId ?? ''} onChange={(e) => onChange({ ...filters, epicId: e.target.value || null })} className={`${selectClass} max-w-48`} aria-label={t('projects.filter.epic')}>
        <option value="">{t('projects.filter.epic')}: {t('projects.filter.all')}</option>
        {epics.map((epic) => (
          <option key={epic.id} value={epic.id}>
            {itemRef(project, epic)} {epic.title}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <div className="relative flex w-full flex-wrap items-center gap-2 md:w-auto">
      <div className="relative w-full md:w-auto">
        <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          ref={searchRef}
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onChange({ ...filters, query: '' });
              e.currentTarget.blur();
            }
          }}
          placeholder={t(isDesktop ? 'projects.search.placeholder' : 'projects.search.placeholderShort')}
          aria-label={t('projects.search.label')}
          className="w-full rounded-lg md:w-44 border border-stone-200 bg-white py-1 pl-7 pr-2 text-xs outline-none focus:border-brand-400"
        />
      </div>
      {isDesktop ? (
        selects
      ) : (
        <div ref={popoverRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-600"
          >
            <SlidersHorizontal size={13} />
            {t('projects.filter.filters')}
            {count > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{count}</span>}
          </button>
          {open && <div className={`${popoverClass} absolute left-0 top-full z-40 mt-1 flex w-60 max-w-full flex-col gap-2 p-3`}>{selects}</div>}
        </div>
      )}
      {hasActiveFilters(filters) && (
        <button onClick={onClear} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-700 hover:bg-brand-50">
          <X size={12} />
          {t('projects.filter.clear')}
        </button>
      )}
      <button onClick={onToggleCancelled} className="rounded-full px-2.5 py-1 text-xs text-stone-500 transition hover:bg-stone-100">
        {showCancelled ? t('projects.hideCancelled') : t('projects.showCancelled')}
      </button>
    </div>
  );
}
