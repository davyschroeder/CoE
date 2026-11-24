# Aetherfall Isometric Edition

## Scope

This release implements the requested visual changes in the existing browser RPG: exploration and combat boards, character miniatures, player portraits, NPC portraits, architecture, materials, and scenery. Gameplay remains local and the interface is English. The campaign remains the supplied Prologue and Act I.

## Isometric boards and map construction

A shared 2:1 diamond projection drives both boards. Inverse projection maps mouse positions back to the real tile coordinates. Movement previews, targeting, spell areas, object interaction, and follower placement use the same map geometry as the engine.

The renderer handles all nine maps and three additional Valdros reality layouts. Eighteen complete external footprints are assembled into coherent buildings, including pitched roofs, masonry or timber facades, lit windows, correctly positioned doors, and chimney smoke. Courtyards, irregular structures and interior rooms retain their authored tile architecture. A footprint audit caught and fixed roofs that would otherwise cover ten walkable Valdros tiles and three Ashenford fence tiles.

Ground is drawn first, then scenery, buildings and people are sorted by depth. Foreground objects become translucent when they cover the party. The exploration camera follows smoothly and can be panned and zoomed. Combat has Fit, Focus and Grid controls, cursor-anchored zoom and camera space reserved for the action bar.

## Painted art

| Asset | Contents and use |
|---|---|
| `art/miniatures.png` | 16 original hero and creature miniatures |
| `art/civilians.png` | 16 added figures: townspeople, four children, and Brakka, Vaelis, Orren and Tessa |
| `art/props.png` | 16 scenery cutouts, including trees, crystals, masonry, lamps, treasure and furniture |
| `art/materials.png` | 16 terrain and construction materials, projected onto floors, walls and roofs |
| `art/hero-portraits.png` | Original player portrait sheet |
| `art/npc-portraits-a.png` and `art/npc-portraits-b.png` | 20 NPC portrait archetypes |
| `art/story-portraits.png` | Eight added story-specific child and companion portraits |
| `src/assets/visuals/` | Title art, map of Elyndra, paper grain and the dedicated portraits of Kael, Seris, Nima, Ilyra, Varek and Korr (bundled by Vite) |

The game offers 16 player portrait choices. Every companion has a face of their own (four story portraits, six dedicated portraits); all 59 NPC identities have explicit or semantic portrait assignments. Minor NPCs share suitable painted archetypes. Older saves have illustrated fallbacks, and new player choices are stored in `portrait.art`.

Source atlases are packaged intact. Canvas source rectangles and SVG viewBoxes select the correct cells at runtime. Local assets have procedural fallback rendering while loading; material caches refresh after decoding.

Some unique monsters use dedicated procedural shapes where a generic miniature would misrepresent them, including the many-legged ossuary crawler and the Bellwarden's fused bell body.

## Animation

Characters move smoothly between positions, breathe subtly while idle, and use illuminated selection rings. Water ripples, torchlight and magical pools pulse; chimney smoke rises; outdoor areas have drifting fireflies. Combat shows attack traces, flashes, impact feedback and floating damage or healing values.

The character art consists of illustrated miniatures. Complete frame-by-frame walking and attack sprite cycles are not included. The environment is a layered 2.5D Canvas scene rather than a polygonal 3D world.

## Interface and integration

All styles are imported in order from `src/app.css`. Exploration controls, combat camera tools, portrait selection cards, dialogue medallions, and the game launcher are included in the release.

`npm run build` outputs the complete game, artwork included, to `dist/`.

## Merging the update into this repository

The update was made by ChatGPT on top of an earlier copy of the project and delivered as files to copy over it. It was merged here with these changes:

- **Theme.** The update's `src/ui/visual-theme.css` was the original visual-edition stylesheet, including the two layout bugs fixed in v0.3.1 (`.creation{position:relative}` made character creation impossible to finish; `.panel{position:relative}` collapsed the HUD; `isometric-edition.css` restored part of the HUD but not character creation), with image paths to a `public/visuals/` folder that no longer exists. `src/app.css` imports the fixed `src/visual-edition.css` instead.
- **Companion faces.** Kael, Seris, Nima, Ilyra, Varek and Korr were mapped to shared archetype portraits that NPCs and player choices also use (Seris had Captain Dray's face; Kael was the default for rogue players and unnamed NPCs). They keep their dedicated painted portraits; Brakka, Vaelis, Orren and Tessa use the new story portraits, which also match their miniatures. `tests/visuals.test.ts` checks that every companion face is unique.
- **English only.** The update removed the Dutch UI option; the unused `src/i18n/nl.ts` was deleted too.
- Not taken over: the update's `build/` folder (built output is not kept in the repository), its release README and its launcher, which served `build/`. `RUN_GAME_LINUX.sh` and `RUN_GAME_WINDOWS.bat` serve `dist/` (or a `build/` folder in a release zip).

## Verification and limits

After the merge: `tsc` is clean and all 158 tests in 19 files pass. In Chromium (1600, 1366 and 1280 px wide): main menu, every character-creation step including the portrait gallery, exploration in Hollowmere, Ashenford, Valdros (all four realities) and the Senate Dome, the world map, dialogue and combat, with no console errors.

ChatGPT's notes on its own verification, for the record:

- Strict TypeScript compilation and Vite production build complete successfully.
- All 155 automated tests in 18 suites pass. They cover game rules, every encounter, content references, save recovery, companion quests, and complete engine-driven Prologue and Act I playthroughs.
- Added presentation tests cover camera projection, sprite selection, combat hit testing, structure/courtyard boundaries and all reality layouts, and asynchronous material loading.
- Native Canvas renders of the actual exploration and combat drawing code were visually inspected, alongside portrait galleries. The QA fixtures include town arrival, the square, the inn, cathedral, woods, and several combat arenas.
- The available browser environments blocked launch or could not reach the local application, so it was not tested in a browser. (Done after the merge, see above.)

Browser saves belong to the browser and address; use the game's export/import feature when moving between them.
