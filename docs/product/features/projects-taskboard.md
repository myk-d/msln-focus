# Projects taskboard
Status: specified   Epic: FOC-2   Updated: 2026-11-20

## Summary
The projects page gets an Azure DevOps style Taskboard: rows are stories, columns are the fixed statuses, and each story's tasks and bugs sit in the status columns to its right. Epics become a filter/group, not a row. The owner can create epics, stories, tasks and bugs manually with a chosen type and parent (including straight inside a story row), filter and search the board, and plan from a separate hierarchical Backlog view. The board scrolls horizontally on desktop when columns overflow. Columns stay fixed; the Agent API is unchanged unless strictly needed.

## Why
- **For whom:** the owner as project planner (primary), who wants to drop ADO/Jira; coding agents benefit indirectly because the board reflects the same hierarchy they write through the API.
- **Job:** see at a glance what each story still needs (its tasks and bugs by status), create work in the right place, and plan from a hierarchical backlog, without a flat pile of mixed items per column.
- **Value:** the board shows work grouped by story, like ADO, so the owner can run daily planning here instead of in ADO/Jira.
- **Success signals:** (1) the owner plans and moves items on this board for a full week without opening ADO/Jira; (2) a new task or bug is created inside its story row, with the parent set, in one step (no later re-parenting).

## Users & scenarios
- **Owner as project planner (primary):** runs daily planning on the board instead of ADO/Jira.
- **Coding agents (indirect):** write items through the Agent API; the board shows their changes live, grouped by the same hierarchy.

Scenarios:
1. Open a project: see one row per story with its tasks/bugs in status columns; collapse finished stories.
2. Add a task or bug inside a story row: it lands with that story as parent, in one step.
3. Add an epic or story from the Backlog view, choose a parent epic.
4. Narrow the board by epic, type, assignee, or text/ref search; clear all filters in one click.
5. Plan in the Backlog view: hierarchical list epic > story > task/bug.
6. On a narrow desktop window, scroll right to reach `done`/`cancelled` columns.

Current behaviour (verified in code):
- `ProjectBoard.tsx`: one flat column per status (`BOARD_STATUSES`, plus `cancelled` behind a toggle), all types mixed; card shows parent ref/title and a done/total child count. Each column has a quick-add: title and type icons (TYPE_ORDER: story, task, bug, epic), status = that column. Parent cannot be chosen there (`onCreate` gets no `parentId`), though `createItem`/`NewItemInput` already support `parentId`.
- Parent can only be set afterwards in `ItemDetailPanel.tsx` (link picker: parent limited to epic/story; "new child" creates story under epic, task otherwise, status backlog). So epics are creatable only via the column quick-add without a parent, or via the type icons.
- Filters in `ProjectsPage.tsx`: type chips and show/hide cancelled only. No search, assignee or epic filter.
- Horizontal scroll: the board container already has `overflow-x-auto` and columns `w-72 shrink-0`, and the parent chain (`FocusDashboard` wrapper `overflow-hidden`, `main min-w-0 flex-1`) looks correct on paper, so the cause is not found by reading. Needs reproduction in a browser (S1). Suspects: the `h-full`/`flex-1` height chain, the detail panel overlay, or touch-none/drag sensors capturing wheel/drag.

## Requirements
1. Board is a Taskboard: one row per story; columns are the fixed statuses; the first column is the story itself.
2. A story row can be collapsed and expanded; collapsed state does not lose its children and the story shows progress "{done} of {total} done". Collapse state is in memory only: after a reload all stories are expanded.
3. Tasks and bugs appear in the row of their parent story, in the cell of their status. Dragging a card to another status cell of the same row changes its status; dragging to another row does not re-parent (re-parent via the detail panel or create form).
4. A "No story" row holds all non-epic, non-story items without a parent, and stories that have no children appear as a row with an empty-row message.
5. Epic is not a row: it works as a filter (and optional grouping) over its stories; a task whose parent is an epic is shown in "No story".
6. The board scrolls horizontally on desktop when columns overflow, without breaking the sticky story column or drag-and-drop. Below `md` (768 px) the board is a stacked per-story card list instead of the grid (no horizontal scroll).
7. Manual creation of epic, story, task and bug with a chosen type and a parent chosen from valid candidates (task/bug: story or epic; story: epic or none; epic: none), available inside a story row and in the Backlog view. The created item gets its ref via the existing transaction.
8. Board filters: type, assignee, epic, plus search by title or ref (case-insensitive substring on both, so `1` matches FOC-1 and FOC-12), with a "Clear filters" action; existing show-cancelled toggle is kept. Filters are not persisted: they reset on reload and when switching Board/Backlog.
9. A separate Backlog view (view toggle Board / Backlog) shows a hierarchical list epic > story > task/bug with status, with "New epic" / "New story" actions and the same filters and search.
10. All new strings exist in uk and en (see Copy); no hard-coded text.
11. No changes to Agent API, Firestore schema or column set; data access stays `onSnapshot` + single-field `updateDoc`.

Out of scope: attachments, change history, sprints/iterations, custom columns or column management, re-parenting by dragging between rows, swimlane config, Agent API changes (only if strictly required, then bump `API_VERSION` and update `spec.ts`).

