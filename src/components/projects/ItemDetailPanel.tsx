import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, GitBranch, GitPullRequest, Link2, Plus, Send, Trash2, X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';
import { useItemComments, type ProjectsStore } from '../../hooks/useProjectsStore';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../context/AuthContext';
import { PriorityPicker } from '../ui/PriorityPicker';
import { inputClass, menuItemClass, popoverClass } from '../../lib/ui';
import {
  SEVERITY_META,
  SEVERITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
  TYPE_META,
  TYPE_ORDER,
  itemRef,
  renderMarkdown,
  sortItems,
} from '../../lib/projects';
import type { Project, Severity, WorkItem, WorkItemStatus, WorkItemType } from '../../types';
import { AssigneeAvatar, AssigneePicker, ItemPicker, MarkdownField, TagInput } from './fields';

interface ItemDetailPanelProps {
  project: Project;
  item: WorkItem;
  projectItems: WorkItem[];
  store: ProjectsStore;
  onSelect: (id: string) => void;
  onClose: () => void;
}

type LinkKind = 'parent' | 'child' | 'predecessor' | 'related';

const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-muted';

export function ItemDetailPanel({ project, item, projectItems, store, onSelect, onClose }: ItemDetailPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { updateItem } = store;
  useBodyScrollLock(true);

  const [titleDraft, setTitleDraft] = useState(item.title);
  const titleRef = useAutoResizeTextarea(titleDraft);
  const { icon: TypeIcon, color: typeColor, stripe } = TYPE_META[item.type];
  const ref = itemRef(project, item);
  const tagSuggestions = [...new Set(projectItems.flatMap((i) => i.labels))].sort((a, b) => a.localeCompare(b));

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== item.title) void updateItem(item.id, { title: trimmed });
    else setTitleDraft(item.title);
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('confirm.deleteWorkItemTitle', { ref, name: item.title }),
      message: t('confirm.deleteWorkItemMessage'),
      danger: true,
    });
    if (!ok) return;
    onClose();
    await store.deleteItem(item.id);
  };

  return (
    <>
      <div onClick={onClose} className="animate-fade-in fixed inset-0 z-30 bg-black/25 backdrop-blur-sm" />
      <aside className="animate-slide-in-right fixed inset-y-0 right-0 z-40 flex h-full w-full flex-col bg-surface shadow-2xl md:w-[min(1120px,92vw)]">
        {/* Header: type stripe, ID, title, assignee/state/tags — like the ADO work item form */}
        <div className="h-1 shrink-0" style={{ backgroundColor: stripe }} />
        <header className="shrink-0 border-b border-border px-5 pt-3 pb-3 md:px-7">
          <div className="flex items-center gap-2 text-xs">
            <TypeIcon size={15} className={typeColor} />
            <span className="font-semibold uppercase tracking-wide text-muted">{t(TYPE_META[item.type].labelKey)}</span>
            <span className="font-mono text-muted">{ref}</span>
            <button
              onClick={() => void handleDelete()}
              className="ml-auto rounded p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
              aria-label={t('projects.deleteItem')}
              title={t('projects.deleteItem')}
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="rounded p-1.5 text-muted hover:bg-surface-sunken hover:text-text" aria-label={t('projects.close')}>
              <X size={18} />
            </button>
          </div>
          <textarea
            ref={titleRef}
            rows={1}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            className="mt-1 w-full resize-none overflow-hidden rounded px-1 -mx-1 font-display text-xl font-semibold text-text outline-none hover:bg-surface-hover focus:bg-surface focus:ring-2 focus:ring-ring/30"
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <AssigneePicker value={item.assignee} photoURL={user?.photoURL} onChange={(assignee) => void updateItem(item.id, { assignee })} />
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted">{t('projects.field.status')}</span>
              <span className={`h-2 w-2 rounded-full ${STATUS_META[item.status].dot}`} />
              <select
                value={item.status}
                onChange={(e) => void updateItem(item.id, { status: e.target.value as WorkItemStatus })}
                className="rounded border border-transparent bg-transparent py-0.5 text-sm text-text hover:border-border"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_META[s].labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <TagInput value={item.labels} suggestions={tagSuggestions} onChange={(labels) => void updateItem(item.id, { labels })} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-x-8 px-5 py-5 md:grid-cols-[minmax(0,1fr)_300px] md:px-7">
            {/* Left: content and discussion */}
            <div className="flex min-w-0 flex-col gap-6">
              <Section title={t('projects.field.description')}>
                <MarkdownField
                  value={item.description}
                  placeholder={t('projects.descriptionPlaceholder')}
                  onSave={(description) => void updateItem(item.id, { description })}
                />
              </Section>

              <Section title={t('projects.field.acceptanceCriteria')}>
                <AcceptanceCriteria item={item} onChange={(acceptanceCriteria) => void updateItem(item.id, { acceptanceCriteria })} />
              </Section>

              {item.type === 'bug' && (
                <Section title={t('projects.field.reproSteps')}>
                  <MarkdownField value={item.reproSteps} placeholder={t('projects.reproPlaceholder')} onSave={(reproSteps) => void updateItem(item.id, { reproSteps })} />
                </Section>
              )}

              <Section title={t('projects.field.discussion')}>
                <Discussion itemId={item.id} store={store} photoURL={user?.photoURL} />
              </Section>
            </div>

            {/* Right: planning, development, related work */}
            <div className="mt-6 flex flex-col gap-5 md:mt-0">
              <Card title={t('projects.planning')}>
                <Field label={t('projects.field.type')}>
                  <select
                    value={item.type}
                    onChange={(e) => {
                      const type = e.target.value as WorkItemType;
                      void updateItem(item.id, { type, ...(type !== 'bug' ? { severity: null } : {}) });
                    }}
                    className={`${inputClass} w-full py-1.5`}
                  >
                    {TYPE_ORDER.map((tp) => (
                      <option key={tp} value={tp}>
                        {t(TYPE_META[tp].labelKey)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('projects.field.priority')}>
                  <PriorityPicker value={item.priority} onChange={(priority) => void updateItem(item.id, { priority })} />
                </Field>
                {item.type === 'bug' && (
                  <Field label={t('projects.field.severity')}>
                    <select
                      value={item.severity ?? ''}
                      onChange={(e) => void updateItem(item.id, { severity: (e.target.value || null) as Severity | null })}
                      className={`${inputClass} w-full py-1.5`}
                    >
                      <option value="">—</option>
                      {SEVERITY_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {t(SEVERITY_META[s].labelKey)}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </Card>

              <Card title={t('projects.development')}>
                {item.branch || item.prUrl ? (
                  <div className="flex flex-col gap-2 text-sm">
                    {item.branch && (
                      <span className="flex items-center gap-2 font-mono text-xs text-muted">
                        <GitBranch size={14} className="shrink-0 text-muted" />
                        <span className="truncate">{item.branch}</span>
                      </span>
                    )}
                    {item.prUrl && (
                      <a href={item.prUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-status-review hover:underline">
                        <GitPullRequest size={14} className="shrink-0" />
                        {t('projects.pullRequest')}
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted">{t('projects.noDevelopment')}</p>
                )}
              </Card>

              <RelatedWork project={project} item={item} projectItems={projectItems} store={store} onSelect={onSelect} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className={`${labelClass} mb-2 border-b border-border-subtle pb-1.5`}>{title}</h3>
      {children}
    </section>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-3">
      <div className="mb-2 flex items-center">
        <h3 className={labelClass}>{title}</h3>
        <div className="ml-auto">{action}</div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function AcceptanceCriteria({ item, onChange }: { item: WorkItem; onChange: (ac: string[]) => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [newDraft, setNewDraft] = useState('');

  const commit = (idx: number) => {
    const v = draft.trim();
    const next = [...item.acceptanceCriteria];
    if (v) next[idx] = v;
    else next.splice(idx, 1);
    if (next.join('\n') !== item.acceptanceCriteria.join('\n')) onChange(next);
    setEditing(null);
  };

  return (
    <div>
      <ol className="flex flex-col">
        {item.acceptanceCriteria.map((c, idx) => (
          <li key={`${idx}-${c}`} className="group flex items-start gap-2 rounded-lg px-1 py-1 text-sm text-text hover:bg-surface-hover">
            <span className="w-5 shrink-0 pt-0.5 text-right text-xs text-muted">{idx + 1}.</span>
            {editing === idx ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commit(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit(idx);
                  if (e.key === 'Escape') setEditing(null);
                }}
                className="flex-1 rounded px-1 outline-none ring-2 ring-ring/30"
              />
            ) : (
              <span
                onClick={() => {
                  setDraft(c);
                  setEditing(idx);
                }}
                className="md-inline flex-1 cursor-text"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(c, true) }}
              />
            )}
            <button
              onClick={() => onChange(item.acceptanceCriteria.filter((_, i) => i !== idx))}
              className="p-0.5 text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
              aria-label={t('projects.removeCriterion')}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ol>
      <input
        value={newDraft}
        onChange={(e) => setNewDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && newDraft.trim()) {
            onChange([...item.acceptanceCriteria, newDraft.trim()]);
            setNewDraft('');
          }
        }}
        placeholder={t('projects.addCriterion')}
        className="mt-1 ml-8 w-[calc(100%-2rem)] rounded-lg px-2 py-1 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}

function RelatedWork({
  project,
  item,
  projectItems,
  store,
  onSelect,
}: {
  project: Project;
  item: WorkItem;
  projectItems: WorkItem[];
  store: ProjectsStore;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [picking, setPicking] = useState<LinkKind | null>(null);
  const [newChild, setNewChild] = useState<string | null>(null);
  const byId = (id: string) => projectItems.find((i) => i.id === id);

  const parent = item.parentId ? byId(item.parentId) : undefined;
  const children = sortItems(projectItems.filter((i) => i.parentId === item.id));
  const predecessors = item.blockedBy.map(byId).filter((i): i is WorkItem => !!i);
  const successors = projectItems.filter((i) => i.blockedBy.includes(item.id));
  const relatedIds = new Set([...item.related, ...projectItems.filter((i) => i.related.includes(item.id)).map((i) => i.id)]);
  const related = [...relatedIds].map(byId).filter((i): i is WorkItem => !!i);

  // Everything already linked (and the item itself) is excluded from the picker.
  const linked = [item.id, item.parentId ?? '', ...children.map((c) => c.id), ...item.blockedBy, ...successors.map((s) => s.id), ...relatedIds];

  const pick = (target: WorkItem) => {
    if (picking === 'parent') void store.updateItem(item.id, { parentId: target.id });
    if (picking === 'child') void store.updateItem(target.id, { parentId: item.id });
    if (picking === 'predecessor') void store.updateItem(item.id, { blockedBy: [...item.blockedBy, target.id] });
    if (picking === 'related') void store.updateItem(item.id, { related: [...item.related, target.id] });
    setPicking(null);
  };

  const unlink = (kind: LinkKind | 'successor', target: WorkItem) => {
    if (kind === 'parent') void store.updateItem(item.id, { parentId: null });
    if (kind === 'child') void store.updateItem(target.id, { parentId: null });
    if (kind === 'predecessor') void store.updateItem(item.id, { blockedBy: item.blockedBy.filter((x) => x !== target.id) });
    if (kind === 'successor') void store.updateItem(target.id, { blockedBy: target.blockedBy.filter((x) => x !== item.id) });
    if (kind === 'related') {
      // Stored on either side — remove from both.
      if (item.related.includes(target.id)) void store.updateItem(item.id, { related: item.related.filter((x) => x !== target.id) });
      if (target.related.includes(item.id)) void store.updateItem(target.id, { related: target.related.filter((x) => x !== item.id) });
    }
  };

  const createChild = async () => {
    const title = newChild?.trim();
    setNewChild(null);
    if (title) await store.createItem(project.id, { type: item.type === 'epic' ? 'story' : 'task', title, status: 'backlog', parentId: item.id });
  };

  const kinds: LinkKind[] = ['parent', 'child', 'predecessor', 'related'];

  return (
    <Card
      title={t('projects.relatedWork')}
      action={
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-primary hover:bg-primary-soft">
            <Link2 size={13} />
            {t('projects.addLink')}
          </button>
          {menuOpen && (
            <div className={`${popoverClass} absolute top-full right-0 z-30 mt-1 w-48 p-1`}>
              {kinds.map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setMenuOpen(false);
                    setPicking(k);
                  }}
                  className={menuItemClass}
                >
                  {t(`projects.link.${k}`)}
                </button>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setNewChild('');
                }}
                className={menuItemClass}
              >
                <Plus size={13} />
                {t('projects.newChild')}
              </button>
            </div>
          )}
          {picking && (
            <ItemPicker
              project={project}
              items={picking === 'parent' ? projectItems.filter((i) => i.type === 'epic' || i.type === 'story') : projectItems}
              exclude={linked}
              onPick={pick}
              onClose={() => setPicking(null)}
            />
          )}
        </div>
      }
    >
      {newChild !== null && (
        <input
          autoFocus
          value={newChild}
          onChange={(e) => setNewChild(e.target.value)}
          onBlur={() => void createChild()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void createChild();
            if (e.key === 'Escape') setNewChild(null);
          }}
          placeholder={t('projects.newChildPlaceholder')}
          className={`${inputClass} py-1.5`}
        />
      )}
      <LinkGroup title={t('projects.link.parent')} project={project} items={parent ? [parent] : []} onOpen={onSelect} onUnlink={(i) => unlink('parent', i)} />
      <LinkGroup title={t('projects.link.child')} project={project} items={children} onOpen={onSelect} onUnlink={(i) => unlink('child', i)} progress />
      <LinkGroup title={t('projects.link.predecessor')} project={project} items={predecessors} onOpen={onSelect} onUnlink={(i) => unlink('predecessor', i)} />
      <LinkGroup title={t('projects.link.successor')} project={project} items={successors} onOpen={onSelect} onUnlink={(i) => unlink('successor', i)} />
      <LinkGroup title={t('projects.link.related')} project={project} items={related} onOpen={onSelect} onUnlink={(i) => unlink('related', i)} />
      {!parent && !children.length && !predecessors.length && !successors.length && !related.length && newChild === null && (
        <p className="text-xs text-muted">{t('projects.noLinks')}</p>
      )}
    </Card>
  );
}

function LinkGroup({
  title,
  project,
  items,
  onOpen,
  onUnlink,
  progress,
}: {
  title: string;
  project: Project;
  items: WorkItem[];
  onOpen: (id: string) => void;
  onUnlink: (item: WorkItem) => void;
  progress?: boolean;
}) {
  const { t } = useTranslation();
  if (!items.length) return null;
  const done = items.filter((i) => i.status === 'done').length;
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs text-muted">
        {title} ({items.length})
        {progress && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-1 w-14 overflow-hidden rounded-full bg-surface-strong">
              <span className="block h-full bg-success" style={{ width: `${(done / items.length) * 100}%` }} />
            </span>
            {done}/{items.length}
          </span>
        )}
      </div>
      <ul className="flex flex-col">
        {items.map((i) => {
          const { icon: Icon, color } = TYPE_META[i.type];
          return (
            <li key={i.id} className="group flex items-center gap-1.5 rounded px-1 py-1 text-sm hover:bg-surface-hover">
              <Icon size={13} className={`shrink-0 ${color}`} />
              <button onClick={() => onOpen(i.id)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                <span className="shrink-0 font-mono text-xs text-muted">{itemRef(project, i)}</span>
                <span className={`truncate text-text hover:underline ${i.status === 'done' || i.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>
                  {i.title}
                </span>
              </button>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[i.status].dot}`} title={t(STATUS_META[i.status].labelKey)} />
              <button
                onClick={() => onUnlink(i)}
                className="shrink-0 p-0.5 text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                aria-label={t('projects.removeLink')}
              >
                <X size={13} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Discussion({ itemId, store, photoURL }: { itemId: string; store: ProjectsStore; photoURL?: string | null }) {
  const { t, i18n } = useTranslation();
  const comments = useItemComments(itemId);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const fmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setPending(true);
    try {
      await store.addComment(itemId, body);
      setDraft('');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <AssigneeAvatar assignee="me" photoURL={photoURL} size={28} />
        <div className="flex flex-1 flex-col gap-2">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void send();
            }}
            placeholder={t('projects.commentPlaceholder')}
            className={`${inputClass} resize-y`}
          />
          {draft.trim() && (
            <button
              onClick={() => void send()}
              disabled={pending}
              className="flex items-center gap-1.5 self-end rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-hover disabled:opacity-40"
            >
              <Send size={13} />
              {t('projects.send')}
            </button>
          )}
        </div>
      </div>
      {comments && comments.length === 0 && <p className="text-sm text-muted">{t('projects.noComments')}</p>}
      {/* Newest first, like ADO Discussion */}
      {comments &&
        [...comments].reverse().map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <AssigneeAvatar assignee={c.author} photoURL={photoURL} size={28} />
            <div className={`flex-1 rounded-xl p-3 text-sm ${c.body.startsWith('WAITING:') ? 'bg-warning-soft ring-1 ring-warning/30' : 'bg-surface-hover'}`}>
              <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                <span className="font-medium text-muted">{t(`projects.author.${c.author}`)}</span>
                <span>{fmt.format(c.createdAt)}</span>
              </div>
              <div className="md-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
            </div>
          </div>
        ))}
    </div>
  );
}
