import { useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { useConfirm } from '../context/ConfirmContext';
import { Checkbox } from './ui/Checkbox';
import type { Subtask } from '../types';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

function SubtaskRow({
  subtask,
  onToggle,
  onUpdate,
  onDelete,
}: {
  subtask: Subtask;
  onToggle: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.text);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed) onUpdate(trimmed);
    else setDraft(subtask.text);
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{ touchAction: 'none' }}
        className="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
        aria-label={t('tasks.dragAria')}
      >
        <GripVertical size={14} />
      </button>
      <Checkbox size="sm" checked={subtask.completed} onChange={onToggle} />
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          className="flex-1 rounded bg-surface-hover px-1 text-sm outline-none ring-1 ring-ring"
        />
      ) : (
        <button
          onClick={() => {
            setDraft(subtask.text);
            setEditing(true);
          }}
          className={`flex-1 truncate text-left text-sm ${subtask.completed ? 'text-muted line-through' : 'text-muted'}`}
        >
          {subtask.text}
        </button>
      )}
      <button onClick={onDelete} className="text-faint hover:text-danger md:hidden md:group-hover:block">
        <X size={13} />
      </button>
    </div>
  );
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const { t } = useTranslation();
  const { addSubtask, updateSubtask, toggleSubtask, deleteSubtask, reorderSubtasks } = useTaskStoreContext();
  const [newSubtask, setNewSubtask] = useState('');
  const confirm = useConfirm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const commitNewSubtask = () => {
    if (newSubtask.trim()) addSubtask(taskId, newSubtask.trim());
    setNewSubtask('');
  };

  const handleDelete = async (subtask: Subtask) => {
    if (await confirm({ title: t('confirm.deleteSubtaskTitle', { name: subtask.text }), confirmLabel: t('tasks.delete') })) {
      deleteSubtask(taskId, subtask.id);
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = subtasks.map((st) => st.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderSubtasks(taskId, arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={subtasks.map((st) => st.id)} strategy={verticalListSortingStrategy}>
          {subtasks.map((st) => (
            <SubtaskRow
              key={st.id}
              subtask={st}
              onToggle={() => toggleSubtask(taskId, st.id)}
              onUpdate={(text) => updateSubtask(taskId, st.id, text)}
              onDelete={() => handleDelete(st)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="flex items-center gap-1">
        <input
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitNewSubtask()}
          onBlur={commitNewSubtask}
          placeholder={t('tasks.addSubtaskPlaceholder')}
          className="flex-1 rounded bg-surface-hover px-1.5 py-1 text-sm outline-none placeholder:text-muted"
        />
        <button onClick={commitNewSubtask} className="shrink-0 rounded-full p-1 text-primary hover:bg-primary-soft" aria-label={t('tasks.save')}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