Edge cases (apply to the stories below):
- Empty project: show "No items yet. Add your first story."; empty story row: "This story has no tasks yet"; empty status cell stays blank.
- Many items: a cell with many cards scrolls or grows without breaking row alignment; many stories scroll vertically with the header kept visible.
- Long titles: story and card titles truncate/clamp (no horizontal overflow); full title in tooltip or detail panel.
- Orphan children: an item whose parent was deleted (parentId detached) or points to a missing id goes to "No story", never disappears.
- Cancelled: cancelled items are hidden unless the toggle is on; a story that is cancelled is still a row when the toggle is on; progress counts exclude cancelled children.
- Parent is an epic: a task directly under an epic appears in "No story"; epic filter matches both its stories and their descendants.
- Filters hide non-matching cards; a story row stays visible if it or any child matches; a row with zero visible children under an active filter shows "Nothing found" only when nothing matches at all.
- Item type changed in the detail panel (e.g. task to story): the board re-places it on the next render.
- Agent changes arrive live and must not reset collapse state, scroll position or filters.

## UX
Reuse: `inputClass`/`popoverClass`/`menuItemClass` (`src/lib/ui.ts`), `useClickOutside` for popovers, `TYPE_META`/`STATUS_META`/`AssigneeAvatar`, the existing pill-style chips from `ProjectsPage` header, the existing `ItemCard`, `ItemDetailPanel` (unchanged), and the spinner/empty states already in `ProjectsPage`.

