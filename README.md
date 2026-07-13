# Focus

A task manager and Pomodoro timer, built as a single-page React app with an original visual design. Tasks, lists, sections, tags, and Pomodoro presets all persist locally via IndexedDB (structured to mirror Firestore's collection/document shape, for an easy future migration).

## Features

**Tasks**
- Manageable lists, each split into drag-and-drop sortable sections
- Priority, due date, tags, subtasks, description, and pin-to-top per task
- Right-side detail panel for full editing; "..." context menu for quick actions
- Reusable, colored tags — create once, toggle on any task, or browse by tag from the sidebar (grouped by list)
- Per-list **Group by** (sequence/date/creation time/tag/priority/none) and **Sort by** (+ modified time/name)

**Pomodoro**
- Configurable focus/break durations and session-before-long-break count
- Named, reusable presets ("lists of pomodoros") — only one can run at a time
- Daily/total stats, and Document Picture-in-Picture scoped to just the timer
- Link a running session to a specific task from that task's menu

**Navigation**
- Real URL routing (`/tasks`, `/pomodoro`) via `react-router-dom`, with a sidebar nav rail

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@theme` tokens in `src/index.css`)
- IndexedDB via `idb` (per-collection object stores keyed by `id`)
- `@dnd-kit` for drag-and-drop, `react-router-dom` for routing, `lucide-react` for icons, `dayjs` for the date picker

## Getting started

```bash
npm install
npm run dev       # start the Vite dev server
npm run build     # type-check + production build
npm run lint      # ESLint
npm run preview   # preview a production build
```

See [CLAUDE.md](CLAUDE.md) for architecture notes and codebase conventions.
