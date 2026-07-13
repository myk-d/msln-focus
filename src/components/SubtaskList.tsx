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

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const { t } = useTranslation();
  const { addSubtask, toggleSubtask, deleteSubtask } = useTaskStoreContext();
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
        <div key={st.id} className="group flex items-center gap-2">
          <Checkbox size="sm" checked={st.completed} onChange={() => toggleSubtask(taskId, st.id)} />
          <span className={`flex-1 text-sm ${st.completed ? 'text-stone-400 line-through' : 'text-stone-600'}`}>
            {st.text}
          </span>
          <button
            onClick={() => handleDelete(st)}
            className="text-stone-300 hover:text-red-500 md:hidden md:group-hover:block"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1">
        <input
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitNewSubtask()}
          onBlur={commitNewSubtask}
          placeholder={t('tasks.addSubtaskPlaceholder')}
          className="flex-1 rounded bg-stone-50 px-1.5 py-1 text-sm outline-none placeholder:text-stone-400"
        />
        <button onClick={commitNewSubtask} className="shrink-0 rounded-full p-1 text-brand-600 hover:bg-brand-50" aria-label={t('tasks.save')}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
