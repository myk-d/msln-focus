import { useRef, useState } from 'react';
import { Copy, FolderInput, ListChecks, Pin, PinOff, Target, Trash2 } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { PriorityPicker } from './ui/PriorityPicker';
import { TagPicker } from './ui/TagPicker';
import { DatePicker } from './ui/DatePicker';
import { menuItemClass, popoverClass } from '../lib/ui';
import type { Priority, Tag, Task, TaskList } from '../types';

interface TaskContextMenuProps {
  task: Task;
  lists: TaskList[];
  allTags: Tag[];
  currentListId: string;
  onClose: () => void;
  onSetPriority: (p: Priority) => void;
  onSetDueDate: (d: string | null) => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => void;
  onDeleteTag: (tagId: string) => void;
  onOpenDetail: () => void;
  onMoveToList: (listId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onRunFocus: () => void;
}

export function TaskContextMenu({
  task,
  lists,
  allTags,
  currentListId,
  onClose,
  onSetPriority,
  onSetDueDate,
  onToggleTag,
  onCreateTag,
  onDeleteTag,
  onOpenDetail,
  onMoveToList,
  onDuplicate,
  onDelete,
  onTogglePin,
  onRunFocus,
}: TaskContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);
  const [showMoveTo, setShowMoveTo] = useState(false);

  return (
    <div ref={ref} className={`${popoverClass} absolute right-0 top-8 z-20 w-64 p-2 text-sm`}>
      <div className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Пріоритет</div>
      <div className="px-2 pb-2">
        <PriorityPicker value={task.priority} onChange={onSetPriority} />
      </div>

      <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Дата</div>
      <div className="px-2 pb-2">
        <DatePicker value={task.dueDate} onChange={onSetDueDate} />
      </div>

      <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Мітки</div>
      <div className="px-2 pb-2">
        <TagPicker
          selectedTagIds={task.tagIds}
          allTags={allTags}
          onToggle={onToggleTag}
          onCreate={onCreateTag}
          onDeleteTag={onDeleteTag}
        />
      </div>

      <div className="my-1 border-t border-stone-100" />

      <button onClick={onRunFocus} className={menuItemClass}>
        <Target size={15} /> Запустити Focus
      </button>

      <button onClick={onTogglePin} className={menuItemClass}>
        {task.pinned ? <PinOff size={15} /> : <Pin size={15} />}
        {task.pinned ? 'Відкріпити' : 'Закріпити'}
      </button>

      <button onClick={onOpenDetail} className={menuItemClass}>
        <ListChecks size={15} /> Підзавдання та деталі
      </button>

      <div className="relative">
        <button onClick={() => setShowMoveTo((v) => !v)} className={`${menuItemClass} justify-between`}>
          <span className="flex items-center gap-2">
            <FolderInput size={15} /> Перейти до
          </span>
          <span className="text-stone-400">›</span>
        </button>
        {showMoveTo && (
          <div className={`${popoverClass} absolute right-full top-0 mr-1 w-44 p-1`}>
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => onMoveToList(list.id)}
                className={`${menuItemClass} justify-between`}
              >
                {list.name}
                {list.id === currentListId && <span className="text-brand-500">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={onDuplicate} className={menuItemClass}>
        <Copy size={15} /> Створити копію
      </button>

      <div className="my-1 border-t border-stone-100" />

      <button onClick={onDelete} className={`${menuItemClass} text-red-500 hover:bg-red-50`}>
        <Trash2 size={15} /> Видалити
      </button>
    </div>
  );
}
