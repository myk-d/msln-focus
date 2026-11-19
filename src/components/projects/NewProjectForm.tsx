import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { inputClass } from '../../lib/ui';
import { PROJECT_KEY_RE } from '../../lib/projects';
import type { Project } from '../../types';

interface NewProjectFormProps {
  existingKeys: string[];
  onCreate: (p: { key: string; name: string; repo: string | null }) => Promise<Project | null>;
  onCreated: (p: Project) => void;
}

export function NewProjectForm({ existingKeys, onCreate, onCreated }: NewProjectFormProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [repo, setRepo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const reset = () => {
    setOpen(false);
    setKey('');
    setName('');
    setRepo('');
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const k = key.trim().toUpperCase();
    if (!PROJECT_KEY_RE.test(k)) return setError(t('projects.keyInvalid'));
    if (existingKeys.includes(k)) return setError(t('projects.keyTaken'));
    if (!name.trim()) return setError(t('projects.nameRequired'));
    setPending(true);
    try {
      const p = await onCreate({ key: k, name: name.trim(), repo: repo.trim() || null });
      if (p) onCreated(p);
      reset();
    } catch {
      setError(t('projects.createFailed'));
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
      >
        <Plus size={15} />
        {t('projects.newProject')}
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mt-2 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-2">
      <input
        autoFocus
        value={key}
        onChange={(e) => setKey(e.target.value.toUpperCase())}
        placeholder={t('projects.keyPlaceholder')}
        maxLength={10}
        className={`${inputClass} font-mono`}
      />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('projects.namePlaceholder')} className={inputClass} />
      <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder={t('projects.repoPlaceholder')} className={inputClass} />
      {error && <p className="px-1 text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={reset} className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100">
          {t('tasks.cancel')}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {t('projects.create')}
        </button>
      </div>
    </form>
  );
}
