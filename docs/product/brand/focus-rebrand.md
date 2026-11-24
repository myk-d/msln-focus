# Focus-Pocus rebrand: research

Work item: FOC-42, under the story FOC-44. Status: identity approved by the owner on 2026-11-24 (see §6).
Updated: 2026-11-24

## Owner decisions (2026-11-24)

- **Name:** it does not have to be Ukrainian. International or English names are fine if they are pronounceable in uk and en (see §4.1).
- **Dark mode:** in scope for the rebrand.
- **MYSLENNYA link:** no visible link for now. Family cues in the visuals stay optional.
- **Chosen:** direction **B (workbench)** with the name **Axo** («Аксо»). The name refers to axl. the axolotl, but the brand stays calm: axl. is used only as an emotional accent.
- **Logo (decided):** **L1** (the gills mark on the app tile) is the app icon, and **L3** (the "ax" wordmark with the gills mark as the "o") is the logo. They share one mark. Below 32 px the mark is simplified to two strokes per side.
- **Mascot:** axl. is the original MYSLENNYA artwork, vectorised with potrace into four SVG paths (neutral, joy, sad, playful). The fill is `currentColor` and the face features are even-odd holes, so it works on both themes. The source was the UI kit screenshot (~350 px per emotion). For sharper curves, re-export it from the original vectors (UI kit node 133:3).
- **App implementation (FOC-45…50, merged 2026-11-24):** the owner kept the original type icons (Crown, BookOpen, SquareCheck, Bug) in the type colours instead of the star/square/ring/dot glyphs. axl. appears once per empty board column (and on an empty board or backlog); an empty story row is plain text.
- **Where the design lives:** after the Figma Starter MCP limit stopped work at the brand board, the owner decided to keep the whole brand in the repo as linked HTML pages in this folder instead of Figma (see §6).

Sources: `docs/product/product.md`, `README.md`, `src/index.css`, `src/lib/{ui,utils,projects}.ts`, the Pomodoro, projects board, item detail and welcome components, `src/i18n/locales`, and the MYSLENNYA UI kit in Figma (page "UI kit"). Nothing below is invented user data. All usage claims come from the code and the product doc.

## 1. Who uses it, and when

