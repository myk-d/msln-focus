import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, FolderKanban } from 'lucide-react';
import { useProjectsStore } from '../../hooks/useProjectsStore';
import { EMPTY_FILTERS, sortItems, type ItemFilters } from '../../lib/projects';
import { NewItemButton } from './NewItemForm';
import { NewProjectForm } from './NewProjectForm';
import { BacklogView } from './BacklogView';
import { ProjectBoard } from './ProjectBoard';
import { ProjectToolbar } from './ProjectToolbar';
import { ItemDetailPanel } from './ItemDetailPanel';

const PROJECT_PREF_KEY = 'projects.activeProjectId';

const VIEW_PREF_KEY = 'projects.view';
type ProjectView = 'board' | 'backlog';

function readView(): ProjectView {
  try {
    return localStorage.getItem(VIEW_PREF_KEY) === 'backlog' ? 'backlog' : 'board';
  } catch {
    return 'board';
  }
}

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
  const [view, setViewState] = useState<ProjectView>(readView);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Filters live only in memory: they reset on reload and through resetFilters (FOC-8 calls it from the Board/Backlog switch).
  const [rawFilters, setFilters] = useState<ItemFilters>(EMPTY_FILTERS);
  const [showCancelled, setShowCancelled] = useState(false);

  // Derived, not stored: falls back to the first project if the preference no longer exists.
  const project = projects.find((p) => p.id === projectPref) ?? [...projects].sort((a, b) => a.key.localeCompare(b.key))[0];
  const projectItems = project ? items.filter((i) => i.projectId === project.id) : [];
  // Derived, not stored: an epic filter whose epic no longer exists counts as "All".
  const epicOptions = sortItems(projectItems.filter((i) => i.type === 'epic' && (showCancelled || i.status !== 'cancelled' || i.id === rawFilters.epicId)));
  const filters: ItemFilters = rawFilters.epicId && !projectItems.some((i) => i.id === rawFilters.epicId && i.type === 'epic') ? { ...rawFilters, epicId: null } : rawFilters;
  const resetFilters = () => setFilters(EMPTY_FILTERS);
  const selectedItem = selectedItemId ? (projectItems.find((i) => i.id === selectedItemId) ?? null) : null;

  // Filters are not kept across views: the switch handler resets them.
  const setView = (next: ProjectView) => {
    if (next === view) return;
    setViewState(next);
    resetFilters();
    try {
      localStorage.setItem(VIEW_PREF_KEY, next);
    } catch {
      /* storage unavailable — keep the in-memory choice */
    }
  };

  const selectProject = (id: string) => {
    setProjectPref(id);
    setSelectedItemId(null);
    resetFilters();
    try {
      localStorage.setItem(PROJECT_PREF_KEY, id);
    } catch {
      /* storage unavailable — keep the in-memory choice */
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
      </div>
    );
  }

  const sortedProjects = [...projects].sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div className="flex h-full">
      {/* Desktop: project list */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-surface/60 p-3 md:flex">
        <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('projects.title')}</h2>
        {sortedProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProject(p.id)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
              p.id === project?.id ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-sunken'
            }`}
          >
            <span className="font-mono text-xs text-muted">{p.key}</span>
            <span className="truncate">{p.name}</span>
          </button>
        ))}
        <NewProjectForm existingKeys={projects.map((p) => p.key)} onCreate={store.createProject} onCreated={(p) => selectProject(p.id)} />
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {project ? (
          <>
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3 md:px-6">
              {/* Mobile: project picker */}
              <select
                value={project.id}
                onChange={(e) => selectProject(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2 py-1 text-sm md:hidden"
                aria-label={t('projects.selectProject')}
              >
                {sortedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key} · {p.name}
                  </option>
                ))}
              </select>
              <h1 className="hidden text-lg font-semibold text-text md:block">
                <span className="mr-2 font-mono text-sm text-muted">{project.key}</span>
                {project.name}
              </h1>
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-muted hover:text-text"
                >
                  <ExternalLink size={13} />
                  {t('projects.repo')}
                </a>
              )}
              <div role="radiogroup" aria-label={t('projects.view.label')} className="flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                {(['board', 'backlog'] as const).map((v) => (
                  <button
                    key={v}
                    role="radio"
                    aria-checked={view === v}
                    onClick={() => setView(v)}
                    className={`min-h-9 rounded-md px-3 py-1 transition md:min-h-0 md:px-2.5 ${view === v ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-sunken'}`}
                  >
                    {t(`projects.view.${v}`)}
                  </button>
                ))}
              </div>
              <NewItemButton
                project={project}
                items={projectItems}
                types={['story', 'epic', 'task', 'bug']}
                label={t('projects.newItem.new')}
                onCreate={(input) => store.createItem(project.id, input)}
                className="ml-auto"
              />
              <ProjectToolbar
                project={project}
                epics={epicOptions}
                filters={filters}
                onChange={setFilters}
                onClear={resetFilters}
                showCancelled={showCancelled}
                onToggleCancelled={() => setShowCancelled((v) => !v)}
              />
            </header>
            {view === 'backlog' ? (
              <BacklogView
                project={project}
                items={projectItems}
                filters={filters}
                onClearFilters={resetFilters}
                showCancelled={showCancelled}
                onSelect={setSelectedItemId}
                onCreate={(input) => store.createItem(project.id, input)}
              />
            ) : (
              <ProjectBoard
                project={project}
                items={projectItems}
                filters={filters}
                onClearFilters={resetFilters}
                showCancelled={showCancelled}
                onSelect={setSelectedItemId}
                onCreate={(input) => store.createItem(project.id, input)}
                onMove={(id, status) => void store.updateItem(id, { status })}
              />
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <FolderKanban size={36} className="text-faint" />
            <p className="text-muted">{t('projects.empty')}</p>
            <p className="max-w-sm text-sm text-muted">{t('projects.emptyHint')}</p>
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
