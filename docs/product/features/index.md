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
| Projects board (taskboard: story rows, status columns, drag within a row, create with parent, filters/search, Backlog view) | shipped | `/projects`, `src/components/projects/ProjectBoard.tsx`, `useProjectsStore.ts` | [projects-taskboard](projects-taskboard.md) | FOC-2 |
| Work item detail (fields, markdown, children, links) | shipped | `ItemDetailPanel.tsx`, `fields.tsx` | — | — |
| Work item comments | shipped | `ItemDetailPanel.tsx` | — | — |
| New project (key, name, repo) | shipped | `NewProjectForm.tsx`, `ProjectsPage.tsx` | — | — |
| Agent API (projects, work items, comments, `/api/docs`) | shipped | `functions/src/` (`app.ts`, `lib/spec.ts`) | — | — |
| i18n Ukrainian / English | shipped | `src/i18n/`, `LanguageSwitcher.tsx` | — | — |
| PWA (installable, icons) | shipped | `vite.config.ts` (`VitePWA`), `public/` | — | — |

## Notes

- Projects board: shipped as the taskboard (epic FOC-2): story rows over fixed status columns (no custom columns), sticky story column and header, stacked cards below 768 px, drag within a row, create with type and parent, filters and search, separate Backlog view. Real touch long-press and the empty-project state were not checked in a browser.
- Status can be changed by dragging a card to another column or with the status select in `ItemDetailPanel.tsx`.