- **The owner, starting a work session.** Opens `/projects`, creates a story or bug (it gets a ref like `FOC-12`) and assigns it to `me`, `claude` or `antigravity`. The board replaces Azure DevOps or Jira for personal projects.
- **The owner and an agent on one board.** A coding agent moves a card or comments through the Agent API, and the change appears live (`onSnapshot`). The owner reads it, replies and updates `blockedBy`. No to-do app has this moment, so it is the product's real differentiator.
- **Any signed-in user, planning the day.** Lists with sections, tags, priorities, pinned tasks and calendar events, kept private per Google account.
- **Any signed-in user, doing the work.** Starts a Pomodoro from a preset, links it to a task (shown as a banner) and pops the timer into a Picture-in-Picture window.
- **Review (weak evidence, don't oversell).** Daily and total Pomodoro stats, the tag view across lists, and group-by date or priority.

Constraints the identity must respect: one person at personal scale. Agents are the owner's extra hands; the Agent API is owner-only, other users never see agents, and team collaboration is a non-goal. The UI is Ukrainian first, with English as well, on the web and as a PWA.

## 2. What the current brand gets wrong

**Name**
- "Focus-Pocus" is an English pun on "hocus pocus". It has no Ukrainian root, and it declines badly in Ukrainian text ("у Focus-Pocus").
- The hyphen is awkward in handles, URLs and mixed Latin/Cyrillic text.
- "Focus" is the most crowded word in productivity, so collisions and poor search visibility are guaranteed.
- It promises only the timer. The product is now a personal work system with a project board.
- The magic pun suggests tricks rather than craft.

**Visuals** (from the code)
- Orange `#c9431f` on beige `#f7f3ec` with the system sans font and lucide icons is a competent default, but nothing in it is ownable: there is no mark, no type voice and no mascot.
- Orange is overloaded. It is the primary colour, the focus phase, close to the epic colour (`#FF7B00`) and the high-severity chip, and close to the Claude avatar (`#D97757`).
- Emerald is used for both the short break and "done". Violet is used for "in review", the PR icon and a tag colour. The backlog and cancelled dots are both grey and nearly identical.
- The work-item colours are copied from Azure DevOps, which reads as an ADO clone rather than a point of view.
- `stone-400` text (about 2.5:1 contrast) is the main muted colour, used 117 times, including for refs and timestamps. It fails WCAG AA. The input focus ring (`ring-brand-100`) is about 1.2:1, and buttons have no visible focus style.
- There is no dark mode and no token layer: colours are hard-coded hexes plus raw Tailwind `stone`, `emerald` and so on.
- The radius scale is undefined: `full`, `lg`, `xl`, `2xl` and `3xl` are mixed. Icon sizes vary between 12, 13, 14, 15, 16, 20 and 28 px.

**Positioning**
- The welcome page sells "tasks, calendar, Pomodoro" in three generic cards and never mentions the projects board or agents, even though `product.md` positions the product exactly on those.
- Nothing connects the product to MYSLENNYA, so it gets no family value and no axl.

## 3. Positioning

- **en:** For one person running their own projects, [Name] is a calm workspace for tasks, time and a project board that their coding agents work on alongside them. Unlike Jira, there is no process. Unlike a to-do app, the agents are on the board.
- **uk:** Для тих, хто сам веде свої проєкти: спокійний простір для задач, часу й дошки проєкту, на якій поруч із вами працюють ваші агенти. Без процесів Jira, але зі справжньою дошкою.

**Value-line candidates**
- uk: «Задачі, час і агенти — на одній спокійній дошці.» en: "Tasks, time and agents. One calm board."
- uk: «Особистий масштаб. Справжня дошка.» en: "Personal scale. Real board."

**Words to keep out:** "AI", "smart", "copilot", "teams". "Agents" states a fact about the product, not a promise.

## 4. Three directions

All fonts below are free (Google Fonts, OFL or Apache). Cyrillic and Cyrillic-ext support was checked against the Google Fonts metadata. Some candidates were dropped because they have no Cyrillic: Fraunces, Zilla Slab, Space Grotesk and Instrument Sans/Serif. Golos Text and PT Serif have Cyrillic but were not chosen. Fonts must be self-hosted (for example with `@fontsource/*`), because the PiP window copies only same-origin stylesheets and a Google Fonts `<link>` would silently fall back there.

The type scale is shared by all directions (px, line-height in brackets):
- App: 12 (16) · 14 (20) · 16 (24) · 20 (28) · 24 (32)
- Landing: 32 (40) · 48 (56) · 64 (72)
- Timer: 32 desktop card, 48 Pomodoro page, `clamp` down to 14 in PiP. Mono or sans with tabular numbers, bold.

**Contrast:** every text pair in the tables below was computed with the WCAG 2.1 formula (script in the session scratchpad; the results are shown). All pairs pass AA at 4.5:1 or more.

**Collision check:** these are quick web searches on 2026-11-24 for same-name productivity apps and obvious trademarks. They are not a legal trademark search, which should be done in the UANIPIO and EUIPO registers before adopting a name.

### A. «Задум» — MYSLENNYA family sub-brand

**Idea:** the "doing" half of MYSLENNYA. A thought becomes a task, a block of time and a card on the board.

**Relation to MYSLENNYA:** full sub-brand. It uses the M monogram with the spark (with the app name set beside it), the parent greens, the slab serif, the round check and cross icons, and axl. as a small helper.

| Name | Meaning (uk / en) | Pronounceability | Collision check |
|---|---|---|---|
| **Задум / Zadum** | intention, a plan before doing | uk natural; en "ZAH-doom", easy | ✅ no same-name app found |
| **Намір / Namir** | intention | uk natural; en "NAH-meer", easy | ✅ no app found (also a personal name) |
| **Мисль / Mysl** | a thought | uk bookish; en "missl", ok | ✅ no app found |
| **Зерно / Zerno** | a seed or grain | easy in both | ⚠️ Zerno is a coffee-grinder brand (different class, low risk) |
| ~~Думка / Dumka~~ | a thought | easy | ❌ **dropped**: "Dumka", a private AI journal app on the App Store |
| ~~Іскра / Iskra~~ | a spark (echoes the monogram) | easy | ❌ **dropped**: Iskra is an established electronics trademark |

**Palette**

| Role | Light | Dark | Text pair contrast (light / dark) |
|---|---|---|---|
| bg | `#F7FFF5` (parent pale) | `#0D1A0F` | |
| surface | `#FFFFFF` | `#152418` | |
| text | `#16301A` | `#E6F5E2` | on bg 13.98 / 15.81 |
| muted | `#4E6852` | `#9DB8A0` | on surface 6.13 / 7.55 |
| primary | `#2B661F` (parent dark) | `#BEF2B4` (parent light) | on bg 6.81 / 14.12 · on-primary `#FFFFFF` / `#12300E`: 6.95 / 11.38 |
| accent | `#6B2A7A` (axl. purple) | `#D7A8E6` | 9.39 / 8.20 |
| success | `#0F766E` (teal, kept away from the primary green) | `#5ED3C3` | 5.47 / 8.93 |
| warning | `#975A00` | `#F2C46D` | 5.56 / 9.94 |
| danger | `#B3261E` | `#FF8E86` | 6.54 / 7.30 |

Pomodoro phases: focus uses the primary green, the short break sky `#1F6F99` (5.54) and the long break purple `#6B2A7A`. Because the primary is green, "done" and the short break have to move away from green (to teal and sky). This re-hue is direction A's main cost.

**Type:** headings in Roboto Slab (the closest free match to the parent's slab serif; the parent's actual font is outlined in the kit and needs confirming), 600–700. Body in Inter, mono in JetBrains Mono.

**Shapes:** radius 8 / 12 / 16 / full. Outline-first, with 1px borders. Shadows only on floating elements, and very soft ones.

**Icons:** lucide at a 1.5 stroke, 16 px (20 px in the nav). The parent's round check and cross are used for done, cancel and close.

**axl.:** appears in empty states, onboarding, "done" celebrations, the 404 page and the splash screen. It never appears on cards, in the detail panel or in PiP.

**Voice:** calm, thoughtful, a little dry, like notes in the margin of a notebook.
- Empty board: «Тут поки тихо. Запиши перший задум — він стане задачею.» / "Quiet here. Write down a first idea and it becomes a task."
- Pomodoro done: «Блок завершено. Відпочинь — думка дозріє.» / "Block done. Rest, and the thought will settle."
- Sign-in: «Продовжити з Google» / "Continue with Google"

**Strengths and risks:** this direction carries the most brand equity, but the name is the weakest on its own. It has the highest migration cost (re-hue of phases and statuses), and green-on-green soft surfaces lose contrast easily.

### B. «Верстак» — independent workbench with light family cues

**Idea:** a quiet workbench for one maker. The board is the bench, and the agents are apprentices working at it.

**Relation to MYSLENNYA:** independent name and mark. The family shows in the details: the parent green `#2B661F` as success and done, a serif for headings, round check and cross icons, axl. as an occasional emotional accent, and "a MYSLENNYA tool" in the footer.

| Name | Meaning (uk / en) | Pronounceability | Collision check |
|---|---|---|---|
| **Верстак / Verstak** | workbench | uk natural; en "ver-STAHK", readable | ✅ no app found; similar-looking "Vertask" and "Veritask" exist, so watch the spelling |
| **Гаразд / Harazd** | "alright, okay" | uk natural; en "ha-RAZD", fine | ✅ no app found |
| **Справа / Sprava** | a matter, a thing to do (also "on the right") | easy in both | ✅ no app found |
| **Лад / Lad** | order, harmony | uk easy; en reads it as "lad" (a boy) | ✅ no app found, but weak and noisy in English |
| ~~Ладно / Ladno~~ (proposed by the marketer) | "okay" | | ❌ **dropped**: colloquial Russianism; «гаразд» is the Ukrainian word |
| Різець / Rizets | chisel | en "ree-ZETS" | ⚠️ sounds close to Rize, a focus-tracking app in the same category; not recommended |

**Palette**

| Role | Light | Dark | Text pair contrast (light / dark) |
|---|---|---|---|
| bg | `#F5F1E8` (paper) | `#14130F` | |
| surface | `#FFFDF8` | `#1E1C17` | |
| text | `#1C1B18` (ink) | `#EEE9DF` | on bg 15.28 / 15.36 |
| muted | `#655F55` | `#A69F92` | on surface 6.22 / 6.48 |
| primary | `#1F3D2E` (forest ink) | `#A9D6B9` | on bg 10.55 / 11.51 · on-primary `#FFFFFF` / `#10241A`: 11.90 / 10.09 |
| accent | `#B8451C` (signal orange; continuity with today's brand, used for the focus phase and highlights only) | `#F0895C` | 5.29 / 6.84 |
| success | `#2B661F` (parent green) | `#8FD18A` | 6.83 / 9.45 |
| warning | `#8F5A00` | `#E6B65A` | 5.69 / 9.08 |
| danger | `#B42318` | `#F38A7E` | 6.47 / 7.09 |

**Domain colours** (light / dark, contrast on surface):
- Phases: focus is the accent `#B8451C`, the short break is success `#2B661F` / `#8FD18A`, and the long break is `#2F5B8F` / `#9DBBE6` (6.85 / 8.66).
- Types:

  | Type | Light / dark | Contrast | Note |
  |---|---|---|---|
  | epic | `#B25E00` / `#F2A65A` | 4.60 / 8.41 | amber, kept clear of the red-orange accent |
  | story | `#1F6F99` / `#7CC3E8` | 5.45 / 8.78 | |
  | task | `#8A7300` / `#E2C64B` | 4.56 / 10.06 | icon and stripe only |
  | bug | danger | | |

- Statuses:

  | Status | Treatment | Light / dark | Contrast |
  |---|---|---|---|
  | backlog | hollow ring, muted | | |
  | todo | story blue | | |
  | in progress | dot | `#946300` / `#E6B65A` | 5.11 / 9.08 |
  | in review | dot | `#6B3FA0` / `#C3A6EC` | 7.26 / 8.09 |
  | done | success | | |
  | cancelled | crossed-out ring (not a second grey dot) | | |

- Avatars: the Claude avatar stays `#D97757`. This is safe because the primary is no longer orange.

**Type:**
- Headings and wordmark: Literata, a book serif with optical sizes and full Cyrillic. It is used only at 20 px and above: the wordmark, landing headings, the welcome h1, empty-state titles and the item title in the detail panel.
- Body: Manrope.
- Mono: IBM Plex Mono for refs (`FOC-12`), the timer and code.
- No serif on cards, chips, tables, the toolbar, markdown bodies or in PiP.

**Shapes:** radius 6 (chip), 10 (input and button), 16 (card and panel), full (pill and avatar). Border-first, with a single shadow for floating elements (`0 8px 24px rgb(0 0 0 / .08)`). The one-off `rounded-3xl` and `shadow-2xl` go.

**Icons:** lucide at a 1.75 stroke, 16 px (14 px inline, 20 px in the nav). Two custom round icons, check and cross, are used for done and remove.

**axl.:** appears in empty states (no tasks, an empty column, no events), "done" moments (a finished session, all tasks done), the error page and small on the welcome hero. It never appears in spinners, PiP, cards or notifications.

**Voice:** plain and practical, maker to maker. Short sentences, dry humour, never cute.
- Empty board: «Верстак порожній. Поклади на нього першу справу.» / "The bench is empty. Put the first thing on it."
- Pomodoro done: «25 хвилин зроблено. Перерва.» / "25 minutes done. Take a break."
- Agent comment: «Claude залишив коментар до FOC-12.» / "Claude commented on FOC-12."

**Strengths and risks:** this direction has the best standalone name, and the workbench-with-apprentices metaphor describes the real product (personal scale, agents on the board). It is closest to the current system: warm paper stays, and orange survives as the accent. The risk is that the serif wordmark and the dense sans UI could look like two products, so keep the wordmark small and share the tokens.

### C. «Аксо» — playful, axl.-led

**Idea:** axl. is the product's face. Axolotls regenerate, and after every break your focus does too. The agents are axl.'s friends.

**Relation to MYSLENNYA:** high. axl. is the hero (with the purple variant as primary), and the parent's black-silhouette illustration style and greens are used as accents.

| Name | Meaning (uk / en) | Pronounceability | Collision check |
|---|---|---|---|
| **Аксо / Akso** | short for axolotl | easy in both | ⚠️ AKSO is a fitness brand (different category, medium risk) |
| **Знову / Znovu** | "again" (regeneration) | uk natural; en "ZNO-voo", ok | ✅ no app found |
| **Ставок / Stavok** | pond | uk natural; en "sta-VOK", ok | ✅ no app found |
| **Атль / Atl** | Nahuatl for "water", the root of "axolotl" | easy | ✅ no app found; "ATL" is a common abbreviation |
| ~~Лапка / Lapka~~ | little paw | | ❌ **dropped**: Lapka dog-walk app and a pet-care app |
| ~~Axel / Axi~~ | | | ❌ **dropped**: common name, and "Axie" is a known game brand |

**Palette**

| Role | Light | Dark | Text pair contrast (light / dark) |
|---|---|---|---|
| bg | `#FBF8FD` | `#130B19` | |
| surface | `#FFFFFF` | `#1E1426` | |
| text | `#21122B` | `#F3ECF8` | on bg 16.82 / 16.67 |
| muted | `#685A75` | `#B4A5C2` | on surface 6.35 / 7.69 |
| primary | `#5A1E6B` (axl. purple) | `#D9B3EC` | on bg 10.88 / 10.65 · on-primary 11.46 / 9.57 |
| accent | `#2B661F` (text) with `#BEF2B4` (fill) | `#BEF2B4` | 6.95 / 13.99 |
| success | `#237A3B` | `#7CD98D` | 5.36 / 10.28 |
| warning | `#945800` | `#F0BE5A` | 5.75 / 10.33 |
| danger | `#BF2630` | `#FF8F8F` | 5.94 / 8.09 |

Phases: focus is purple, the short break green `#2B661F`, and the long break blue `#2F5B8F`.

**Type:** headings in Unbounded (wide, rounded display with Cyrillic), body in Nunito, mono in JetBrains Mono.

**Shapes:** radius 12 / 20 / full, chunky 2px outlines and flat offset "sticker" shadows (`0 2px 0` ink).

**Icons:** a custom set of rounded icons with a 2px stroke would be needed. That is about 40 icons including the type icons.

**axl.:** in every emotional state (empty, done, error, loading, onboarding), but still not inside dense board or detail views or PiP.

**Voice:** warm and joking, with axl.'s emotions as feedback. It must not belittle the work itself.
- Empty board: «axl. нудьгує. Додай першу задачу.» / "axl. is bored. Add the first task."
- Pomodoro done: «Готово! axl. пишається. Перерва.» / "Done! axl. is proud. Break time."
- Sign-in: «Заходь — axl. уже чекає» / "Come in, axl. is waiting"

**Strengths and risks:** the most memorable direction. But it costs density on the board (cards need about 4 px more padding), the mascot can grow tiring in a daily tool, it needs dark-mode art variants and a full icon redo, and it fights the "calm, personal scale" principle and trust for serious project work.

### 4.1 International name candidates

These were added after the owner allowed non-Ukrainian names. They were checked the same way: quick web searches on 2026-11-24 for same-name productivity apps and obvious trademarks.

| Name | Fits | Meaning | uk / en pronounceability | Collision check |
|---|---|---|---|---|
| **Zadum** | A | (uk) intention | «Задум» / "ZAH-doom" | ✅ clear (see above) |
| **Verstak** | B | (uk) workbench | «Верстак» / "ver-STAHK" | ✅ clear (see above) |
| **Vise** | B | a bench vise: it holds the work steady | «Вайс» / "vice", easy; reads like "vice" in English | ✅ no app found; similar "Voiset" exists |
| **Lathe** | B | a turning lathe | «Лейз»: the "th" is hard for uk speakers | ✅ no app found; weak on pronounceability |
| **Axo** | C | short for axolotl | «Аксо» / "AK-so", easy in both | ✅ no app found; similar "Axis" and "Taskaxis" exist |
| ~~Tinker~~ | B | | | ❌ **dropped**: "Tinker", a 2014 iPhone to-do app with a Pomodoro-like timer |
| ~~Intento~~ | A | | | ❌ **dropped**: Intento is an existing AI translation company |
| ~~Ideo~~ | A | | | ❌ **dropped**: IDEO, a well-known design firm |

## 5. Recommendation

**Direction B, «Верстак / Verstak», with A's family layer** (parent green as success, the round check and cross, axl. only in empty and "done" moments). There is no visible "MYSLENNYA" link for now, as the owner decided on 2026-11-24.

Why:
1. **The metaphor is the product.** A workbench with apprentices describes "one person + agents on one board" exactly. A says the same thing vaguely, and C says "toy".
2. **The name works in both languages.** «Верстак» declines naturally in Ukrainian («на Верстаку»), has no hyphen, and no colliding app was found. «Гаразд / Harazd» is the softer backup.
3. **It fixes the real defects at the lowest cost.** The primary moves off orange, so the Claude avatar, epic and severity chips stop colliding. Orange survives as the focus-phase accent, which gives continuity. Emerald is no longer double-booked, muted text rises to 6:1 or more, and dark mode comes with the token layer.
4. **Serif only where it is safe:** 20 px and above, never in dense UI or PiP.

**Prerequisite, whatever the direction:** a semantic token layer (CSS variables under `:root` and `[data-theme=dark]`, exposed via `@theme`). It also needs a global `focus-visible` ring, a muted-text floor of 4.5:1, no hard-coded hexes in the `*_META` maps, a `prefers-reduced-motion` guard on `phase-flash`, and self-hosted fonts so PiP works.

**Landing page plan:**
1. Hero: name, value line, Google sign-in, and a real Pomodoro card.
2. The board with an agent's comment.
3. The item detail panel with markdown.
4. Tasks with sections and tags.
5. The calendar, and PiP at its true size.
6. How it works, FAQ, and a final CTA.

Use no invented testimonials or metrics, keep sign-in within the first screen on a 390 px phone, and avoid AI hype.

Open questions for the owner:
- Is dark mode in the same release?
- Should the MYSLENNYA link be visible or silent?
- Is the landing page for the public or personal-only?

## 6. Final identity: Axo (approved 2026-11-24)

| What | Decision |
|---|---|
| Name | **Axo** («Аксо»), always written lowercase in the logo |
| Direction | B, the "workbench": calm, one person plus agents |
| App icon | **L1**: the gills mark on a forest-ink tile (`assets/axo-icon.svg`, `assets/axo-icon-dark.svg`; `assets/axo-icon-small.svg` at 32 px and below) |
| Logo | **L3**: "ax" in Literata SemiBold with the gills mark as the "o" (`assets/axo-mark.svg` is the mark; the wordmark still needs outlining, see follow-ups) |
| Mascot | axl. (`assets/axl-{neutral,joy,sad,playful}.svg`, `currentColor`). Used only in empty states, "done" moments, errors, the landing hero and the final CTA |
| Visible MYSLENNYA link | none for now |

### Links

The **source of truth is the brand pages in this folder**. Open [`index.html`](index.html) in a browser. All pages share [`assets/brand.css`](assets/brand.css) and [`assets/brand.js`](assets/brand.js), and the data on the screens is sample data:

| Page | Contents |
|---|---|
| [`index.html`](index.html) | Overview, the decisions, links to every page |
| [`foundations.html`](foundations.html) | Palette (light and dark), type scale, components in both themes, axl. rules, do/don't |
| [`logo.html`](logo.html) | Gills mark, L1 icon, L3 wordmark, lockups, the rejected L2, axl. in 4 emotions |
| [`pomodoro.html`](pomodoro.html) | Pomodoro, desktop 1440 and mobile 390 |
| [`board.html`](board.html) | Project board: desktop light, desktop dark, mobile |
| [`detail.html`](detail.html) | Item detail panel, desktop and mobile |
| [`landing-uk.html`](landing-uk.html) / [`landing-en.html`](landing-en.html) | Landing page in Ukrainian and English, desktop and mobile |

Vector assets are in [`assets/`](assets/):
- `axo-icon.svg`, `axo-icon-dark.svg` and `axo-icon-small.svg` (the L1 icon, plus a simplified version for 32 px and below);
- `axo-mark.svg` (the mark on its own);
- `axl-{neutral,joy,sad,playful}.svg` (the mascot).

Figma (historical, not updated any more): the owner decided on 2026-11-24 to keep the brand in the repo rather than in Figma. The first brand board is still on the "focus" page of MYSLENNYA-concept:
- [01 · Brand board — Axo](https://www.figma.com/design/TS4SmAeTAJthE4bhrQOsNV/MYSLENNYA-concept?node-id=150-24)
- [Axo · Components](https://www.figma.com/design/TS4SmAeTAJthE4bhrQOsNV/MYSLENNYA-concept?node-id=148-2)
- local variables `Axo/Light`, `Axo/Dark` and `Axo/Size`

### Final tokens

CSS names follow the Figma `codeSyntax.WEB` values: `color/<name>` maps to `var(--color-<name>)`, with "/" replaced by "-".

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F5F1E8` | `#14130F` | page canvas |
| `surface` | `#FFFDF8` | `#1E1C17` | cards, panels, nav |
| `surface-raised` | `#FFFFFF` | `#26231D` | popovers, dialogs, drawer |
| `surface-sunken` | `#EDE8DD` | `#191813` | subtle fills, code, chips |
| `border` | `#E3DDD0` | `#34302A` | 1px borders |
| `border-strong` | `#CFC7B6` | `#4A453C` | inputs, dashed outlines |
| `text` | `#1C1B18` | `#EEE9DF` | primary text |
| `muted` | `#655F55` | `#A69F92` | secondary text (≥ 4.5:1) |
| `primary` | `#1F3D2E` | `#A9D6B9` | primary actions, brand ink |
| `primary-hover` | `#2A5240` | `#BFE3CC` | hover state |
| `on-primary` | `#FFFFFF` | `#10241A` | text and icons on primary |
| `primary-soft` | `#E3EDE6` | `#22332A` | selected rows, active nav |
| `accent` | `#B8451C` | `#F0895C` | focus phase, highlights only |
| `accent-soft` | `#F7E3D8` | `#3A2419` | accent tint |
| `success` / `-soft` | `#2B661F` / `#E2F2DC` | `#8FD18A` / `#1F3320` | done, short break |
| `warning` / `-soft` | `#8F5A00` / `#F6EBD3` | `#E6B65A` / `#382B14` | warnings, blocked |
| `danger` / `-soft` | `#B42318` / `#F8E1DE` | `#F38A7E` / `#3A1E1B` | errors, destructive |
| `info` | `#1F6F99` | `#7CC3E8` | info, links |
| `ring` | `#2F5B8F` | `#9DBBE6` | focus-visible ring (2px, 2px offset) |
| `phase-focus` / `phase-short` / `phase-long` | `#B8451C` / `#2B661F` / `#2F5B8F` | `#F0895C` / `#8FD18A` / `#9DBBE6` | Pomodoro phases |
| `type-epic` / `type-story` / `type-task` / `type-bug` | `#B25E00` / `#1F6F99` / `#8A7300` / `#B42318` | `#F2A65A` / `#7CC3E8` / `#E2C64B` / `#F38A7E` | work-item type stripe and glyph (`task` is never used for text) |
| `status-todo` / `status-progress` / `status-review` | `#1F6F99` / `#946300` / `#6B3FA0` | `#7CC3E8` / `#E6B65A` / `#C3A6EC` | status dots. `done` uses `success`. `backlog` is a hollow muted ring; `cancelled` is a hollow ring with struck-through text |
| `avatar-claude` / `avatar-agent` | `#D97757` / `#0277B3` | `#D97757` / `#38BDF8` | assignee avatars |

| Size token | Value | | Type style | Font | Size/line |
|---|---|---|---|---|---|
| `radius-chip` | 6 | | Display/XL, Display/L | Literata SemiBold | 64/72, 48/56 |
| `radius-control` | 10 | | Heading/H1–H3 | Literata SemiBold | 32/40, 24/32, 20/28 |
| `radius-card` | 16 | | Body/L, Body/M, Body/S | Manrope Medium | 16/24, 14/20, 12/16 |
| `radius-full` | 999 | | Body/M Strong, Button | Manrope Bold | 14/20 |
| `space-1…12` | 4, 8, 12, 16, 24, 32, 48 | | Label | Manrope SemiBold +0.4 | 12/16 |
| shadow float | `0 8px 24px rgb(0 0 0 / .08)` | | Mono/Ref, Mono/Code | IBM Plex Mono Medium, Regular | 12/16, 12/18 |
| shadow popover | `0 12px 32px rgb(0 0 0 / .12)` | | Mono/Timer M, Mono/Timer L | IBM Plex Mono SemiBold | 32/40, 56/64 |

Serif (Literata) is used only at 20 px and above. It never appears on cards, chips, tables, markdown or in PiP. Fonts are self-hosted so they also load in the Picture-in-Picture window.