### Decisions (resolves the open questions)
- **Epic is only a filter**: confirmed (Req. 5). A task directly under an epic goes to "No story". Flag for the owner: such tasks lose visible epic context, so the "No story" card keeps its parent chip (epic ref) like today's card.
- **Drag never re-parents**: confirmed. Dropping on another row snaps back with no change; only same-row cells accept the drop (other rows' cells do not highlight).
- **Sticky first column on desktop (grid, `md` and up).** Story column `w-64`, `sticky left-0`, solid background and a right shadow when scrolled. Header row (status names) sticky at top. This keeps the story visible while scrolling to `done`.
- **Mobile (below `md`): stacked per-story cards, not the grid.** Why: a 160 px sticky column leaves about 200 px for cells on a 375 px phone, so 5-6 status columns mean constant swiping and a long-press drag that fights scroll; a card per story with its children grouped under status headings reads top to bottom with no sideways scroll. Cost: one extra presentational component over the same `buildTaskboard` data (S2a stays M, upper end); mobile drag is dropped (status via the detail panel), which removes touch work from S2b.
- **Collapse state is not persisted** (owner decision 2026-11-20): plain in-memory state, all stories expanded after reload.
- **Filters are not kept** when switching Board/Backlog (reset on switch) and reset on reload (owner decision 2026-11-20).
- **Marketer's assumption (epics/stories created in Backlog) is partly wrong for the board**: AC S3-AC6 also puts "New story" / "New epic" in the board toolbar. Decision: one "New" split action in the toolbar of both views, choosing epic / story (opens the same small form); the Backlog additionally has per-group "add" actions. Copy needs one extra key: "New" (uk "Створити"). "Add task" copy label in a story row also covers bugs via the type select.
- **Quick-add is a form row, not a popover**, so it never fights drag/scroll (see Creation).

### Screen: header and toolbar
Desktop: `[Project key + name]  [Board | Backlog segmented toggle]  ... [Search] [Type v] [Assignee v] [Epic v] [Clear filters] [Show cancelled] [New v]`. Replaces the type chips (they become the Type select, S4-AC6). Mobile: project select stays; second line holds toggle + "New"; search full width; filters collapse behind one "Filters" button opening a popover (`popoverClass`) with the three selects, with a count badge of active filters.
- Toggle choice stored in `localStorage` (try/catch, same as project pref); default Board. Switching the view resets all filters and search.
- Search is debounced-free (client-side); case-insensitive substring over ref and title (`1` matches FOC-1 and FOC-12); `/` focuses search, Escape clears it while focused.
- "Clear filters" appears only when something is active (S4-AC4); the show-cancelled toggle is not part of clear.

### Screen: Board (Taskboard)
Layout (`md` and up): one scroll container (both axes) inside `main`; header row and story column sticky. Below `md` see "Board on mobile".
```
| Story (sticky)        | Backlog | To do | In progress | In review | Done | [Cancelled] |
| v [S] FOC-3 Title     |  card   |       |   card      |           | card |             |
|   2 of 3 done  [+]    |         |       |             |           |      |             |
| > [S] FOC-9 Title ... (collapsed: story column only, thin row)                           |
| No story (n)          |  ...                                                           |
```
- Story cell: chevron button (aria-label Collapse/Expand story, `aria-expanded`), type icon, ref (mono), title clamped to 2 lines with `title` tooltip, assignee avatar, progress "{done} of {total} done" plus thin progress bar, and an "Add task" button. Click on the title opens the detail panel; click on chevron only toggles.
- Status columns `w-72 shrink-0` as today; each header shows status dot, name, count over visible cards. Counts exclude hidden-by-filter cards.
- Row height grows with the tallest cell; cells align across the row (CSS grid with shared `grid-template-columns`, one grid for header + all rows so columns line up). Cells with many cards just grow (no inner scroll); the board scrolls vertically.
- Collapse state: per story, in memory only (not persisted; all expanded after reload); default expanded; a "Collapse all / Expand all" icon button sits in the story column header. Collapsed row still shows progress. Live agent updates never reset it (keyed by story id).
- Rows order: stories by `sortItems` (priority/number), "No story" last; hidden when empty. Epics never render.
- Cancelled column appears only with the toggle; a cancelled story keeps its row (muted, strikethrough title).

States:
- Loading: existing centered spinner. Error (snapshot fails): inline message with Retry in place of the board, reuse empty-state layout; no new copy needed beyond a generic existing error string (flag: add one if none exists).
- Empty project: centered folder icon + "No items yet. Add your first story." + primary "New story" button.
- Empty story row: in the cell area spans the status columns, muted one line "This story has no tasks yet"; empty status cells are blank, stay droppable.
- Filters with no matches at all: "Nothing found" centered + "Clear filters" link. A story row whose children are all filtered out but the story itself matches shows blank cells (no message).
- Orphans/epic-parented go to "No story" and show parent chip.

### Board on mobile (below `md`)
One card per story in a vertical list (same row order, "No story" last). Card header: chevron, type icon, ref, title (2 lines), assignee, progress "{done} of {total} done" + bar, "Add task" button. Expanded body: children grouped under status headings (dot + name + count), only non-empty statuses shown, in `BOARD_STATUSES` order; cards are `ItemCard`s, tap opens the detail panel. No drag on mobile: status changes via the detail panel. Empty story: the "This story has no tasks yet" line. Collapse, Collapse all, empty/orphan/cancelled rules and filters are the same as on desktop. The hover `+` per cell does not exist here; "Add task" opens the same inline form (status backlog). No horizontal scroll, 36 px touch targets.

### Horizontal scroll (S1)
Single scroller with `overflow-auto`, `min-w-0` all the way up (`main`, board wrapper), page never scrolls horizontally. Shift+wheel and trackpad work natively; do not capture wheel in dnd sensors. While dragging near the left/right edge, dnd-kit auto-scroll applies (keep its default on). Detail panel opens as an overlay/side sheet that does not shrink the scroller's measured width below its content (scroll preserved). A fade shadow on the right edge hints more columns. Touch devices at `md` and up (tablets): touch drag uses a long-press sensor (`TouchSensor`, 250 ms delay) so swipe scroll is not hijacked (a likely cause of the current bug: card `touch-none`). Below `md` there is no grid and no horizontal scroll.

### Drag within a row
- Droppable id per cell = `{storyId|none}:{status}`; only cells of the active card's row are valid targets, others get no hover style. Valid cell shows today's `bg-brand-50 ring-2 ring-brand-200`. A `DragOverlay` shows the card so it is not clipped by the scroller.
- Drop in same cell: nothing. Drop outside valid cell: card returns. Status persists via the existing single-field update.
- Keyboard: dnd-kit `KeyboardSensor` (Space to lift, arrows move between cells of the same row, Space to drop, Escape cancels) with a live-region announcement; the detail panel status field is the always-available alternative. Below `md` drag is disabled; the detail panel is the way to change status (tap the card).

### Creation flows
1. **Add task/bug in a story row** (S3-AC1): "Add task" in the story cell (and a small `+` in each empty status cell on hover/focus, which presets that status) opens an inline form row under the story cell: title input (autofocus), type select (Task default, Bug), parent select preselected to the story, Add button. Enter submits, Shift+Enter not needed (single-line input), Escape cancels and returns focus to the button, whitespace title is ignored, title trimmed. After submit the form stays open with cleared title for rapid entry; the new card appears live in the right cell (brief highlight ring). Status defaults to backlog, or the cell status if opened from a cell.
2. **"No story" row** has the same form with parent select empty ("No story") but changeable.
3. **Toolbar "New"** (epic / story / task / bug): small popover form (`popoverClass`) with type select first; the parent select options update by type: epic none, story epic or none, task/bug story or epic or none (invalid combos never listed, S3-AC2). Desktop: popover under the button; mobile: full-width bottom sheet style panel.
4. The old per-column quick-add is removed (S3-AC7). Type chips in cards forms become a select (clearer, keyboard friendly, fits parent logic).
- Failure to create: keep the typed title, show inline error under the input, no toast loss.

### Screen: Backlog view
Single scrolling list, no status columns. Indent levels: epic (level 0) > story (1) > task/bug (2). Each row: chevron (groups only), type icon, ref, title (truncate, tooltip), status badge (`STATUS_META` dot + label), assignee avatar. Row click opens `ItemDetailPanel`; chevron toggles. Epic and story groups collapsible, default expanded, state in memory only like the board (not persisted); groups show "{done} of {total} done". Final group "No story" holds stories without epic and loose tasks (stories rendered at level 1 under a "No epic" sub-heading is out; keep the single "No story" group per S5-AC3). Actions: toolbar "New epic" / "New story"; hover/focus `+` on an epic row adds a story under it, on a story row adds a task/bug (same inline form as the board, parent preset). Empty: "The backlog is empty" + New epic / New story buttons. Same filters/search as the board; matching ancestors of a match stay visible, auto-expanded while a filter is active. Mobile: indent reduced to 12 px per level, status badge as dot + short label, assignee hidden below `sm`. No drag in Backlog (out of scope).

### Keyboard and a11y
Toolbar controls tab in visual order; toggle is a `role=radiogroup` of two buttons (`aria-pressed`). Cards are buttons/links reachable by Tab (Enter opens detail). Story cell and rows use `role=row`/`gridcell` semantics (grid with column headers); chevron has `aria-expanded` and the required aria labels. Focus ring uses existing brand ring classes; status is never conveyed by colour alone (dot + label). Touch targets at least 36 px on mobile. `prefers-reduced-motion`: no collapse animation.

### Friction in current flows (for the record)
Per-column quick-add gives no parent (`ProjectBoard.tsx` BoardColumn); parent only via detail-panel link picker; flat mixed columns hide story context; no search/assignee/epic filter (`ProjectsPage.tsx` chips); horizontal scroll and touch-none drag suspected conflict.

### Open questions for the owner
- Should "Add task" also be reachable by keyboard shortcut (e.g. `n`)? Assumed no for v1.
(Collapse persistence, mobile layout, search matching and filter persistence are decided, see Decisions above and "Decisions & open questions" below.)

## Copy
Sentence case, short. Proposed keys; reuse existing status/type labels already in `src/i18n/`.

| Where | uk | en |
|---|---|---|
| View toggle: board | Дошка | Board |
| View toggle: backlog | Беклог | Backlog |
| Story column header | Історія | Story |
| Row for items without a parent | Без історії | No story |
| Collapse / expand story (aria) | Згорнути історію / Розгорнути історію | Collapse story / Expand story |
| Story progress | {done} з {total} виконано | {done} of {total} done |
| Search placeholder | Пошук за назвою або ключем | Search by title or ref |
| Filter: type | Тип | Type |
| Filter: assignee | Виконавець | Assignee |
| Filter: all (option) | Усі | All |
| Clear filters | Скинути фільтри | Clear filters |
| Quick-add in story row (button) | Додати завдання | Add task |
| Quick-add placeholder | Назва нового елемента | New item title |
| Quick-add: type select label | Тип елемента | Item type |
| Quick-add: parent select label | Історія | Story |
| New epic / new story (backlog) | Новий епік / Нова історія | New epic / New story |
| Empty board (no items) | Тут ще немає елементів. Додайте першу історію. | No items yet. Add your first story. |
| Empty story row | У цій історії ще немає завдань | This story has no tasks yet |
| Empty backlog | Беклог порожній | The backlog is empty |
| No filter/search results | Нічого не знайдено | Nothing found |
| Empty status cell | (no text; keep blank) | (no text; keep blank) |

## Technical approach
Verified against code; no Firestore schema, API, rules or index changes (confirmed: `createItem` already takes `parentId`, transaction numbering on `projects/{id}.nextNumber` stays; all filtering/grouping is client-side over `projectItems`). Agent API untouched, so no `spec.ts` change and no `API_VERSION` bump. Data access stays `onSnapshot` (`useProjectsStore`) + single-field `updateDoc`; never `useFirestoreCollection`.

**Scroll root-cause hypotheses (S1, in order of likelihood).**
1. `src/index.css` hides every scrollbar (`* { scrollbar-width: none }` + `::-webkit-scrollbar { display: none }`), so the board's `overflow-x-auto` works but is invisible on desktop mouse setups with no shift+wheel; AC1 "by scrollbar" cannot hold. Fix: opt the board scroller out (a `.scrollbar-visible` utility, thin styled bar) and keep the right-edge fade.
2. Board scroller is `flex flex-1` inside `main flex flex-col` without `min-h-0`; columns hold `overflow-y-auto` with no bounded height, and `FocusDashboard` wrapper is `overflow-hidden`, so vertical overflow is clipped and the horizontal bar sits below the fold (`h-dvh` + `h-full` chain: add `min-h-0` on `main` and the scroller).
3. Cards are `touch-none` with a `PointerSensor` only, which blocks touch swipe-scroll; `html, body { overflow-x: hidden }` is not a cause (scroller is inside).
4. Detail panel is `fixed` overlay, so it does not resize the scroller (rule out). Reproduce in a browser first and record the finding in the S1 note.

**Layout (S2a).** One CSS grid inside a single scroller (`overflow-auto min-h-0 min-w-0 flex-1`): `grid-template-columns: 16rem repeat(N, 18rem)`, N = 5 or 6 with cancelled; rendered at `md` and up. Below `md` a separate `TaskboardStack` component renders the same `buildTaskboard` rows as per-story cards with status groups (switch by `useMediaQuery`-style `matchMedia('(min-width: 768px)')` hook, or Tailwind `hidden md:block` / `md:hidden` on two siblings; prefer the hook so only one tree mounts and dnd is not registered on mobile). Header cells `sticky top-0`, story cells `sticky left-0` (corner cell sticky both, higher z-index), solid backgrounds. Use `display: contents` row wrappers (`role=row`) so cells share tracks; per-row flex would misalign columns. Pure grouping helper in `src/lib/projects.ts` (`buildTaskboard(items, filters)` returning rows `{story|null, children by status, done, total}`; "No story" = non-epic/non-story with no parent, missing parent, or epic parent; epics skipped; progress excludes cancelled), kept out of the component and testable. Reuse `ItemCard` (move to `ItemCard.tsx`, drop its own parent chip only for cards under a story), `AssigneeAvatar`, `TYPE_META`, `STATUS_META`, `ItemDetailPanel` unchanged.

**DnD (S2b).** Keep `DndContext`; droppable ids `${storyId ?? 'none'}:${status}` (parse with `lastIndexOf(':')`; ids are `genId()`, no colon risk but guard). Card draggable `data: {rowKey}`; cell uses `disabled` when active card's `rowKey` differs (no hover style). Sensors: `PointerSensor` (distance 6) for mouse, `TouchSensor` (delay 250, tolerance 8), `KeyboardSensor` (default coordinate getter works with grid cells), plus `accessibility.announcements` in uk/en. `DragOverlay` for the dragged card (portal, not clipped by the scroller); drop on a different row cell does nothing. Drop handler reuses `onMove(id, status)`. Remove `touch-none` from the card (keep it only on the drag handle if swipe still conflicts).

**State (derived, not stored).** Filters (`type`, `assignee`, `epicId`, `query`) are `useState` in `ProjectsPage`, applied by one `filterItems` pure function; epic filter that no longer exists resets to null at render. Collapse state: plain `useState<Record<storyId, boolean>>` (in memory, no `localStorage`, no `usePersistedState`; resets on reload and project change). Only the view toggle is persisted, key `projects.view`, read/write in try/catch like `PROJECT_PREF_KEY` (inline, no new hook). Filters are plain `useState`, reset in the view-switch handler (not in an effect). Keyed by id, so live agent snapshots never reset collapse. No `useEffect` reconciliation.

**Create (S3).** `NewItemForm` component (inline row for story rows, popover for toolbar, `inputClass`/`popoverClass`, `useClickOutside`); `valid parents by type` helper in `projects.ts` (epic: none; story: epic; task/bug: story or epic). Calls `store.createItem(projectId, { type, title: trimmed, status, parentId })`; no store change. Error keeps the title. Remove `BoardColumn` quick-add.

**Backlog (S5).** Tree built by a second pure helper (epic > story > task/bug, orphans to final "No story"), simple list, no dnd; reuses filters and the same in-memory collapse approach.

**i18n keys to add** (`src/i18n/locales/en.ts` + `uk.ts`, under `projects.*`; reuse `allTypes`, `add`, `status.*`, `type.*`, `author.*`, `showCancelled`/`hideCancelled`): `view.board`, `view.backlog`, `taskboard.storyColumn`, `taskboard.noStory`, `taskboard.collapseStory`, `taskboard.expandStory`, `taskboard.collapseAll`, `taskboard.expandAll`, `taskboard.progress` ({{done}}/{{total}}), `search.placeholder`, `filter.type`, `filter.assignee`, `filter.epic`, `filter.all`, `filter.unassigned`, `filter.filters`, `filter.clear`, `create.new`, `create.addTask`, `create.titlePlaceholder`, `create.typeLabel`, `create.parentLabel`, `create.noParent`, `create.newEpic`, `create.newStory`, `create.error`, `empty.board`, `empty.story`, `empty.backlog`, `empty.noResults`, `dnd.pickedUp`/`dnd.movedTo`/`dnd.dropped`/`dnd.cancelled`, `loadError`/`retry` (no generic error string exists), "New" key from UX decision. Spec Copy table is not extended.

**Risks.** (1) Sticky + CSS grid + dnd-kit transforms: z-index stacking and `DragOverlay` offsets inside a scrolled container. (2) Keyboard sensor over a grid with variable-height cells needs manual check. (3) `ProjectsPage` already 173 lines and holds all filter state; extract toolbar to `ProjectToolbar.tsx`. (4) Epic-parented tasks losing context (mitigated by parent chip). (5) No test suite; the pure helpers (`buildTaskboard`, `filterItems`, `validParents`) are the only unit-testable parts, but the repo has no web test runner, so verification is tsc + eslint + manual browser.

**S2 split (done).** S2a is the grid, grouping helper, collapse, progress and empty/orphan/cancelled states; S2b is in-row drag (droppable ids, sensors incl. touch/keyboard, overlay, announcements). S3 and S4 depend on S2a only.

**Recommended order.** S1 (reproduce, fix) > S2a > S2b (parallel with S3) > S3 > S4 > S5.

## Stories
### S1 Fix horizontal scroll on the board — FOC-3  size S  depends on: —  manual (needs browser reproduction; root cause unconfirmed)
- AC1. In a desktop browser with columns wider than the viewport, the board scrolls horizontally by trackpad/wheel (shift+wheel) and by scrollbar, reaching the last column.
- AC2. The page itself does not scroll horizontally, and the nav rail and header stay in place.
- AC3. Opening the item detail panel does not hide or break the scrollable area.
- AC4. Dragging a card still works while scrolled right.
- AC5. Root cause is recorded in the story note.

Test scenarios (qa):
- T1 [browser] (AC1) Given a project with 6+ items across all columns and a 1280 px window, When shift+wheel / trackpad swipe / dragging the visible scrollbar, Then the board reaches the last column (Done, and Cancelled with the toggle on). Negative: scrollbar is visible (not hidden by the global `scrollbar-width: none`).
- T2 [browser] (AC2) Given the board scrolled fully right, When checking the page, Then `document.documentElement.scrollWidth <= clientWidth`, nav rail and header did not move.
- T3 [browser] (AC3) Given scrolled right, When opening an item detail panel and closing it, Then the scroll offset is unchanged and the scroller is still scrollable with the panel open.
- T4 [browser] (AC4) Given scrolled right, When dragging a card to the next column, Then it moves and persists after reload; dragging near the right edge auto-scrolls.
- T5 [browser] (AC1) Given a short window (height 500 px) and many items, Then the horizontal scrollbar is reachable without scrolling the page (not below the fold).
- T6 [browser] (AC1, edge) Given a narrow window (800 px) and touch emulation, When swiping horizontally on a card, Then the board scrolls and no drag starts.
- T7 [manual] (AC5) Given the fix, Then the story note names the confirmed cause (scrollbar hidden / height chain / touch-none) with the reproduction steps.

### S2a Taskboard grid with story rows and sticky columns — FOC-4  size M  depends on: S1  manual (visual layout needs human check)
- AC1. Each story is a row: first column shows the story (ref, title, progress "{done} of {total} done"), status columns show its tasks/bugs by status.
- AC2. A story row can be collapsed/expanded (button with aria label Collapse/Expand story); collapsed shows only the story column. State is in memory: after reload all stories are expanded.
- AC3. Items without a parent (non-epic, non-story) and children of epics appear in a "No story" row; the row is hidden when empty.
- AC4. Empty project, empty story row, long titles, orphan children and cancelled items behave as in the edge cases.
- AC5. Epics are not shown as rows; an epic's own status is not a card on the board.
- AC6. Story column stays visible while scrolling horizontally (sticky), and the status header row stays visible while scrolling vertically (`md` and up).
- AC7. Below `md` the board is a vertical list of story cards; children are grouped under status headings (non-empty statuses only); no horizontal scroll; tapping a card opens the detail panel; no drag.

Test scenarios (qa):
- T1 [browser] (AC1) Given a story with 1 task (todo), 1 bug (done), 1 cancelled task (toggle off), Then the row shows the story ref/title, "1 of 2 done" (cancelled excluded), cards in the correct cells; header counts match visible cards.
- T2 [browser] (AC2) Given an expanded story, When clicking the chevron (aria-label Collapse story, `aria-expanded` true to false), Then only the story column remains with progress still shown; a click on the title opens the detail panel instead; after reload all stories are expanded again (nothing stored in localStorage); Collapse all / Expand all works.
- T3 [browser] (AC2, edge) Given a collapsed story, When an agent adds a child via API, Then the row stays collapsed and the count updates live.
- T4 [browser] (AC3, AC4) Given a task with no parent, a task whose parent was deleted, and a task under an epic, Then all three are in "No story" (with parent chip for the epic one); with none, the row is hidden.
- T5 [browser] (AC4) Given an empty project, Then "No items yet. Add your first story." plus "New story" is shown; given a story with no children, Then "This story has no tasks yet" spans the status columns; empty cells stay blank.
- T6 [browser] (AC4, edge) Given a 200-character title with no spaces, Then story and card titles clamp with a tooltip, with no horizontal overflow of the cell.
- T7 [browser] (AC4, edge) Given 30 tasks in one cell and 40 stories, Then row alignment holds across columns and the board scrolls vertically with the header visible.
- T8 [browser] (AC4) Given a cancelled story and the toggle on, Then it is a muted row with a strikethrough title, with the Cancelled column present; with the toggle off it disappears.
- T9 [browser] (AC5) Given an epic with stories, Then no epic row/card exists; changing a task to type story in the detail panel re-places it as a row on the next render.
- T10 [browser] (AC6) Given scrolled right and down, Then story cells stay at the left with a solid background (no card showing through) and the header stays at the top; the corner cell sits above both.
- T11 [browser] (AC7) Given a window under 768 px (375 px phone), Then stories are stacked cards with children under status headings (empty statuses omitted), no horizontal scroll (`scrollWidth <= clientWidth`), chevron collapse and Collapse all work, tap on a card opens detail, long-press does not start a drag, targets at least 36 px; toggling uk/en does not break layout; resizing across 768 px switches layout without losing collapse state.
- T12 [browser] (AC1, a11y) Given keyboard only, Then Tab reaches chevron, title, "Add task", cards in visual order; Enter on a card opens detail; focus ring visible.
- T13 [auto-candidate] (AC1, AC3, AC4, AC5) `buildTaskboard`: epics skipped, orphan/missing parent/epic parent to No story, progress excludes cancelled, stories sorted, empty arrays.

### S2b Drag within a row — FOC-5  size M  depends on: S2a  manual (dnd feel, touch and keyboard need human check)
- AC1. Dragging a card between status cells within its row changes its status; dropping in the same cell changes nothing.
- AC2. Dropping onto a cell of another row, or outside any cell, does not change the parent or status and the card returns; other rows' cells show no hover style.
- AC3. Mouse drag starts after a short distance; touch drag (tablets, `md` and up) starts after a long press (250 ms) so horizontal swipe scroll still works; a dragged card is shown in a DragOverlay not clipped by the scroller. Below `md` there is no drag.
- AC4. Keyboard: Space lifts a card, arrows move it between cells of the same row, Space drops, Escape cancels; screen-reader announcements (picked up, moved to, dropped, cancelled) exist in uk and en.

Test scenarios (qa):
- T1 [browser] (AC1) Given a card in To do, When dragging it to In progress in the same row, Then status changes and persists after reload; dropping in its own cell changes nothing and sends no write.
- T2 [browser] (AC2) Given two story rows, When dragging a card from row A over row B cells, Then B cells show no highlight; on drop the card returns, parentId and status are unchanged. Dropping on the header, outside the board or on the story column also returns it.
- T3 [browser] (AC1, edge) Given an empty target cell, Then it is droppable; given a cell with many cards, drop still works.
- T4 [browser] (AC3) Given a mouse, Then a click without 6 px movement opens the detail (no drag); drag shows a DragOverlay not clipped at the scroller edge, including while scrolled right/down.
- T5 [browser] (AC3) Given touch emulation at 1024 px (tablet), Then a swipe scrolls the board, a 250 ms long press then move drags; a tap opens detail.
- T6 [browser] (AC4) Given keyboard only, When Space, ArrowRight, Space, Then the card moves one cell and persists; Escape mid-drag restores it; arrows never leave the row.
- T7 [manual] (AC4) With a screen reader (or the live region inspected), announcements for picked up / moved to / dropped / cancelled are read in uk and en.
- T8 [browser] (AC1, edge) Given an agent changes the item status via API during a drag, Then no crash, the final state matches the last write.
- T9 [browser] (AC1) Given the "No story" row, Then in-row drag works the same way and orphans do not move rows.

### S3 Create epic, story, task, bug with type and parent — FOC-6  size M  depends on: S2a  auto (store unchanged, pure helper + form)
- AC1. Each story row has an "Add task" action opening a quick-add with title, item type (task, bug) and the story preselected as parent; submit creates the item with that parentId and status backlog (or the cell's status if added from a cell).
- AC2. A quick-add has a parent select limited to valid candidates and a type select; invalid combinations (e.g. epic with parent) are not offered.
- AC3. A task/bug can also be created in "No story" with parent empty or chosen.
- AC4. Empty or whitespace-only title is not created; Enter submits, Escape cancels, title is trimmed.
- AC5. The created item gets the next ref via the existing transaction and appears live in the correct row and cell.
- AC6. A story can be created (with optional epic parent) and an epic created from the board toolbar.
- AC7. The old per-column quick-add is removed or replaced so there is one clear way to add.

Test scenarios (qa):
- T1 [browser] (AC1, AC5) Given story FOC-3, When "Add task", typing a title and Enter, Then a task with parent FOC-3, status backlog and the next ref appears live in the Backlog cell with a brief highlight; the form stays open with an empty title and focus.
- T2 [browser] (AC1) Given the hover `+` of the In progress cell, Then the created item has status in-progress.
- T3 [browser] (AC1) Given type Bug in the select, Then a bug is created under the story.
- T4 [browser] (AC2) Given the toolbar "New" with type epic, Then the parent select is empty/disabled; for story only epics + none; for task/bug story, epic, none; switching the type resets an invalid parent.
- T5 [browser] (AC3) Given the "No story" row, Then the form has an empty parent; choosing a story and submitting places the card in that story's row, not in "No story".
- T6 [browser] (AC4, edge) Given empty or spaces-only title, Then Enter creates nothing and no write is made; "  Fix login  " is saved as "Fix login"; Escape closes and returns focus to "Add task"; a 300-character title does not break the layout.
- T7 [browser] (AC4, edge) Given double Enter quickly, Then no duplicate items (or a duplicate is judged acceptable and noted); Enter during IME composition does not submit.
- T8 [browser] (AC5) Given two items created fast (and one by an agent at the same time), Then refs are unique and sequential (FOC-n, FOC-n+1) and no gaps are reused.
- T9 [browser] (AC6) Given the toolbar "New" > story with epic E, Then the story gets parentId E, shows as a row (empty-row message); a new epic creates no card or row but appears in the epic filter.
- T10 [browser] (AC7) Then no per-column quick-add remains in any column, including Cancelled.
- T11 [browser] (failure) Given offline / a rejected write, Then the title stays in the input and an inline error shows under it.
- T12 [browser] (AC1, edge) Given a window under 768 px, Then the toolbar form is a full-width panel, 36 px targets; keyboard Tab order is title, type, parent, Add.
- T13 [browser] (edge) Given a story is deleted/cancelled while its form is open, Then submit does not crash (item lands in "No story" or the error shows).
- T14 [auto-candidate] valid parents by type; trimmed-title guard.

### S4 Filters and search — FOC-7  size M  depends on: S2a  auto (pure filter helper + toolbar)
- AC1. Search by case-insensitive substring over title or ref (`FOC-12`, `12`, `1` matches FOC-1 and FOC-12) hides non-matching cards; a story row stays if the story or any child matches.
- AC2. Filters: type, assignee (including unassigned), epic; options include "All"; combinable with search.
- AC3. Epic filter shows the epic's stories and their children.
- AC4. "Clear filters" resets type, assignee, epic and search at once; shown only when a filter is active.
- AC5. No matches shows "Nothing found" instead of an empty board.
- AC6. The existing type chips are migrated into the filter without losing the show-cancelled toggle.
- AC7. Filters persist while items change live (agent updates).
- AC8. Filters and search are reset when switching Board/Backlog and on reload (not stored anywhere).

Test scenarios (qa):
- T1 [browser] (AC1) Given items "Login bug" (FOC-12) and "Signup", When searching "LOGIN", "foc-12" and "12", Then only matching cards stay; the story row stays if the story or any child matches; a row whose children are all hidden but the story matches shows blank cells with no message.
- T2 [browser] (AC1, edge) Given a query with regex characters (`(`, `*`, `\`), Then no crash and it is a literal match; "1" matches FOC-1 and FOC-12 and any title containing "1" (case-insensitive substring on ref and title, owner decision).
- T3 [browser] (AC2) Given Type = Bug, Assignee = Claude, Then both apply (AND) and combine with search; Assignee "Unassigned" shows only items without an assignee; "All" resets one select.
- T4 [browser] (AC3) Given the epic filter on E, Then E's stories and their children show; tasks directly under E show in "No story"; items of other epics are hidden; epic with no stories shows "Nothing found".
- T5 [browser] (AC3, edge) Given the selected epic is deleted elsewhere, Then the filter resets to All at the next render with no stuck empty board.
- T6 [browser] (AC4) Given no filter active, Then "Clear filters" is not shown; with any (search, type, assignee, epic) it appears; one click resets all four; the show-cancelled toggle stays as it was.
- T7 [browser] (AC5) Given a query matching nothing, Then "Nothing found" with a "Clear filters" link replaces the board; header counts show 0.
- T8 [browser] (AC6) Then no type chips remain; the Type select covers the same types; show-cancelled works with filters (a cancelled match appears only with the toggle on).
- T9 [browser] (AC7) Given active filters and a collapsed story, When an agent creates/changes/deletes items via API, Then filters, search text, collapse and scroll position are unchanged and the new item obeys the filters.
- T10 [browser] (UX) `/` focuses search (but not while typing in another input), Escape clears it while focused.
- T11 [browser] (UX, narrow) Under 768 px, filters sit behind a "Filters" button with a count badge; the popover closes on outside click; search is full width.
- T12 [browser] (AC8) Filters apply the same in the Backlog view; with type, assignee, epic and search set, switching Board to Backlog (and back) clears all of them and "Clear filters" disappears; after reload filters are empty.
- T13 [auto-candidate] `filterItems`: case, ref forms, unassigned, epic descendants, empty query.

### S5 Backlog view — FOC-8  size M  depends on: S3, S4  auto
- AC1. A toggle Board / Backlog in the project header switches views; the choice survives a reload (per viewer).
- AC2. Backlog lists epic > story > task/bug indented with type icon, ref, title, status, assignee; groups are collapsible.
- AC3. Items without a parent appear in a final group (stories and loose tasks under "No story"); orphans are never dropped.
- AC4. "New epic" and "New story" actions create items (story with optional epic parent); tasks/bugs can be added under a story.
- AC5. Opening an item opens the same detail panel; filters and search from S4 apply (reset when switching views).
- AC6. Empty backlog shows "The backlog is empty"; cancelled follows the show-cancelled toggle; long titles truncate.

Test scenarios (qa):
- T1 [browser] (AC1) Given Backlog selected, When reloading, Then Backlog is still shown; with localStorage blocked/cleared the default is Board and nothing throws; the toggle is a radiogroup with `aria-pressed` and keyboard-operable.
- T2 [browser] (AC2) Given epic > story > task and bug, Then the rows are indented with type icon, ref, title, status badge (dot + label), assignee; the chevron collapses an epic and a story; "{done} of {total} done" on groups (cancelled excluded).
- T3 [browser] (AC3) Given a story with no epic, a loose task, a task whose parent was deleted, Then all are in the final "No story" group; nothing is dropped; the group is hidden when empty.
- T4 [browser] (AC4) Given "New epic", Then an epic is created and appears as a group; "New story" with an epic parent puts it under that epic, without a parent in "No story"; `+` on an epic adds a story under it, `+` on a story adds a task/bug with the parent preset; invalid parents are never offered.
- T5 [browser] (AC5) Given clicking a row, Then the same detail panel opens; chevron click does not open it; with a search matching a task, ancestors stay visible and auto-expand; clearing restores the manual collapse state.
- T6 [browser] (AC6) Given an empty project, Then "The backlog is empty" plus New epic / New story; given a filter with no matches, "Nothing found".
- T7 [browser] (AC6, edge) Given cancelled items, Then they are hidden unless the toggle is on; a 200-character title truncates with a tooltip, with no horizontal page scroll; 300 items scroll smoothly.
- T8 [browser] (AC2, narrow) Under 640 px, indent is 12 px per level, status is dot + short label, assignee hidden; touch targets at least 36 px.
- T9 [browser] (edge) Agent changes live (new item, status change, reparent via API) update the list with collapse state and filters intact; a task re-parented to another story moves groups.
- T10 [browser] (edge) Changing type in the detail panel (task to story) re-places the row at the right level.
- T11 [auto-candidate] backlog tree builder: orphans, cycles in parentId (A parent of B parent of A) do not hang, epic with parent.

## Decisions & open questions
- Columns stay the fixed statuses (backlog, todo, in-progress, in-review, done, cancelled on demand); no custom columns, no column management in UI or Agent API (owner decision 2026-11-20).
- Layout: Azure DevOps Taskboard style — rows = stories, columns = statuses; first column is the story itself (collapsible), children (tasks, bugs) sit in the status columns to the right.
- In scope beyond the original ask: board filters and search; separate Backlog view (hierarchical list).
- Out of scope: attachments, change history, sprints/iterations, custom columns.
- Decided (owner, 2026-11-20): story collapse state is not persisted (in-memory, all expanded after reload); no `usePersistedState` for it. The Board/Backlog toggle stays persisted (S5-AC1).
- Decided (UX, owner delegated 2026-11-20): mobile (below 768 px) is a stacked per-story card list with status groups, no drag; the grid with sticky column is `md` and up. Reason: the swipe grid leaves ~200 px for cells on phones and fights touch drag; stacked reads top to bottom. S2a stays M (upper end), S2b loses mobile touch work.
- Decided (owner, 2026-11-20): search is a case-insensitive substring over ref and title (`1` matches FOC-1 and FOC-12).
- Decided (owner, 2026-11-20): filters reset when switching Board/Backlog and on reload.
- Open: should stories without children and items under an epic go to "No story" or under an epic row? (assumed: epic is only a filter, per Requirement 5).
- Open: does dragging a card to another story's row re-parent? (assumed: no, status only.)
- Open: horizontal scroll cause not reproduced from code; S1 starts with browser reproduction.
- Original asks: epics/stories/tasks/bugs currently share one column per status; no horizontal scroll on desktop when columns overflow; no manual creation of stories/tasks/bugs like in ADO (the board has a per-column quick-add today — verify what is missing, e.g. choosing type/parent, creating children inside a story row, creating epics).
## History
- 2026-11-20 — created — owner request: make the projects page work like Azure DevOps/Jira
- 2026-11-20 — ux — owner decisions applied: collapse not persisted, mobile = stacked story cards (no drag), search = substring on ref/title, filters reset on view switch and reload
- 2026-11-20 — filed in tracker — epic FOC-2, stories FOC-3..FOC-8
