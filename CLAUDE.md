# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b (project references) + vite build — the real type-check gate
npm run lint      # eslint .
npm run preview   # preview a production build
```

There is no test suite. After any change, run `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint .` — both must be clean before considering work done.

## Architecture

Focus-Pocus is a task manager + Pomodoro timer (React 19 + TypeScript + Vite + Tailwind v4), gated behind Google sign-in with per-account Firestore-backed data. Single page, real routing via `react-router-dom` (`/tasks`, `/calendar`, `/pomodoro`), composed in `App.tsx` → `AuthGate.tsx` → `FocusDashboard.tsx` (nav rail + `<Routes>`).

### Auth gate

`App.tsx` wraps everything in `AuthProvider` (`context/AuthContext.tsx`) and renders `AuthGate.tsx`, which is the single place deciding what the user sees:
- `loading` (initial `onAuthStateChanged` resolution) → a small centered spinner.
- No `user` → `WelcomePage.tsx` (public marketing page, "Увійти через Google" button). No other route is reachable while signed out — this isn't a per-route guard, the whole app tree is swapped.
- Signed in → the full provider stack (`ConfirmProvider` → `TaskStoreProvider` → `EventStoreProvider` → `PomodoroProvider` → `FocusDashboard`) mounts for the first time.

Sign-in is Google popup only (`signInWithPopup` + `GoogleAuthProvider`, both from `config/firebase.config.ts`) — no email/password. Because the data-layer providers only mount once `user` is non-null, every `useFirestoreCollection`/`useFirestoreValue` call below is guaranteed to have a signed-in user; signing out unmounts the whole subtree so no state from one account can leak into the next account signing in.

### State: three contexts, Firestore-backed

- `TaskStoreContext` wraps `useTaskStore.ts` — lists, sections, tasks, tags.
- `EventStoreContext` wraps `useEventStore.ts` — calendar events.
- `PomodoroContext` wraps `usePomodoro.ts` — timer, settings, stats, presets.

Components consume them via `useTaskStoreContext()` / `useEventStoreContext()` / `usePomodoroContext()`, never by re-deriving state locally.

Persistence goes through `src/config/firebase.factory.ts` (`FirebaseFactory<T>` — generic `getAll`/`getById`/`create`/`update`/`delete`/`query` over one Firestore collection) and `src/config/firebase.config.ts` (`firestoreDb`, `firebaseCollections` name constants). Collections are flat and top-level (`lists`, `sections`, `tasks`, `tags`, `pomodoroPresets`, `events`), scoped per user via a `userId` field on every document and filtered with `factory.query(where('userId', '==', uid))` — not per-user subcollection paths. `pomodoroSettings`/`pomodoroStats` are singleton docs instead, **keyed by the user's uid** as the doc ID (no `userId` field needed there). `FirebaseFactory.create()` upserts at a caller-supplied `id` (via `setDoc`) rather than Firestore auto-generating one (via `addDoc`) — every record's `id` already comes from this app's own `genId()` before it ever reaches persistence.

Two hooks are the drop-in `useState` replacements that do the actual hydration/sync — this is the one swap point were the app to move off Firestore later:
- `useFirestoreCollection<T>(collectionName, seed)` — array collections. Hydrates once via `.query()`, then on every local array change diffs against the last-synced snapshot (by id) and fires `create` (upsert) for anything new/changed and `delete` for anything removed — fire-and-forget, optimistic-local-first (not real-time `onSnapshot`).
- `useFirestoreValue<T>(collectionName, initial)` — singleton values, doc ID = uid.

Both gate their persistence effect on an internal `hydrated` flag so the initial Firestore read always wins over seed data (no clobbering on mount).

### Backfilling schema changes on existing records

Fields have been added to `Task` and `TaskList` after real records already existed in users' Firestore documents (e.g. `tagIds`, `subtasks`, `pinned`, `updatedAt`, `groupBy`/`sortBy`). There is no migration step — instead `useTaskStore.ts` defines `normalizeTask`/`normalizeList` and applies them in **two places**:
1. On read, via `useMemo` over the raw collection, so every consumer sees complete objects.
2. Wrapping the setter (`setTasks`/`setLists`) so mutator callbacks — which receive `prev` from the raw Firestore-backed state — never operate on a record missing a newer field either.

When adding a new field to `Task`, `TaskList`, `Tag`, or `CalendarEvent`, extend the corresponding `normalize*` function rather than assuming existing stored records already have it.

### "Derived, not stored" state

Recurring pattern to avoid effects that reconcile state after async Firestore hydration: compute the value fresh from live collections every render instead of storing and syncing it.
- `activeListId` (`useTaskStore.ts`) falls back to the first list if the stored preference no longer matches any list.
- `activeTagId` (`TasksPage.tsx`) resets to `null` if the tag was deleted elsewhere.
- `timeLeft` (`usePomodoro.ts`) — a `started` boolean gates whether the display tracks live `settings` (idle) or the ticking `rawTimeLeft` (running), so settings edits/hydration update the idle display immediately.
- `selectedTask` (`TasksPage.tsx`) is looked up by id each render, so deleting the open task auto-closes its detail panel.

Apply this pattern for any new state that depends on a collection that might not (yet) contain a matching value.

### Tasks: lists → sections → tasks, plus cross-cutting tags

- A list's tasks are split into drag-and-drop-sortable **sections** (`@dnd-kit`) — this is the default view (`TaskList.groupBy === 'sequence'`), rendered by `TodoContainer.tsx` → `TaskSection.tsx` → `TaskRow.tsx`.
- Per-list **Group by** (`GroupBy`) / **Sort by** (`SortBy`) live on `TaskList` and are surfaced via `FilterMenu.tsx`. Picking any `groupBy` other than `'sequence'` replaces the section view with dynamic buckets computed by `groupTasksBy()` (`lib/utils.ts`) and rendered by `GroupedTaskList.tsx` — pooled across all sections in the list, no drag-and-drop, no section management. `sortBy` always applies within whichever bucket is showing (a section or a dynamic group), layered under the permanent pinned-first rule in `sortTasksBy()`.
- Tags are a separate collection (not free text) — reusable, colored, created/toggled via `TagPicker.tsx` on any task. `TagTasksView.tsx` shows a cross-list, tag-filtered view (grouped by parent list) when a tag is selected from the sidebar; `TaskRow` is reused there directly, relying on `@dnd-kit`'s `useSortable`/`useDraggable` degrading to a no-op outside a `<DndContext>` rather than throwing.
- `TaskContextMenu.tsx` and `TaskDetailPanel.tsx` are the two places task fields are edited from; both take the same set of `onSet*`/`onToggle*` callback props from their parent rather than talking to the store directly, so they stay reusable across `TaskRow`, `TagTasksView`, and the detail panel.

### Pomodoro

- `usePomodoro.ts` owns the interval-based countdown. The interval effect only ever calls `setState` from inside the `setInterval` callback, never synchronously in the effect body (required by the `react-hooks/set-state-in-effect` lint rule) — follow this shape for any timer-like logic.
- Presets (`pomodoroPresets` collection) are named, reusable duration configs; `runPreset()` deliberately builds and applies the next settings object directly (`durationFor('focus', nextSettings)`) instead of calling `setSettings()` then `start()`, since reading `settings`/`phase` right after `setSettings()` in the same call would still see the pre-update closure values.
- `activeTaskId` links a running session to a task (`startForTask()`), surfaced as a banner in `PomodoroTimer.tsx`; not persisted, cleared on `reset()`.
- `useDocumentPiP.ts` opens the Pomodoro timer in a `documentPictureInPicture` window, manually copying stylesheets into it (cross-origin sheets are skipped via try/catch — expected, not an error to fix).

## Conventions

- `tsconfig.app.json` has `types: ["vite/client"]` only — no Node globals (use `ReturnType<typeof setInterval>`, not `NodeJS.Timeout`) — and `erasableSyntaxOnly` (no TS `enum`; use a `Record<UnionType, T>` lookup instead, e.g. `PRIORITY_META`, `GROUP_BY_META`).
- `noUnusedLocals`/`noUnusedParameters` are on — this is what the `tsc` step in `npm run build` enforces.
- react-hooks lint rules actively shape the code: `set-state-in-effect` (no synchronous `setState` in an effect body — only inside a nested async/timer callback), a purity rule that flags `Date.now()` in a render body but not `new Date()`, and `exhaustive-deps` (suppressed with an explanatory comment in the one place — the timer interval effect — where adding the dep would re-arm the interval every render instead of once per tick).
- `react-refresh/only-export-components` is disabled inline (`// eslint-disable-next-line`) in the context files (`TaskStoreContext.tsx`, `PomodoroContext.tsx`, `EventStoreContext.tsx`, `ConfirmContext.tsx`, `AuthContext.tsx`) — they intentionally colocate the Provider component with its `use*`/`useAuth` hook.
- Shared Tailwind class strings live in `src/lib/ui.ts` (`inputClass`, `popoverClass`, `menuItemClass`) — reuse these for new inputs/popovers/menu items instead of restyling inline.
- Popovers close on outside-click via `useClickOutside(ref, onOutside)` (`src/hooks/useClickOutside.ts`), not `onBlur` — `onBlur` fires before a sibling element's `onClick` when that element steals focus, which silently drops the click (see `TagSidebarRow.tsx`'s color-swatch picker for the fix already applied once).
- All Ukrainian-language UI strings/labels — match this when adding new UI text.
