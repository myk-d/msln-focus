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
| 8 | Add work item | In a board: title, type (epic/story/task/bug), submit | Card gets ref `<KEY>-<n>` in the next free number, in the todo column | browser | API numbering: `app.test.ts` "items: numbers items per project..."; UI none |
| 9 | Move between statuses | Drag card to another column; change status in detail select; PATCH the item via API while the board is open | Card moves and persists; API change appears live without reload; cancelled column behind toggle | browser | API patch/list order: `app.test.ts` "items: patches fields...", "lists sorted by status..."; UI and live sync none |
| 10 | Item detail and comment | Open item; edit assignee, severity (bug), blockedBy, related, markdown description; add comment | Fields persist; severity only for bugs; related shows on both items; successors derived; markdown sanitized | browser | API: `app.test.ts` "ADO-style fields", "comments and brief"; sanitizer/UI none |
| 11 | Agent API contract | Run `npm --prefix functions test` | All pass; routes and `/api/docs` spec match | auto | `app.test.ts` (auth, projects, items, fields, comments, docs) |
| 12 | Language and PWA | Switch UA/EN in the switcher; install as PWA | All strings translated in both languages; app installable | browser / manual (install) | none |

## Gate before any change
`npx tsc --noEmit -p tsconfig.app.json`, `npx eslint .`, and for API changes `npm --prefix functions test`.

## Gaps
- No web tests at all; flows 1-10 and 12 have no automation.
- Task reminders (browser notifications) are not verified end to end; no scenario until behaviour is confirmed.
- Horizontal scroll of the projects board was not checked in a browser.
- Per-user data isolation (two accounts) has no scenario; needs two Google accounts (manual).

Updated: 2026-11-20
