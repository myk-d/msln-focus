# Focus tracker API

API трекера для модуля «Проекти». Ним користуються агенти: Claude Code, Antigravity, фабрика (adapter `focus`).

## Перший запуск

1. uid власника: Firebase Console → Authentication → Users → User UID твого Google-акаунта.
   `cp functions/.env.example functions/.env` і впиши `FOCUS_OWNER_UID=<uid>`. Файл не потрапляє в git.
2. Ключ: `openssl rand -hex 32`, потім `firebase functions:secrets:set FOCUS_API_KEY` (вставити ключ).
   Той самий ключ збережи для агентів: `mkdir -p ~/.config/focus && printf '%s' '<ключ>' > ~/.config/focus/token && chmod 600 ~/.config/focus/token`.
3. Деплой: `npm --prefix functions install`, потім `npm run build && firebase deploy --only functions,hosting,firestore:rules`.
4. Перевірка:
   ```bash
   curl -s -H "x-api-key: $(cat ~/.config/focus/token)" https://<site>.web.app/api/health
   curl -s -H "x-api-key: $(cat ~/.config/focus/token)" https://<site>.web.app/api/docs
   ```
5. Перший проект:
   ```bash
   curl -s -X POST -H "x-api-key: $(cat ~/.config/focus/token)" -H "Content-Type: application/json" \
     -d '{"key":"FOC","name":"Focus","repo":"https://github.com/myk-d/msln-focus"}' https://<site>.web.app/api/projects
   ```

## Розробка

`npm --prefix functions test` — 13 тестів на in-memory store, без Firestore.
Опис API: `src/lib/spec.ts`. Тест падає, якщо маршрути й опис розійшлися.
