# Features index

Status: shipped / partial / idea. Spec file: none yet. Epic: Focus has no epics yet.

| Feature | Status | Where in code | Spec | Epic |
|---|---|---|---|---|
| Auth, Google sign-in, welcome page | shipped | `src/components/AuthGate.tsx`, `WelcomePage.tsx`, `src/context/AuthContext.tsx` | — | — |
| Task lists, sections (drag-and-drop), tags | shipped | `/tasks`, `TasksPage.tsx`, `TodoContainer.tsx`, `ListSidebar.tsx`, `TagTasksView.tsx`, `src/hooks/useTaskStore.ts` | — | — |
| Task detail, subtasks, priority, pinned | shipped | `TaskDetailPanel.tsx`, `SubtaskList.tsx`, `TaskContextMenu.tsx` | — | — |
| Group by / sort by per list | shipped | `FilterMenu.tsx`, `GroupedTaskList.tsx` | — | — |
| Task reminders (browser notifications) | partial (not verified end to end) | `src/hooks/useNotificationReminders.ts` | — | — |
| Calendar (month/week/day/agenda, events) | shipped | `/calendar`, `CalendarPage.tsx`, `src/components/calendar/`, `useEventStore.ts` | — | — |
| Pomodoro timer, settings, task link | shipped | `/pomodoro`, `PomodoroPage.tsx`, `PomodoroTimer.tsx`, `usePomodoro.ts` | — | — |
| Pomodoro presets | shipped | `PomodoroPresetList.tsx` | — | — |
| Pomodoro Picture-in-Picture | shipped | `PipPortal.tsx`, `useDocumentPiP.ts` | — | — |
| Projects board (kanban by status, drag between columns) | partial | `/projects`, `src/components/projects/ProjectBoard.tsx`, `useProjectsStore.ts` | — | — |
| Work item detail (fields, markdown, children, links) | shipped | `ItemDetailPanel.tsx`, `fields.tsx` | — | — |
| Work item comments | shipped | `ItemDetailPanel.tsx` | — | — |
| New project (key, name, repo) | shipped | `NewProjectForm.tsx`, `ProjectsPage.tsx` | — | — |
| Agent API (projects, work items, comments, `/api/docs`) | shipped | `functions/src/` (`app.ts`, `lib/spec.ts`) | — | — |
| i18n Ukrainian / English | shipped | `src/i18n/`, `LanguageSwitcher.tsx` | — | — |
| PWA (installable, icons) | shipped | `vite.config.ts` (`VitePWA`), `public/` | — | — |

## Notes

- Projects board (confirmed in `ProjectBoard.tsx`): columns are the fixed `BOARD_STATUSES` (plus `cancelled` behind a toggle), each a flat list of that status's items sorted by `sortItems`. There is no story-grouped hierarchy on the board (parent progress shows only as a done/total count on a card), no custom columns. Horizontal scroll exists (`overflow-x-auto`) but was not checked in a browser.
- Status can be changed by dragging a card to another column or with the status select in `ItemDetailPanel.tsx`.
