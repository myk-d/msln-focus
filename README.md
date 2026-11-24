# Axo

Axo (formerly Focus-Pocus) is a task manager, calendar, Pomodoro timer and projects tracker in one calm place, built as a single-page React app. The brand (logo, tokens, screens) lives in [`docs/product/brand/`](docs/product/brand/index.html). Sign in with Google to use it — tasks, lists, sections, tags, calendar events, and Pomodoro presets/settings/stats all persist to Firestore, scoped to your account.

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

**Calendar**
- Calendar page (`/calendar`) with events stored per account

**Projects**
- Projects tracker (`/projects`): kanban board by status, epic / story / task / bug items with markdown descriptions, acceptance criteria and comments
- Live updates via Firestore `onSnapshot`; an owner-only HTTP Agent API (`functions/`, docs at `/api/docs`) lets coding agents read and write the same board

**Navigation**
- Real URL routing (`/tasks`, `/calendar`, `/pomodoro`, `/projects`) via `react-router-dom`, with a sidebar nav rail

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@theme` tokens in `src/index.css`)
- Firebase Authentication (Google sign-in) + Firestore, via a small generic `FirebaseFactory<T>` CRUD wrapper (`src/config/firebase.factory.ts`)
- Firebase Cloud Functions v2 (Express) for the Agent API
- `@dnd-kit` for drag-and-drop, `react-router-dom` for routing, `lucide-react` for icons, `dayjs` for the date picker

## Getting started

1. Create a Firebase project with **Authentication** (enable the Google sign-in provider) and **Firestore** enabled.
2. Copy `.env.example` to `.env` and fill in your Firebase web app config values.
3. Deploy the security rules: `npx firebase deploy --only firestore:rules` (requires `firebase login` first).

```bash
npm install
npm run dev       # start the Vite dev server
npm run build     # type-check + production build
npm run lint      # ESLint
npm run preview   # preview a production build
```

See [CLAUDE.md](CLAUDE.md) for architecture notes and codebase conventions.
