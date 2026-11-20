import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, FolderKanban, Plus, SearchX } from 'lucide-react';
import { STATUS_META, TYPE_META, buildBacklog, hasActiveFilters, itemRef, type BacklogNode, type ItemFilters } from '../../lib/projects';
import { useAuth } from '../../context/AuthContext';
import { AssigneeAvatar } from './fields';
import { NewItemButton, NewItemForm } from './NewItemForm';
import type { Project, WorkItem, WorkItemType } from '../../types';
import type { NewItemInput } from '../../hooks/useProjectsStore';

interface BacklogViewProps {
  project: Project;
  items: WorkItem[];
  filters: ItemFilters;
  onClearFilters: () => void;
  showCancelled: boolean;
  onSelect: (id: string) => void;
  onCreate: (input: NewItemInput) => Promise<unknown>;
}

// Item types a "+" on a row can add under that row.
function childTypes(node: BacklogNode): WorkItemType[] {
  return node.item?.type === 'epic' ? ['story'] : ['task', 'bug'];
}

// Flat, indented tree. Collapse state is in memory only; while filtering every shown node is expanded
// (derived, so clearing the filter restores the manual state untouched).
export function BacklogView({ project, items, filters, onClearFilters, showCancelled, onSelect, onCreate }: BacklogViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const roots = useMemo(() => buildBacklog(items, project, filters, showCancelled), [items, project, filters, showCancelled]);
  const filtering = hasActiveFilters(filters);

  const flat = useMemo(() => {
    const out: BacklogNode[] = [];
    const walk = (n: BacklogNode) => {
      out.push(n);
      if (filtering || !collapsed.has(n.key)) n.children.forEach(walk);
    };
    roots.forEach(walk);
    return out;
  }, [roots, collapsed, filtering]);

  const expandable = useMemo(() => {
    const keys: string[] = [];
    const walk = (n: BacklogNode) => {
      if (n.children.length > 0) keys.push(n.key);
      n.children.forEach(walk);
    };
    roots.forEach(walk);
    return keys;
  }, [roots]);
  const allCollapsed = expandable.length > 0 && expandable.every((k) => collapsed.has(k));

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  if (roots.length === 0) {
    return filtering ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <SearchX size={36} className="text-stone-300" />
        <p className="max-w-sm text-sm text-stone-500">{t('projects.backlog.noResults')}</p>
        <button onClick={onClearFilters} className="rounded-lg px-2 py-1 text-sm text-brand-700 hover:bg-brand-50">
          {t('projects.filter.clear')}
        </button>
      </div>
    ) : (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <FolderKanban size={36} className="text-stone-300" />
        <p className="max-w-sm text-sm text-stone-500">{t('projects.backlog.empty')}</p>
        <NewItemButton project={project} items={items} types={['epic', 'story']} label={t('projects.backlog.newEpic')} onCreate={onCreate} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 pt-3 md:px-6">
        {expandable.length > 0 && !filtering && (
          <button
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(expandable))}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-stone-500 transition hover:bg-white hover:text-stone-700"
          >
            {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
            {t(allCollapsed ? 'projects.board.expandAll' : 'projects.board.collapseAll')}
          </button>
        )}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2 md:px-4">
        {flat.map((node) => {
          const { item } = node;
          const open = filtering || !collapsed.has(node.key);
          const hasKids = node.children.length > 0;
          const Icon = item ? TYPE_META[item.type].icon : null;
          const cancelled = item?.status === 'cancelled';
          const canAdd = !item || item.type === 'epic' || item.type === 'story';
          const adding = addingKey === node.key;
          const toggleLabel = t(open ? 'projects.backlog.collapse' : 'projects.backlog.expand');
          return (
            <li key={node.key} style={{ '--d': node.depth } as React.CSSProperties} className="pl-[calc(var(--d)*12px)] md:pl-[calc(var(--d)*20px)]">
              <div className={`group flex min-w-0 items-center gap-1 rounded-lg px-1 hover:bg-white ${cancelled ? 'opacity-60' : ''}`}>
                {hasKids ? (
                  <button
                    onClick={() => toggle(node.key)}
                    disabled={filtering}
                    aria-label={toggleLabel}
                    aria-expanded={open}
                    title={toggleLabel}
                    className="flex h-9 w-7 shrink-0 items-center justify-center rounded text-stone-500 hover:bg-stone-200/70 disabled:cursor-default md:h-7"
                  >
                    {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                ) : (
                  <span className="w-7 shrink-0" />
                )}
                {item && Icon ? (
                  <button onClick={() => onSelect(item.id)} title={item.title} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left">
                    <Icon size={14} className={`shrink-0 ${TYPE_META[item.type].color}`} />
                    <span className="shrink-0 font-mono text-xs text-stone-400">{itemRef(project, item)}</span>
                    <span className={`min-w-0 flex-1 truncate text-sm text-stone-800 ${cancelled ? 'line-through' : ''}`}>{item.title}</span>
                  </button>
                ) : (
                  <p className="min-w-0 flex-1 truncate py-1.5 text-sm font-medium text-stone-600">{t('projects.board.noStory')}</p>
                )}
                {node.total > 0 && <span className="hidden shrink-0 text-[11px] text-stone-500 sm:inline">{t('projects.board.progress', { done: node.done, total: node.total })}</span>}
                {canAdd && (
                  <button
                    onClick={() => setAddingKey(adding ? null : node.key)}
                    aria-expanded={adding}
                    aria-label={t(item?.type === 'epic' ? 'projects.backlog.addStory' : 'projects.newItem.addTask')}
                    title={t(item?.type === 'epic' ? 'projects.backlog.addStory' : 'projects.newItem.addTask')}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-200/70 hover:text-stone-700 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Plus size={14} />
                  </button>
                )}
                {item && (
                  <>
                    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-stone-500" title={t(STATUS_META[item.status].labelKey)}>
                      <span className={`h-2 w-2 rounded-full ${STATUS_META[item.status].dot}`} />
                      <span className="hidden md:inline">{t(STATUS_META[item.status].labelKey)}</span>
                    </span>
                    <span className="hidden shrink-0 sm:block">
                      <AssigneeAvatar assignee={item.assignee} photoURL={user?.photoURL} size={18} />
                    </span>
                  </>
                )}
              </div>
              {adding && (
                <div className="my-1 ml-8 max-w-sm">
                  <NewItemForm
                    project={project}
                    items={items}
                    allowedTypes={childTypes(node)}
                    defaultType={childTypes(node)[0]}
                    parentId={item?.id ?? null}
                    onCreate={onCreate}
                    onClose={() => setAddingKey(null)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
