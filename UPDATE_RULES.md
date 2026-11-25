# Rules for updates to Chronicles of Aether

Read this before changing anything. These rules come from real problems in earlier updates: each one broke the game or undid an earlier fix.

## 1. Start from the newest version

- Work **only** from the project you were given with this file. Never reuse an earlier copy of the game, an older ZIP or files from a previous conversation: that silently undoes later fixes.
- The version you were given is the base. Change only what the task needs.

## 2. Deliver changes, not a new game

- Deliver a ZIP with only the files you added or changed, at their exact paths in this project, plus a list of every added, changed and **deleted** file with one line on why.
- Do not include `node_modules/`, `dist/`, `build/` or `.map` files.
- Do not replace whole files to change a few lines; keep everything else in them as it is.

## 3. Things that must stay as they are

| What | Where | Why |
|---|---|---|
| Screens and HUD panels are positioned by `src/styles.css` and `src/ui/isometric-edition.css` only. **Never** set `position` on `.screen`, `.creation`, `.explore`, `.combat`, `.panel`, `.dialogue`, `.hud-*` or `.cb-*` in any other stylesheet. For decoration use `:where(...)`. | all CSS | Setting `.creation{position:relative}` made character creation impossible to finish (Next fell off-screen); `.panel{position:relative}` collapsed the whole HUD. |
| The interface theme lives in `src/visual-edition.css`, imported by `src/app.css`. Do not bring back `visual-theme.css`, `visual-overhaul.css/.js` or a script that edits the page after it is drawn. | `src/app.css` | An older copy of the theme brought both bugs above back. |
| Asset paths are **relative**: CSS uses `url('./assets/visuals/…')`; code uses `` `${import.meta.env.BASE_URL}art/…` `` or Vite imports. Never `/visuals/…`, `/art/…` or other paths starting with `/`. | CSS and TS | The game runs from a folder, a ZIP and an online page; absolute paths break there. |
| Every companion has a face of their own (`COMPANION_ART` in `src/ui/portraits.ts`). Never give a companion a portrait that an NPC or a player choice also uses, and never pick art by matching names or initials. | `src/ui/portraits.ts` | Seris once had Captain Dray's face; a player with initials "KV" would get Kael's. |
| The game is **English only**. No other UI languages. | `src/i18n/` | The owner's choice. |
| Walking pace: `WALK_MS_PER_TILE` and `walkToward()` in `src/ui/render/motion.ts`. Keep using them; change the number only if asked. | exploration, combat | The owner asked for this pace. |
| Autosave: after character creation, after conversations, when the page is hidden or closed, and every minute (`src/ui/app.ts`). | `src/ui/app.ts` | Without it, Continue on the main menu was never available. |
| Tooltips react to a real mouse only (`installTooltips` in `src/ui/dom.ts`). Nothing may depend on hover alone: the game is also played on phones. | `src/ui/dom.ts` | A tap left an empty tooltip box stuck over the dialogue text. |
| Never use the browser's `confirm()`, `alert()` or `prompt()`: embedded views (the online version, app web views) block them and answer "no" silently. Ask in the game with `ask()` from `src/ui/dom.ts`. | all UI | Moving past enemies, fleeing and overwriting, loading or deleting saves silently failed online. |
| Game rules, story, quests, balance and save data (`src/engine/`, `src/rules/`, `src/data/`) do not change in a visual update. If the save data must change, raise `SAVE_VERSION` and add a migration in `src/engine/save.ts`. | engine, data | Saves of players must keep loading. |
| Presentation code never uses the game's dice or random generator (`src/core/rng.ts`). Use `performance.now()` or a hash of positions. | renderer | Tests replay games with fixed dice; extra random calls change outcomes. |

## 4. For animations in particular

- Animation is presentation only: it never changes positions, HP or anything in the game state.
- In combat the computer waits for animations before its next action (`waitAnim()` in `src/ui/screens/combat.ts` waits until every walk queue is empty). A new attack, hit or death animation must be awaited the same way, or the next action starts while the previous one is still playing.
- Respect the **CPU speed** setting: `instant` means no animation at all, `fast`/`normal`/`slow` scale the duration (see `COMBAT_WALK_MS` in `src/ui/render/motion.ts`).
- Respect `prefers-reduced-motion`: keep animations short and subtle there.
- Exploration must stay responsive: an animation may never block clicking or keys.

## 5. Check before you deliver

Run all of these and report the results honestly:

```bash
npm ci
npx tsc --noEmit        # must be clean
npm test                # every test must pass (at the time of writing: 193 tests in 24 files)
npm run build           # must succeed
```

Never delete, skip or weaken a test to make it pass. `tests/visuals.test.ts` guards several rules above.

Then play it **in a real browser** (`npm run preview`): main menu → New Game → every creation step with Next → explore Hollowmere → a conversation → the world map (M) → a fight. At 1280 and 1600 pixels wide, and once at phone width. Reload the page afterwards: Continue must be available.

If you cannot run something (for example no browser is available), say exactly what you could not test. Never describe untested work as working.

## 6. What to report

1. What you changed and why, per file.
2. Which checks you ran and their results (copy the test summary line).
3. What you could not test.
4. Anything in this file you had to break, and why.
