import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { TYPE_META, TYPE_ORDER } from '../../lib/projects';
import type { WorkItemType } from '../../types';
import type { NewItemInput } from '../../hooks/useProjectsStore';

interface QuickAddItemProps {
  defaultType: WorkItemType;
  onCreate: (input: NewItemInput) => Promise<unknown>;
}

// Minimal top-level creation (lands in the backlog). Parent/type pickers inside story rows come with FOC-6.
export function QuickAddItem({ defaultType, onCreate }: QuickAddItemProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkItemType>(defaultType);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return setAdding(false);
    setTitle('');
    await onCreate({ type, title: trimmed, status: 'backlog' });
  };

  if (!adding) {
    return (
      <button
        onClick={() => {
          setType(defaultType);
          setAdding(true);
        }}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-stone-500 transition hover:bg-white hover:text-stone-700"
      >
        <Plus size={15} />
        {t('projects.addItem')}
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setAdding(false);
        }}
        placeholder={t('projects.itemTitlePlaceholder')}
        className="min-w-0 flex-1 text-sm outline-none placeholder:text-stone-400"
      />
      <div className="flex items-center gap-1">
        {TYPE_ORDER.map((tp) => {
          const { icon: Icon, color, labelKey } = TYPE_META[tp];
          return (
            <button
              key={tp}
              type="button"
              title={t(labelKey)}
              aria-label={t(labelKey)}
              onClick={() => setType(tp)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                type === tp ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-stone-100'
              }`}
            >
              <Icon size={14} className={color} />
            </button>
          );
        })}
        <button type="submit" className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700">
          {t('projects.add')}
        </button>
      </div>
    </form>
  );
}
