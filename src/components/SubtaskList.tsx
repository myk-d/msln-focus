import { useState } from 'react';
import { Plus, X } from 'lucide-react';
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.text);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed) onUpdate(trimmed);
    else setDraft(subtask.text);
    setEditing(false);
  };

  return (
    <div className="group flex items-center gap-2">
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
  const { addSubtask, updateSubtask, toggleSubtask, deleteSubtask } = useTaskStoreContext();
  const [newSubtask, setNewSubtask] = useState('');
  const confirm = useConfirm();

  const commitNewSubtask = () => {
    if (newSubtask.trim()) addSubtask(taskId, newSubtask.trim());
    setNewSubtask('');
  };

  const handleDelete = async (subtask: Subtask) => {
    if (await confirm({ title: t('confirm.deleteSubtaskTitle', { name: subtask.text }), confirmLabel: t('tasks.delete') })) {
      deleteSubtask(taskId, subtask.id);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {subtasks.map((st) => (
        <SubtaskRow
          key={st.id}
          subtask={st}
          onToggle={() => toggleSubtask(taskId, st.id)}
          onUpdate={(text) => updateSubtask(taskId, st.id, text)}
          onDelete={() => handleDelete(st)}
        />
      ))}
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
