# Chronicles of Aether: The Shattered Veil

A single-player, D&D-inspired fantasy role-playing game for the browser. You create one adventurer and travel with **three CPU-controlled companions** who have their own opinions, tactics and memories, guided by an in-game **Dungeon Master engine**. Original world, original story, d20 rules.

> **Current build: v0.2 — the complete, playable Prologue ("The Bell That Never Rang") plus the Phase 3 systems: class features to level 10, spells to 5th level, crafting, factions, companion personal quests and conflicts, legendary monsters.**
> Acts I–VI are designed (see `STORY_BIBLE.md`) but **not yet implemented**. See `DEVELOPMENT_STATUS.md` for exactly what works.

## Requirements

- Node.js 18+ (tested with Node 22) and npm
- A modern browser: Chrome, Edge or Firefox (Windows or Linux), desktop recommended (designed for 1920×1080, usable down to ~1280×720)

No internet connection, account, paid service or AI API is needed to play. All graphics and audio are generated at runtime.

## Install, run, build, test

```bash
npm install          # install dev tooling (Vite, TypeScript, Vitest)
npm run dev          # start the dev server, then open the printed URL (default http://localhost:5173)
npm run build        # type-check and build a static bundle into dist/
npm run preview      # serve the built bundle locally (http://localhost:4173)
npm test             # run the automated test suite (rules, content, combat AI, saves, full prologue playthrough)
npm run typecheck    # TypeScript only
```

The build in `dist/` is fully static (relative paths), so it can be opened from any static web server or wrapped later in a desktop shell (Electron/Tauri) for Windows and Linux packages.

## How to play

1. **New Game** → create your adventurer: name and portrait colour, ancestry, class, background, ability scores (point buy, standard array or 4d6-drop-lowest), skills, spells, personality, then **choose exactly three companions** from ten, and a difficulty.
2. Explore **Hollowmere** during the Festival of Lanterns. Talk to people, shop, hang a lantern on the Lantern Tree. At midnight, a bell rings from a tower that fell eighty years ago…

### Controls

| Exploration | |
|---|---|
| Click a square / WASD / arrows (Q E Z X diagonals) | Move (the party follows) |
| Click a person or object, or Space/Enter when adjacent | Talk / inspect / open / loot |
| F | Search the area (active Perception/Investigation) |
| R | Short rest |
| J / I / C / P / M / L | Journal (quests & factions) / Inventory / Character / Party orders & reaction preferences / World map / Dice log |
| F5 / F9 | Quicksave / Quickload |
| Mouse wheel | Zoom |
| Esc | Menu / close window |

| Combat | |
|---|---|
| Click a highlighted square | Move (red path dots = opportunity attacks) |
| Click an enemy | Attack with your weapon |
| Action buttons (or 1–9) | Choose an action/spell, then click a target or area |
| Slot buttons | Upcast the next spell with a higher slot |
| Right-click / Esc | Cancel the selected action |
| Space | End turn |
| ⚑ Orders | Give companions strategic instructions |

Camp (the stairs in the Lantern & Lamb) offers private talks, companions' personal quests (✦ A personal matter…), mediating companion arguments, crafting, spell preparation and long rests.

In dialogue, number keys pick options. At party decisions you can **Ask the party** (each companion argues for an option) or **Let us vote**.

## Project layout

```
src/
  core/        dice, RNG, event bus, settings, utilities
  rules/       ability scores, skills, checks, saves, death saves
  engine/      game state, characters, conditions & effects languages, dialogue engine,
               companion personality engine, quests, exploration, rest, shops, saving
  engine/combat/  tactical combat engine and utility-scoring AI
  data/        all content: classes, ancestries, backgrounds, items, spells, enemies,
               companions, quests, encounters, shops, maps, dialogue (prologue, camp, banter)
  ui/          DOM/canvas presentation: screens, panels, procedural portraits and tiles
  audio/       procedural WebAudio music and effects
  i18n/        UI strings (English; partial Dutch)
tests/         Vitest suites, including an end-to-end prologue playthrough
```

## Documentation

- `STORY_BIBLE.md` — world, history, factions, companions, the six-act plot and endings (canon reference)
- `GAME_DESIGN.md` — rules, systems, AI, content formats and how they fit together
- `ROADMAP.md` — milestones and completion criteria
- `DEVELOPMENT_STATUS.md` — what is implemented, tested, and known limitations (keep this current)
