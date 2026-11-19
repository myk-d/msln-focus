import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Tag, User, X } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';
import { popoverClass, menuItemClass } from '../../lib/ui';
import { ASSIGNEE_META, ASSIGNEE_ORDER, STATUS_META, TYPE_META, itemRef, renderMarkdown } from '../../lib/projects';
import type { Assignee, Project, WorkItem } from '../../types';

// ---------- Tags: chips + "add tag" with suggestions (like ADO) ----------

export function TagInput({ value, suggestions, onChange }: { value: string[]; suggestions: string[]; onChange: (tags: string[]) => void }) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => {
    setAdding(false);
    setDraft('');
  });
  const q = draft.trim().toLowerCase();
  const matches = suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(q)).slice(0, 8);

  const add = (tag: string) => {
    const clean = tag.trim();
    if (clean && !value.some((v) => v.toLowerCase() === clean.toLowerCase())) onChange([...value, clean]);
    setDraft('');
  };

  return (
    <div ref={ref} className="relative flex flex-wrap items-center gap-1">
      {value.map((tag) => (
        <span key={tag} className="group flex items-center gap-1 rounded bg-sky-50 py-0.5 pr-1 pl-2 text-xs text-sky-800">
          {tag}
          <button
            onClick={() => onChange(value.filter((v) => v !== tag))}
            className="rounded p-0.5 text-sky-400 hover:bg-sky-100 hover:text-sky-700"
            aria-label={t('projects.removeTag', { tag })}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(draft);
            }
            if (e.key === 'Escape') setAdding(false);
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          placeholder={t('projects.tagPlaceholder')}
          className="w-32 rounded border border-sky-300 px-2 py-0.5 text-xs outline-none"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        >
          <Tag size={12} />
          {value.length ? <Plus size={12} /> : t('projects.addTag')}
        </button>
      )}
      {adding && (matches.length > 0 || q) && (
        <div className={`${popoverClass} absolute top-full left-0 z-20 mt-1 w-56 p-1`}>
          {matches.map((m) => (
            <button key={m} onClick={() => add(m)} className={menuItemClass}>
              <Tag size={13} className="text-stone-400" />
              {m}
            </button>
          ))}
          {q && !suggestions.some((s) => s.toLowerCase() === q) && (
            <button onClick={() => add(draft)} className={menuItemClass}>
              <Plus size={13} className="text-stone-400" />
              {t('projects.createTag', { tag: draft.trim() })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Assignee ----------

export function AssigneeAvatar({ assignee, photoURL, size = 20 }: { assignee: Assignee | null; photoURL?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (!assignee)
    return (
      <span style={style} className="flex shrink-0 items-center justify-center rounded-full border border-dashed border-stone-300 text-stone-300">
        <User size={size * 0.6} />
      </span>
    );
  if (assignee === 'me' && photoURL) return <img src={photoURL} alt="" referrerPolicy="no-referrer" style={style} className="shrink-0 rounded-full" />;
  const meta = ASSIGNEE_META[assignee];
  return (
    <span style={style} className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${meta.avatar}`}>
      {meta.initials || <User size={size * 0.6} />}
    </span>
  );
}

export function AssigneePicker({ value, photoURL, onChange }: { value: Assignee | null; photoURL?: string | null; onChange: (a: Assignee | null) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-stone-700 hover:bg-stone-100">
        <AssigneeAvatar assignee={value} photoURL={photoURL} />
        <span className={value ? '' : 'text-stone-400'}>{value ? t(ASSIGNEE_META[value].labelKey) : t('projects.unassigned')}</span>
      </button>
      {open && (
        <div className={`${popoverClass} absolute top-full left-0 z-20 mt-1 w-48 p-1`}>
          {[null, ...ASSIGNEE_ORDER].map((a) => (
            <button
              key={a ?? 'none'}
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
              className={`${menuItemClass} ${a === value ? 'bg-stone-100' : ''}`}
            >
              <AssigneeAvatar assignee={a} photoURL={photoURL} size={18} />
              {a ? t(ASSIGNEE_META[a].labelKey) : t('projects.unassigned')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Markdown: rendered view, click to edit (Write / Preview like ADO/GitHub) ----------

export function MarkdownField({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [draft, setDraft] = useState(value);
  const areaRef = useAutoResizeTextarea(draft);
  const html = useMemo(() => renderMarkdown(editing ? draft : value), [editing, draft, value]);

  if (!editing) {
    return value.trim() ? (
      <div
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="md-content cursor-text rounded-lg p-2 -mx-2 hover:bg-stone-50"
        // Sanitized by DOMPurify in renderMarkdown.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ) : (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="w-full rounded-lg p-2 -mx-2 text-left text-sm text-stone-400 hover:bg-stone-50"
      >
        {placeholder}
      </button>
    );
  }

  const save = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
    setTab('write');
  };

  return (
    <div className="rounded-xl border border-stone-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="flex items-center gap-1 border-b border-stone-100 px-2 pt-1.5">
        {(['write', 'preview'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-t-md px-2.5 py-1 text-xs ${tab === k ? 'border-b-2 border-brand-500 font-medium text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {t(k === 'write' ? 'projects.mdWrite' : 'projects.mdPreview')}
          </button>
        ))}
        <span className="ml-auto pb-1 text-[10px] text-stone-400">Markdown</span>
      </div>
      {tab === 'write' ? (
        <textarea
          ref={areaRef}
          autoFocus
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
            if (e.key === 'Escape') setEditing(false);
          }}
          placeholder={placeholder}
          className="block w-full resize-none overflow-hidden bg-transparent p-3 font-mono text-[13px] text-stone-700 outline-none placeholder:font-sans placeholder:text-stone-400"
        />
      ) : (
        <div className="md-content min-h-24 p-3" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      <div className="flex justify-end gap-2 border-t border-stone-100 p-2">
        <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1 text-xs text-stone-500 hover:bg-stone-100">
          {t('tasks.cancel')}
        </button>
        <button onClick={save} className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700">
          {t('tasks.save')}
        </button>
      </div>
    </div>
  );
}

// ---------- Link picker: search by ref or title (ADO "Add link") ----------

export function ItemPicker({
  project,
  items,
  exclude,
  onPick,
  onClose,
}: {
  project: Project;
  items: WorkItem[];
  exclude: string[];
  onPick: (item: WorkItem) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);
  const query = q.trim().toLowerCase();
  const results = items
    .filter((i) => !exclude.includes(i.id))
    .filter((i) => !query || itemRef(project, i).toLowerCase().includes(query) || i.title.toLowerCase().includes(query) || String(i.number) === query)
    .slice(0, 12);

  return (
    <div ref={ref} className={`${popoverClass} absolute top-full right-0 z-30 mt-1 w-80 p-2`}>
      <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-2">
        <Search size={14} className="text-stone-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          placeholder={t('projects.searchItems', { key: project.key })}
          className="w-full py-1.5 text-sm outline-none"
        />
      </div>
      <div className="mt-1 max-h-72 overflow-y-auto">
        {results.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-stone-400">{t('projects.nothingFound')}</p>
        ) : (
          results.map((i) => {
            const { icon: Icon, color } = TYPE_META[i.type];
            return (
              <button key={i.id} onClick={() => onPick(i)} className={menuItemClass}>
                <Icon size={13} className={`shrink-0 ${color}`} />
                <span className="shrink-0 font-mono text-xs text-stone-400">{itemRef(project, i)}</span>
                <span className="truncate">{i.title}</span>
                <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[i.status].dot}`} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
