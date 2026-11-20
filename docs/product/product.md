# Focus-Pocus: product

## Vision

Focus-Pocus keeps a person's planning, time and project work in one place: tasks, calendar, a Pomodoro timer, and a projects board that both the owner and coding agents work from every day. It aims to replace Azure DevOps / Jira for personal projects.

## Users

- **Individual user (primary):** anyone who signs in with Google. Gets private, per-account data: task lists, calendar, Pomodoro presets and settings. Uses the UI in Ukrainian or English, on the web or as a PWA.
- **Owner as project planner:** the owner runs personal projects on the projects board (epic / story / task / bug, markdown descriptions, comments) instead of ADO/Jira.
- **Coding agents:** read and write work items and comments through the Agent API, on the same board as the owner.
- **Agent API is owner-only by design:** only the owner uses it (all documents are written with `FOCUS_OWNER_UID`); other signed-in users get the app UI, not agent access.

## Positioning

For individuals who want one calm place for tasks, time and personal project tracking, Focus-Pocus is a lightweight web app. Unlike Jira/ADO it has no team process overhead; unlike a plain to-do app it has a real work-item board that agents can use directly.

Success: the owner keeps everything here instead of ADO/Jira, and agents and owner work from one board daily.

Non-goals: attachments and change history; native mobile apps; integrations (GitHub, Slack). Multi-user team collaboration is not a stated goal.

## Principles

1. **One place, personal scale.** Favor fewer concepts over enterprise features; personal projects do not need process.
2. **Agents are first-class.** Anything the owner does on the board should be possible for an agent through the API, and the API doc is the single source of truth.
3. **Private by default.** Each account sees only its own data; sign-in is Google only.
4. **Fast and forgiving.** Optimistic local-first UI; no data loss when a schema grows (old records are normalized on read).
5. **Both languages.** Every user-facing string exists in Ukrainian and English.
6. **Say no to scope.** Attachments, history, integrations and native apps stay out until the owner's daily use shows a need.

## Glossary

- **List:** a named collection of tasks in `/tasks`; has its own group-by and sort-by.
- **Section:** a drag-and-drop block inside a list (default "sequence" view).
- **Task:** a to-do in a list; has priority, subtasks, tags, pinned flag. Not the same as a work-item "task".
- **Tag:** reusable colored label on tasks; filters tasks across lists.
- **Pinned:** a task that always sorts first.
- **Event:** a calendar entry.
- **Pomodoro / preset:** a focus timer; a preset is a named, saved set of durations.
- **Project:** a board with a short key (e.g. `FOC`) and optional repo.
- **Work item:** a tracker entry on a project board: epic, story, task or bug (bugs have severity and repro steps).
- **Ref:** the work item's address, `<KEY>-<number>`, e.g. `FOC-12`.
- **Status:** board column of a work item (fixed set, plus cancelled).
- **Assignee:** who owns an item: `me`, `claude` or `antigravity`.
- **blockedBy / related:** predecessors (successors derived) and symmetric links between items.
- **Agent API:** the HTTP API (`/api/**`) coding agents use to read and write the board; documented at `/api/docs`.

## Key flows

1. **Sign in:** open the app, press "Sign in with Google" on the welcome page, land on `/tasks` (any unknown route redirects there).
2. **Create and organise tasks:** in `/tasks` pick or create a list, add tasks to sections, drag to reorder, set group/sort in the filter menu.
3. **Enrich a task:** open the task detail panel or context menu, set priority, subtasks, tags (reusable colored tags), pin it.
4. **Browse by tag:** pick a tag in the sidebar to see its tasks across all lists, grouped by parent list.
5. **Add a calendar event:** in `/calendar` create an event on a date, edit or delete it.
6. **Run a Pomodoro for a task:** in `/pomodoro` start a timer (or a saved preset), optionally linked to a task shown as a banner; optionally pop it out into a Picture-in-Picture window.
7. **Create a project:** in `/projects` press "new project", enter key, name and optional repo.
8. **Add a work item:** in a project board type a title, choose a type (epic / story / task / bug), submit; it gets a ref like `FOC-12`.
9. **Move an item between statuses:** drag a card to another status column on the board, or use the status select in the item detail panel; agent changes via the API appear live.
10. **Open item detail and comment:** open an item, edit fields (assignee, severity, blockedBy, related, markdown description), add a comment.


Updated: 2026-11-20
