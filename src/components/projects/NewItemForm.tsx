import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { TYPE_META, cleanTitle, itemRef, parentCandidates, validParentTypes } from '../../lib/projects';
import { inputClass, popoverClass } from '../../lib/ui';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { Project, WorkItem, WorkItemStatus, WorkItemType } from '../../types';
import type { NewItemInput } from '../../hooks/useProjectsStore';

interface NewItemFormProps {
  project: Project;
  // Every item of the project: parent candidates are derived from it on each render.
  items: WorkItem[];
  allowedTypes: WorkItemType[];
  defaultType: WorkItemType;
  // Preselected parent (a story id), or null for none.
  parentId: string | null;
  // Status of the new item (a cell's status when added from a cell).
  status?: WorkItemStatus;
  onCreate: (input: NewItemInput) => Promise<unknown>;
  onClose: () => void;
}

// Quick-add: title + type + parent. Stays open after a successful submit, Enter submits, Escape cancels.
export function NewItemForm({ project, items, allowedTypes, defaultType, parentId, status = 'backlog', onCreate, onClose }: NewItemFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkItemType>(defaultType);
  const [parentPref, setParentPref] = useState<string | null>(parentId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const candidates = parentCandidates(items, type);
  // Derived, not stored: a parent that vanished or is invalid for the chosen type falls back to none.
  const parent = candidates.some((c) => c.id === parentPref) ? parentPref : null;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const clean = cleanTitle(title);
    if (!clean || busy) return;
    setBusy(true);
    setError(false);
    try {
      await onCreate({ type, title: clean, status, parentId: parent });
      setTitle('');
    } catch (err) {
      console.error('createItem', err);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Escape') onClose();
        }}
        placeholder={t('projects.newItem.titlePlaceholder')}
        aria-label={t('projects.newItem.titlePlaceholder')}
        className={`${inputClass} w-full`}
      />
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as WorkItemType)}
          aria-label={t('projects.newItem.typeLabel')}
          disabled={allowedTypes.length < 2}
          className={`${inputClass} min-w-0 flex-1 px-2 py-1.5`}
        >
          {allowedTypes.map((tp) => (
            <option key={tp} value={tp}>
              {t(TYPE_META[tp].labelKey)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || !cleanTitle(title)}
          className="rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:opacity-50"
        >
          {t('projects.add')}
        </button>
      </div>
      {validParentTypes(type).length > 0 && (
        <select
          value={parent ?? ''}
          onChange={(e) => setParentPref(e.target.value || null)}
          aria-label={t('projects.newItem.parentLabel')}
          className={`${inputClass} w-full px-2 py-1.5`}
        >
          <option value="">{t('projects.newItem.noParent')}</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {itemRef(project, c)} {c.title}
            </option>
          ))}
        </select>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {t('projects.newItem.error')}
        </p>
      )}
    </form>
  );
}

interface NewItemButtonProps {
  project: Project;
  items: WorkItem[];
  // Offered types; the first one is preselected.
  types: WorkItemType[];
  label: string;
  onCreate: (input: NewItemInput) => Promise<unknown>;
  className?: string;
}

// Button + popover with a NewItemForm (toolbar "New", empty-state "New story").
export function NewItemButton({ project, items, types, label, onCreate, className = '' }: NewItemButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover"
      >
        <Plus size={15} />
        {label}
      </button>
      {open && (
        <div className={`${popoverClass} z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] p-3 max-md:fixed max-md:inset-x-4 max-md:w-auto md:absolute md:right-0`}>
          <NewItemForm project={project} items={items} allowedTypes={types} defaultType={types[0]} parentId={null} onCreate={onCreate} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

