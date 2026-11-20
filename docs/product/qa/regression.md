# Regression: Focus-Pocus

Tags: auto = automated test exists, browser = check in a browser (needs sign-in), manual = needs a device or real-world step.
Tests: only `functions/src/app.test.ts` (Agent API, memory store). The web app has none. Every flow below is checked by hand until web tests exist.

| # | Flow | Steps | Expected | Tag | Covered by |
|---|---|---|---|---|---|
| 1 | Sign in | Open app signed out; press "Sign in with Google"; try `/calendar` while signed out | Welcome page only; after popup sign-in land on `/tasks`; unknown route redirects to `/tasks`; sign-out shows welcome again with no old data | browser | none |
| 2 | Create and organise tasks | `/tasks`: create list; add section and tasks; drag task and section; set group by / sort by in the filter menu; reload | Order persists after reload; non-sequence group-by shows buckets without drag; pinned tasks sort first | browser | none |
| 3 | Enrich a task | Open detail panel and context menu; set priority, add subtasks, create and toggle a tag, pin | Changes show in row and panel; persist after reload; old records without new fields still open | browser | none |
| 4 | Browse by tag | Select a tag in the sidebar; delete that tag elsewhere | Tasks from all lists, grouped by list; view resets when the tag is deleted | browser | none |
| 5 | Calendar event | `/calendar`: create event on a date; edit; delete; switch month/week/day/agenda | Event appears on the right date in all views; edit and delete persist | browser | none |
| 6 | Pomodoro for a task | `/pomodoro`: start timer; run a saved preset; start from a task; open Picture-in-Picture; reset | Countdown runs; task banner shows and clears on reset; PiP window shows timer with styles; settings edit updates idle display | browser (PiP: manual, Chromium only) | none |
| 7 | Create project | `/projects`: "new project", key, name, repo; repeat with same key and a bad key | Project appears; key uppercased; duplicate or bad key rejected | browser | API side: `app.test.ts` "projects: creates with an uppercased key, rejects duplicates and bad keys"; UI none |
| 8 | Add work item | In a board: title, type (epic/story/task/bug), submit | Card gets ref `<KEY>-<n>` in the next free number, in the backlog column | browser | API numbering: `app.test.ts` "items: numbers items per project..."; UI none |
| 9 | Move between statuses | Drag card to another column; change status in detail select; PATCH the item via API while the board is open | Card moves and persists; API change appears live without reload; cancelled column behind toggle | browser | API patch/list order: `app.test.ts` "items: patches fields...", "lists sorted by status..."; UI and live sync none |
| 10 | Item detail and comment | Open item; edit assignee, severity (bug), blockedBy, related, markdown description; add comment | Fields persist; severity only for bugs; related shows on both items; successors derived; markdown sanitized | browser | API: `app.test.ts` "ADO-style fields", "comments and brief"; sanitizer/UI none |
| 9a | Board scroll and layout (taskboard) | Project with items in all columns, 1280 px and 800 px windows; scroll right/down (shift+wheel, scrollbar, touch swipe); open and close detail; collapse/expand a story and Collapse all; reload; 375 px phone | Scrollbar visible, reaches Done/Cancelled; page does not scroll sideways; story column and header sticky; collapse state survives live agent updates but resets (all expanded) after reload; scroll kept with the panel open; below 768 px stacked story cards with status groups, no horizontal scroll, no drag | browser | none (spec `projects-taskboard.md` S1, S2a) |
| 9b | Story rows content | Stories with tasks/bugs, cancelled story, epic-parented task, orphan task, 200-char title, empty story, empty project | Cards in correct row and cell; progress excludes cancelled; "No story" row holds orphans and epic children, hidden when empty; empty messages shown; titles clamp; epics never a row | browser | none (S2a) |
| 9c | Drag within a row | Drag between cells of one row (mouse, touch long press, keyboard Space/arrows); drop on another row, outside, same cell | Status changes and persists only in-row; other rows never highlight; parent unchanged; overlay not clipped; swipe still scrolls on touch | browser (touch/screen reader: manual) | none (S2b) |
| 9d | Create with type and parent | "Add task" in a story row and in an empty cell `+`; "No story" form; toolbar "New" epic/story/task/bug; empty/whitespace title; failed write | Parent and status as chosen, next ref, appears live; invalid parents not offered; title trimmed, blank not created; error keeps the title; no per-column quick-add | browser | `createItem` numbering: `app.test.ts`; UI none (S3) |
| 9e | Filters and search | Search by title, `FOC-12`, `12`, `1` (substring); type, assignee (incl. unassigned), epic; combine; Clear filters; no match; agent edits while filtered | AND logic; story row stays if a child matches; Clear only visible when active and keeps show-cancelled; "Nothing found"; filters survive live changes; deleted epic filter resets; filters reset on Board/Backlog switch and reload | browser | none (S4) |
| 9f | Backlog view | Toggle Board/Backlog, reload; collapse groups; New epic/story; `+` on epic/story; filter; narrow window; empty project | View choice persists (collapse and filters do not); epic > story > task/bug tree with orphans in final "No story"; same detail panel; filters apply and auto-expand matches; compact on mobile; empty message | browser | none (S5) |
| 11 | Agent API contract | Run `npm --prefix functions test` | All pass; routes and `/api/docs` spec match | auto | `app.test.ts` (auth, projects, items, fields, comments, docs) |
| 12 | Language and PWA | Switch UA/EN in the switcher; install as PWA | All strings translated in both languages; app installable | browser / manual (install) | none |

## Gate before any change
`npx tsc --noEmit -p tsconfig.app.json`, `npx eslint .`, and for API changes `npm --prefix functions test`.

## Gaps
- No web tests at all; flows 1-10 and 12 have no automation.
- Task reminders (browser notifications) are not verified end to end; no scenario until behaviour is confirmed.
- Horizontal scroll of the projects board was not checked in a browser (see 9a; root cause unconfirmed).
- Flows 8 and 9 predate the taskboard; 9a-9f describe the current behavior (new items land in the backlog column).
- Pure helpers (`buildTaskboard`, `filterItems`, valid parents, backlog tree) are unit-testable but the web has no test runner; adding one is out of scope of the taskboard feature.
- Per-user data isolation (two accounts) has no scenario; needs two Google accounts (manual).

Updated: 2026-11-20
