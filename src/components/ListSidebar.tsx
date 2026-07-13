import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { useConfirm } from '../context/ConfirmContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { TagSidebarRow } from './TagSidebarRow';
import { ListSidebarRow } from './ListSidebarRow';

interface ListSidebarProps {
  activeTagId: string | null;
  onSelectTag: (tagId: string) => void;
  onSelectList: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function ListSidebar({ activeTagId, onSelectTag, onSelectList, mobileOpen, onCloseMobile }: ListSidebarProps) {
  const {
    lists,
    sections,
    tasks,
    tags,
    activeListId,
    setActiveListId,
    addList,
    renameList,
    setDefaultList,
    deleteList,
    updateTag,
    deleteTag,
  } = useTaskStoreContext();
  const { t } = useTranslation();
  const confirm = useConfirm();
  useBodyScrollLock(mobileOpen);
  const [isAdding, setIsAdding] = useState(false);
  const [newListName, setNewListName] = useState('');

  const taskCount = (listId: string) => {
    const sectionIds = new Set(sections.filter((s) => s.listId === listId).map((s) => s.id));
    return tasks.filter((t) => sectionIds.has(t.sectionId) && !t.completed).length;
  };

  const handleDeleteList = async (list: (typeof lists)[number]) => {
    if (
      await confirm({
        title: t('confirm.deleteListTitle', { name: list.name }),
        message: t('confirm.deleteListMessage'),
        confirmLabel: t('tasks.delete'),
      })
    ) {
      deleteList(list.id);
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (
      await confirm({
        title: t('confirm.deleteTagTitle', { name: tagName }),
        message: t('confirm.deleteTagMessage'),
        confirmLabel: t('tasks.delete'),
      })
    ) {
      deleteTag(tagId);
    }
  };

  const commitAdd = () => {
    if (newListName.trim()) addList(newListName.trim());
    setNewListName('');
    setIsAdding(false);
  };

  return (
    <>
      {mobileOpen && (
        <div onClick={onCloseMobile} className="animate-fade-in fixed inset-0 z-20 bg-black/30 md:hidden" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 shrink-0 flex-col gap-1 overflow-y-auto border-r border-stone-200 bg-white px-3 py-6 md:static md:z-auto md:flex md:w-56 ${
          mobileOpen ? 'animate-slide-in-left flex' : 'hidden'
        }`}
      >
        <div className="mb-1 flex items-center justify-between md:hidden">
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('tasks.lists')}</h2>
          <button onClick={onCloseMobile} className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>
        <h2 className="hidden px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-stone-400 md:block">{t('tasks.lists')}</h2>
      {lists.map((list) => (
        <ListSidebarRow
          key={list.id}
          list={list}
          isActive={!activeTagId && activeListId === list.id}
          taskCount={taskCount(list.id)}
          canDelete={!list.isDefault}
          onSelect={() => {
            setActiveListId(list.id);
            onSelectList();
            onCloseMobile();
          }}
          onRename={(name) => renameList(list.id, name)}
          onSetDefault={() => setDefaultList(list.id)}
          onDelete={() => handleDeleteList(list)}
        />
      ))}

      {isAdding ? (
        <div className="mx-2 mt-1 flex items-center gap-1">
          <input
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => e.key === 'Enter' && commitAdd()}
            placeholder={t('tasks.newListPlaceholder')}
            className="flex-1 rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-brand-400"
          />
          <button onClick={commitAdd} className="shrink-0 rounded-full p-1 text-brand-600 hover:bg-brand-50" aria-label={t('tasks.save')}>
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-left text-sm text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <Plus size={14} /> {t('tasks.newList')}
        </button>
      )}

      {tags.length > 0 && (
        <>
          <h2 className="mt-4 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">{t('tasks.tags')}</h2>
          {tags.map((tag) => (
            <TagSidebarRow
              key={tag.id}
              tag={tag}
              isActive={activeTagId === tag.id}
              onSelect={() => {
                onSelectTag(tag.id);
                onCloseMobile();
              }}
              onRename={(name) => updateTag(tag.id, { name })}
              onRecolor={(color) => updateTag(tag.id, { color })}
              onDelete={() => handleDeleteTag(tag.id, tag.name)}
            />
          ))}
        </>
      )}
    </aside>
    </>
  );
}
