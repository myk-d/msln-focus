import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, FolderKanban } from 'lucide-react';
import { useProjectsStore } from '../../hooks/useProjectsStore';
import { TYPE_META, TYPE_ORDER } from '../../lib/projects';
import type { WorkItemType } from '../../types';
import { NewItemButton } from './NewItemForm';
import { NewProjectForm } from './NewProjectForm';
import { ProjectBoard } from './ProjectBoard';
import { ItemDetailPanel } from './ItemDetailPanel';

const PROJECT_PREF_KEY = 'projects.activeProjectId';

function readPref(): string | null {
  try {
    return localStorage.getItem(PROJECT_PREF_KEY);
  } catch {
    return null;
  }
}

export function ProjectsPage() {
  const { t } = useTranslation();
  const store = useProjectsStore();
  const { projects, items, loading } = store;
  const [projectPref, setProjectPref] = useState<string | null>(readPref);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<WorkItemType | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  // Derived, not stored: falls back to the first project if the preference no longer exists.
  const project = projects.find((p) => p.id === projectPref) ?? [...projects].sort((a, b) => a.key.localeCompare(b.key))[0];
  const projectItems = project ? items.filter((i) => i.projectId === project.id) : [];
  const selectedItem = selectedItemId ? (projectItems.find((i) => i.id === selectedItemId) ?? null) : null;

  const selectProject = (id: string) => {
    setProjectPref(id);
    setSelectedItemId(null);
    try {
      localStorage.setItem(PROJECT_PREF_KEY, id);
    } catch {
      /* storage unavailable — keep the in-memory choice */
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  const sortedProjects = [...projects].sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div className="flex h-full">
      {/* Desktop: project list */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-stone-200 bg-white/60 p-3 md:flex">
        <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">{t('projects.title')}</h2>
        {sortedProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProject(p.id)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
              p.id === project?.id ? 'bg-brand-100 text-brand-700' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span className="font-mono text-xs text-stone-400">{p.key}</span>
            <span className="truncate">{p.name}</span>
          </button>
        ))}
        <NewProjectForm existingKeys={projects.map((p) => p.key)} onCreate={store.createProject} onCreated={(p) => selectProject(p.id)} />
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {project ? (
          <>
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-200 px-4 py-3 md:px-6">
              {/* Mobile: project picker */}
              <select
                value={project.id}
                onChange={(e) => selectProject(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm md:hidden"
                aria-label={t('projects.selectProject')}
              >
                {sortedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key} · {p.name}
                  </option>
                ))}
              </select>
              <h1 className="hidden text-lg font-semibold text-stone-800 md:block">
                <span className="mr-2 font-mono text-sm text-stone-400">{project.key}</span>
                {project.name}
              </h1>
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
                >
                  <ExternalLink size={13} />
                  {t('projects.repo')}
                </a>
              )}
              <NewItemButton
                project={project}
                items={projectItems}
                types={['story', 'epic', 'task', 'bug']}
                label={t('projects.newItem.new')}
                onCreate={(input) => store.createItem(project.id, input)}
                className="ml-auto"
              />
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setTypeFilter(null)}
                  className={`rounded-full px-2.5 py-1 text-xs transition ${typeFilter === null ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-100'}`}
                >
                  {t('projects.allTypes')}
                </button>
                {TYPE_ORDER.map((type) => {
                  const { icon: Icon, color, labelKey } = TYPE_META[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                        typeFilter === type ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      <Icon size={13} className={typeFilter === type ? '' : color} />
                      {t(labelKey)}
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowCancelled((v) => !v)}
                  className="rounded-full px-2.5 py-1 text-xs text-stone-500 transition hover:bg-stone-100"
                >
                  {showCancelled ? t('projects.hideCancelled') : t('projects.showCancelled')}
                </button>
              </div>
            </header>
            <ProjectBoard
              project={project}
              items={projectItems}
              typeFilter={typeFilter}
              showCancelled={showCancelled}
              onSelect={setSelectedItemId}
              onCreate={(input) => store.createItem(project.id, input)}
              onMove={(id, status) => void store.updateItem(id, { status })}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <FolderKanban size={36} className="text-stone-300" />
            <p className="text-stone-600">{t('projects.empty')}</p>
            <p className="max-w-sm text-sm text-stone-400">{t('projects.emptyHint')}</p>
            <div className="w-full max-w-xs md:hidden">
              <NewProjectForm existingKeys={[]} onCreate={store.createProject} onCreated={(p) => selectProject(p.id)} />
            </div>
          </div>
        )}
      </main>

      {project && selectedItem && (
        <ItemDetailPanel
          key={selectedItem.id}
          project={project}
          item={selectedItem}
          projectItems={projectItems}
          store={store}
          onSelect={setSelectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
}
