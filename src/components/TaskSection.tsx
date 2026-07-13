import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { TaskRow } from './TaskRow';
import { SectionMenu } from './SectionMenu';
import type { Section, Task, TaskList } from '../types';

interface TaskSectionProps {
  section: Section;
  tasks: Task[];
  lists: TaskList[];
  hideCompleted: boolean;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export function TaskSection({ section, tasks, lists, hideCompleted, selectedTaskId, onSelectTask }: TaskSectionProps) {
  const { renameSection, deleteSection, insertSection, moveSectionToList, addTask, sections } = useTaskStoreContext();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(section.name === '');
  const [nameDraft, setNameDraft] = useState(section.name);
  const [newTaskText, setNewTaskText] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    data: { type: 'section', sectionId: section.id },
  });

  const visibleTasks = hideCompleted ? tasks.filter((t) => !t.completed) : tasks;
  const canDelete = sections.filter((s) => s.listId === section.listId).length > 1;

  const commitName = () => {
    renameSection(section.id, nameDraft.trim() || 'Без назви');
    setIsEditingName(false);
  };

  const commitNewTask = () => {
    if (newTaskText.trim()) addTask(section.id, newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <div className="mb-3">
      <div className="group flex items-center gap-2 px-1 py-1">
        <button onClick={() => setCollapsed((v) => !v)} className="text-stone-400 hover:text-stone-600">
          <ChevronDown size={16} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </button>
        {isEditingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && commitName()}
            placeholder="Без назви"
            className="rounded bg-stone-50 px-1 text-sm font-semibold outline-none ring-1 ring-brand-400"
          />
        ) : (
          <button onClick={() => setIsEditingName(true)} className="text-sm font-semibold text-stone-700 hover:text-stone-900">
            {section.name || 'Без назви'}
          </button>
        )}
        <span className="text-xs text-stone-400">{tasks.length}</span>
        <div className="relative ml-auto opacity-0 group-hover:opacity-100">
          <button onClick={() => setMenuOpen((v) => !v)} className="rounded px-1.5 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <SectionMenu
              lists={lists}
              currentListId={section.listId}
              canDelete={canDelete}
              onClose={() => setMenuOpen(false)}
              onRename={() => {
                setNameDraft(section.name);
                setIsEditingName(true);
                setMenuOpen(false);
              }}
              onInsertAbove={() => {
                insertSection(section.id, 'above');
                setMenuOpen(false);
              }}
              onInsertBelow={() => {
                insertSection(section.id, 'below');
                setMenuOpen(false);
              }}
              onMoveToList={(listId) => {
                moveSectionToList(section.id, listId);
                setMenuOpen(false);
              }}
              onDelete={() => {
                deleteSection(section.id);
                setMenuOpen(false);
              }}
            />
          )}
        </div>
      </div>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 rounded-xl px-1 py-1 transition ${isOver ? 'bg-brand-50' : ''}`}
        >
          <SortableContext items={visibleTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                lists={lists}
                currentListId={section.listId}
                isSelected={task.id === selectedTaskId}
                onSelect={onSelectTask}
              />
            ))}
          </SortableContext>
          <input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitNewTask()}
            onBlur={commitNewTask}
            placeholder="+ Додати завдання"
            className="mt-1 rounded-lg bg-transparent px-2 py-1.5 text-sm text-stone-500 outline-none placeholder:text-stone-400 hover:bg-stone-50 focus:bg-stone-50"
          />
        </div>
      )}
    </div>
  );
}
