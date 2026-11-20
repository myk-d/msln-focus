import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
}

// First cell of a taskboard row (desktop) and header of a story card (mobile).
export function StoryHeader({ row, project, collapsed, onToggle, onSelect }: StoryHeaderProps) {
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
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded text-stone-500 hover:bg-stone-200/70 md:h-6 md:w-6"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>
        {story ? (
          <button onClick={() => onSelect(story.id)} title={story.title} className="min-w-0 flex-1 text-left">
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              {(() => {
                const { icon: Icon, color } = TYPE_META[story.type];
                return <Icon size={13} className={color} />;
              })()}
              <span className="font-mono">{itemRef(project, story)}</span>
            </span>
            <span className={`line-clamp-2 break-words text-sm font-medium text-stone-800 ${cancelled ? 'line-through' : ''}`}>{story.title}</span>
          </button>
        ) : (
          <p className="min-w-0 flex-1 py-0.5 text-sm font-medium text-stone-600">{t('projects.board.noStory')}</p>
        )}
        {story && <AssigneeAvatar assignee={story.assignee} photoURL={user?.photoURL} size={20} />}
      </div>
      {row.total > 0 && (
        <div className="ml-7">
          <p className="text-[11px] text-stone-500">{t('projects.board.progress', { done: row.done, total: row.total })}</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
