# Chronicles of Aether: The Shattered Veil

A single-player, D&D-inspired fantasy role-playing game for the browser. You create one adventurer and travel with **three CPU-controlled companions** who have their own opinions, tactics and memories, guided by an in-game **Dungeon Master engine**. Original world, original story, d20 rules.

> **Current build: v0.4 — the complete Prologue ("The Bell That Never Rang") and the complete Act I ("Whispers of the Veil"): Hollowmere the morning after, the Whispering Woods, the city of Ashenford, the four realities of the ruined city of Valdros and the Senate Dome, ending with Ossaryx, the Gloaming Wyrm, and Archon Severin's voice. All ten companions can be recruited.** Plus the Phase 3 systems: class features to level 10, spells to 5th level, crafting, factions, companion personal quests and conflicts, legendary monsters.
> **Aetherfall Isometric Edition (v0.4):** exploration and combat are drawn as a layered isometric world with painted miniatures, scenery, materials and buildings; 16 illustrated player portraits; painted portraits for every companion and NPC; painted title art and an illustrated map of Elyndra (see `docs/ISOMETRIC_EDITION.md` and `docs/VISUAL_EDITION.md`).
> Acts II–VI are designed (see `STORY_BIBLE.md`) but **not yet implemented**. See `DEVELOPMENT_STATUS.md` for exactly what works.

## Requirements

- Node.js 18+ (tested with Node 22) and npm
- A modern browser: Chrome, Edge or Firefox (Windows or Linux), desktop recommended (designed for 1920×1080, usable down to ~1280×720)

No internet connection, account, paid service or AI API is needed to play. All artwork is bundled with the game; audio is generated at runtime.

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

### Quick start without a development setup

After `npm run build`, the `dist/` folder is the whole game. Serve it with any static web server — browsers refuse to load the game from a double-clicked file:

- Linux/macOS: `bash RUN_GAME_LINUX.sh`, then open http://127.0.0.1:8000/
- Windows: double-click `RUN_GAME_WINDOWS.bat` (needs Python 3)

## How to play

1. **New Game** → create your adventurer: name and one of 16 painted portraits, ancestry, class, background, ability scores (point buy, standard array or 4d6-drop-lowest), skills, spells, personality, then **choose exactly three companions** from ten, and a difficulty.
2. Explore **Hollowmere** during the Festival of Lanterns. Talk to people, shop, hang a lantern on the Lantern Tree. At midnight, a bell rings from a tower that fell eighty years ago…
3. **Act I** begins the morning after. Leave Hollowmere by the south road to open the **world map** (`M`): travel takes hours and may bring road events. Seek the Greenmother in the **Whispering Woods**, learn what **Ashenford** knows, and follow the Old Path to **Valdros**, a ruin that flickers between other lives — the flickers in its streets shift the whole city into another reality, and each reality opens a different way into the Senate Dome. You can camp in the wild (`K`), but camps can be interrupted.

### Controls

| Exploration | Action |
|---|---|
| Left-click the ground | Walk to the selected position |
| Left-click a person or object | Approach and interact |
| WASD or arrow keys | Move relative to the screen |
| Q, E, Z, X | Move along the diagonal directions |
| Space or Enter | Interact with a nearby object |
| Right-drag or middle-drag | Pan the camera |
| Mouse wheel or camera buttons | Zoom |
| Home or Center | Return the camera to the party |
| G or Grid | Toggle the tile grid |
| F / R / K | Search / short rest / camp when available |
| J / I / C / P / M / L | Journal / inventory / character / party / world map / dice log |
| F5 / F9 | Quicksave / quickload |
| Escape | Menu or close a window |

| Combat | Action |
|---|---|
| Left-click a reachable tile | Move |
| Left-click a hostile miniature | Weapon attack, or target a selected ability |
| Action buttons or 1–9 | Select an action or spell |
| Left-click the ground with an area spell | Position the area preview and cast |
| Slot buttons | Choose the spell slot level |
| Right-click or Escape | Cancel the selected action |
| Shift + left-drag or middle-drag | Pan the battlefield |
| Mouse wheel or + / − | Zoom around the pointer or board center |
| Home or Fit | Fit the whole encounter |
| F or Focus | Center the current combatant |
| G or Grid | Toggle the grid |
| Space or Enter | End the player's turn |
| Orders | Set companion strategy |

Gold marks the active character; green marks allies and red marks enemies. Movement previews and area effects retain the game's opportunity attack and friendly fire rules.

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
  ui/          DOM/canvas presentation: screens, panels, portraits (painted art + procedural fallbacks)
  ui/render/   isometric renderer: camera/projection, terrain, buildings, scenery, miniatures, materials
  assets/visuals/  painted title art, map of Elyndra, six companion portraits, paper grain (bundled by Vite)
  audio/       procedural WebAudio music and effects
  i18n/        UI strings (the game is English-only)
public/art/    painted atlases: miniatures, civilians, props, materials, hero/NPC/story portraits
tests/         Vitest suites, incl. end-to-end Prologue and Act I playthroughs and renderer tests
```

## Documentation

- `STORY_BIBLE.md` — world, history, factions, companions, the six-act plot and endings (canon reference)
- `GAME_DESIGN.md` — rules, systems, AI, content formats and how they fit together
- `ROADMAP.md` — milestones and completion criteria
- `DEVELOPMENT_STATUS.md` — what is implemented, tested, and known limitations (keep this current)
