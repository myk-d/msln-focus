import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pin, PinOff, X } from 'lucide-react';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { usePomodoroContext } from '../context/PomodoroContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Checkbox } from './ui/Checkbox';
import { PriorityPicker } from './ui/PriorityPicker';
import { TagPicker } from './ui/TagPicker';
import { DatePicker } from './ui/DatePicker';
import { SubtaskList } from './SubtaskList';
import { TaskContextMenu } from './TaskContextMenu';
import { inputClass } from '../lib/ui';
import type { Task, TaskList } from '../types';

interface TaskDetailPanelProps {
  task: Task;
  lists: TaskList[];
  onClose: () => void;
}

export function TaskDetailPanel({ task, lists, onClose }: TaskDetailPanelProps) {
  const {
    sections,
    tags,
    toggleTaskCompleted,
    updateTask,
    deleteTask,
    duplicateTask,
    moveTaskToList,
    setPriority,
    setDueDate,
    createTag,
    deleteTag,
    toggleTaskTag,
    togglePin,
  } = useTaskStoreContext();
  const { startForTask } = usePomodoroContext();
  const navigate = useNavigate();
  const currentListId = sections.find((s) => s.id === task.sectionId)?.listId ?? '';
  useBodyScrollLock(true);

  const [titleDraft, setTitleDraft] = useState(task.text);
  const [descriptionDraft, setDescriptionDraft] = useState(task.description);
  const [menuOpen, setMenuOpen] = useState(false);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed) updateTask(task.id, { text: trimmed });
    else setTitleDraft(task.text);
  };

  const commitDescription = () => updateTask(task.id, { description: descriptionDraft });

  return (
    <>
      <div onClick={onClose} className="animate-fade-in fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" />
      <aside className="animate-slide-in-right fixed inset-y-0 right-0 z-40 flex h-full w-full flex-col border-l border-stone-200 bg-white md:w-100">
      {/* Header sits outside the scrolling body so its "..." popover menu can't
          get clipped — a scrollable ancestor clips absolutely-positioned
          descendants regardless of z-index, since setting overflow-y non-visible
          forces overflow-x to clip too. */}
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <button onClick={() => togglePin(task.id)} className="text-stone-400 hover:text-stone-600" aria-label="Закріпити">
            {task.pinned ? <PinOff size={16} className="text-brand-600" /> : <Pin size={16} />}
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <TaskContextMenu
                task={task}
                lists={lists}
                allTags={tags}
                currentListId={currentListId}
                onClose={() => setMenuOpen(false)}
                onSetPriority={(p) => setPriority(task.id, p)}
                onSetDueDate={(d) => setDueDate(task.id, d)}
                onToggleTag={(tagId) => toggleTaskTag(task.id, tagId)}
                onCreateTag={(name) => toggleTaskTag(task.id, createTag(name))}
                onDeleteTag={deleteTag}
                onOpenDetail={() => setMenuOpen(false)}
                onMoveToList={(listId) => {
                  moveTaskToList(task.id, listId);
                  setMenuOpen(false);
                }}
                onDuplicate={() => {
                  duplicateTask(task.id);
                  setMenuOpen(false);
                }}
                onDelete={() => {
                  deleteTask(task.id);
                  setMenuOpen(false);
                  onClose();
                }}
                onTogglePin={() => {
                  togglePin(task.id);
                  setMenuOpen(false);
                }}
                onRunFocus={() => {
                  startForTask(task.id);
                  setMenuOpen(false);
                  navigate('/pomodoro');
                }}
              />
            )}
          </div>
        </div>
        <button onClick={onClose} className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-1.5">
          <Checkbox checked={task.completed} onChange={() => toggleTaskCompleted(task.id)} />
        </div>
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className={`flex-1 border-none px-0 py-0 text-lg font-semibold text-stone-800 outline-none focus:ring-0 ${
            task.completed ? 'text-stone-400 line-through' : ''
          }`}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Пріоритет</div>
          <PriorityPicker value={task.priority} onChange={(p) => setPriority(task.id, p)} />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Дата</div>
          <DatePicker value={task.dueDate} onChange={(d) => setDueDate(task.id, d)} />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Мітки</div>
          <TagPicker
            selectedTagIds={task.tagIds}
            allTags={tags}
            onToggle={(tagId) => toggleTaskTag(task.id, tagId)}
            onCreate={(name) => toggleTaskTag(task.id, createTag(name))}
            onDeleteTag={deleteTag}
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Підзавдання</div>
          <SubtaskList taskId={task.id} subtasks={task.subtasks} />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Опис</div>
          <textarea
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            onBlur={commitDescription}
            placeholder="Додати опис..."
            rows={5}
            className={`${inputClass} w-full resize-none`}
          />
        </div>
      </div>
      </div>
      </aside>
    </>
  );
}
