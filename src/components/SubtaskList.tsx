import { useState } from 'react';
import { X } from 'lucide-react';
import { useTaskStoreContext } from '../context/TaskStoreContext';
import { Checkbox } from './ui/Checkbox';
import type { Subtask } from '../types';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const { addSubtask, toggleSubtask, deleteSubtask } = useTaskStoreContext();
  const [newSubtask, setNewSubtask] = useState('');

  const commitNewSubtask = () => {
    if (newSubtask.trim()) addSubtask(taskId, newSubtask.trim());
    setNewSubtask('');
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
            onClick={() => deleteSubtask(taskId, st.id)}
            className="hidden text-stone-300 hover:text-red-500 group-hover:block"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <input
        value={newSubtask}
        onChange={(e) => setNewSubtask(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commitNewSubtask()}
        onBlur={commitNewSubtask}
        placeholder="+ підзавдання"
        className="rounded bg-stone-50 px-1.5 py-1 text-sm outline-none placeholder:text-stone-400"
      />
    </div>
  );
}
