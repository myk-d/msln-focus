import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { TagSidebarRow } from './TagSidebarRow';

interface ListSidebarProps {
  activeTagId: string | null;
  onSelectTag: (tagId: string) => void;
  onSelectList: () => void;
}

export function ListSidebar({ activeTagId, onSelectTag, onSelectList }: ListSidebarProps) {
  const {
    lists,
    sections,
    tasks,
    tags,
    activeListId,
    setActiveListId,
    addList,
    renameList,
    deleteList,
    updateTag,
    deleteTag,
  } = useTaskStoreContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newListName, setNewListName] = useState('');

  const taskCount = (listId: string) => {
    const sectionIds = new Set(sections.filter((s) => s.listId === listId).map((s) => s.id));
    return tasks.filter((t) => sectionIds.has(t.sectionId) && !t.completed).length;
  };

  const commitRename = () => {
    if (editingId && draft.trim()) renameList(editingId, draft.trim());
    setEditingId(null);
  };

  const commitAdd = () => {
    if (newListName.trim()) addList(newListName.trim());
    setNewListName('');
    setIsAdding(false);
  };

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-stone-200 px-3 py-6">
      <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Списки</h2>
      {lists.map((list) => (
        <div
          key={list.id}
          className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
            !activeTagId && activeListId === list.id
              ? 'bg-brand-100 text-brand-800 font-medium'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          {editingId === list.id ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              className="w-full rounded bg-white px-1 text-sm outline-none ring-1 ring-brand-400"
            />
          ) : (
            <button
              onClick={() => {
                setActiveListId(list.id);
                onSelectList();
              }}
              onDoubleClick={() => {
                setEditingId(list.id);
                setDraft(list.name);
              }}
              className="flex-1 truncate text-left"
            >
              {list.name}
            </button>
          )}
          <div className="flex items-center gap-1">
            {taskCount(list.id) > 0 && (
              <span className="text-xs text-stone-400 group-hover:hidden">{taskCount(list.id)}</span>
            )}
            {!list.isDefault && (
              <button
                onClick={() => deleteList(list.id)}
                className="hidden text-stone-400 hover:text-red-500 group-hover:block"
                aria-label="Видалити список"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ))}

      {isAdding ? (
        <input
          autoFocus
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onBlur={commitAdd}
          onKeyDown={(e) => e.key === 'Enter' && commitAdd()}
          placeholder="Назва списку"
          className="mx-2 mt-1 rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-brand-400"
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-left text-sm text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <Plus size={14} /> Новий список
        </button>
      )}

      {tags.length > 0 && (
        <>
          <h2 className="mt-4 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Мітки</h2>
          {tags.map((tag) => (
            <TagSidebarRow
              key={tag.id}
              tag={tag}
              isActive={activeTagId === tag.id}
              onSelect={() => onSelectTag(tag.id)}
              onRename={(name) => updateTag(tag.id, { name })}
              onRecolor={(color) => updateTag(tag.id, { color })}
              onDelete={() => deleteTag(tag.id)}
            />
          ))}
        </>
      )}
    </aside>
  );
}
