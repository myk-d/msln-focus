import { useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { menuItemClass, popoverClass } from '../lib/ui';
import type { TaskList } from '../types';

interface ListSidebarRowProps {
  list: TaskList;
  isActive: boolean;
  taskCount: number;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onSetDefault: () => void;
  onDelete: () => void;
}

export function ListSidebarRow({
  list,
  isActive,
  taskCount,
  canDelete,
  onSelect,
  onRename,
  onSetDefault,
  onDelete,
}: ListSidebarRowProps) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState(list.name);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false));

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    else setDraft(list.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => e.key === 'Enter' && commitRename()}
        className="w-full rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-brand-400"
      />
    );
  }

  return (
    <div
      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
        isActive ? 'bg-brand-100 text-brand-800 font-medium' : 'text-stone-600 hover:bg-stone-100'
      }`}
    >
      <button onClick={onSelect} className="flex-1 truncate text-left">
        {list.name}
      </button>
      <div className="relative flex items-center gap-1">
        {taskCount > 0 && <span className="text-xs text-stone-400 group-hover:hidden">{taskCount}</span>}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="hidden rounded p-0.5 text-stone-400 hover:bg-stone-200 hover:text-stone-600 group-hover:block"
          aria-label="Меню списку"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div ref={menuRef} className={`${popoverClass} absolute right-0 top-6 z-30 w-40 p-1`}>
            <button
              onClick={() => {
                setDraft(list.name);
                setEditing(true);
                setMenuOpen(false);
              }}
              className={menuItemClass}
            >
              <Pencil size={14} /> Редагувати
            </button>
            {!list.isDefault && (
              <button
                onClick={() => {
                  onSetDefault();
                  setMenuOpen(false);
                }}
                className={menuItemClass}
              >
                <Star size={14} /> Зробити основним
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className={`${menuItemClass} text-red-500 hover:bg-red-50`}
              >
                <Trash2 size={14} /> Видалити
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
