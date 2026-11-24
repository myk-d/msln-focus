import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { TYPE_META, itemRef, type TaskboardRow } from '../../lib/projects';
import { useAuth } from '../../context/AuthContext';
import { AssigneeAvatar } from './fields';
import type { Project } from '../../types';

interface StoryHeaderProps {
  row: TaskboardRow;
  project: Project;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onAddTask: () => void;
  // Inline quick-add form, rendered under the header while open.
  addForm?: ReactNode;
}

// First cell of a taskboard row (desktop) and header of a story card (mobile).
export function StoryHeader({ row, project, collapsed, onToggle, onSelect, onAddTask, addForm }: StoryHeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { story } = row;
  const percent = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;
  const cancelled = story?.status === 'cancelled';
  const toggleLabel = t(collapsed ? 'projects.board.expandStory' : 'projects.board.collapseStory');

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${cancelled ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-1.5">
        <button
          onClick={onToggle}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          title={toggleLabel}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-strong/70 md:h-6 md:w-6"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>
        {story ? (
          <button onClick={() => onSelect(story.id)} title={story.title} className="min-w-0 flex-1 text-left">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              {(() => {
                const { icon: Icon, color } = TYPE_META[story.type];
                return <Icon size={13} className={color} />;
              })()}
              <span className="font-mono">{itemRef(project, story)}</span>
            </span>
            <span className={`line-clamp-2 break-words text-sm font-medium text-text ${cancelled ? 'line-through' : ''}`}>{story.title}</span>
          </button>
        ) : (
          <p className="min-w-0 flex-1 py-0.5 text-sm font-medium text-muted">{t('projects.board.noStory')}</p>
        )}
        {story && <AssigneeAvatar assignee={story.assignee} photoURL={user?.photoURL} size={20} />}
      </div>
      <button
        onClick={onAddTask}
        aria-expanded={!!addForm}
        className="ml-7 flex w-fit items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-muted transition hover:bg-surface-strong/70 hover:text-text"
      >
        <Plus size={13} />
        {t('projects.newItem.addTask')}
      </button>
      {addForm && <div className="ml-7">{addForm}</div>}
      {row.total > 0 && (
        <div className="ml-7">
          <p className="text-[11px] text-muted">{t('projects.board.progress', { done: row.done, total: row.total })}</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-strong">
            <div className="h-full rounded-full bg-success" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
