# Aetherfall Visual Edition

A graphical overhaul of the interface, made with ChatGPT for the project owner and integrated into the source here. It changes how the game looks, not how it plays: no rules, quests, combat logic or save data were touched.

## What it adds

- **Title screen:** a painted gothic citadel under a fractured violet sky (`src/assets/visuals/aether-citadel.webp`, 1672×941), a gilded serif title, bronze menu buttons and the tagline "Every choice becomes legend".
- **Companion portraits:** ten painted portraits (`src/assets/visuals/<companion id>.webp`, 256×256) in the medallion frame, everywhere a companion appears — party panel, combat timeline, dialogue, character sheet, party screen, camp and character creation. The class sigil stays on the medallion.
- **Map of Elyndra:** an illustrated parchment map (`elyndra-map.webp`, 1200×1200) under the world map's clickable regions and routes.
- **Interface theme** (`src/visual-edition.css`, loaded after `src/styles.css`): panels, modals, dialogue, character creation, combat action bar, journal, inventory, character sheet, saves, camp and settings; a paper-grain texture (`grain.png`); keyboard focus states; reduced-motion support; adjustments for smaller desktop screens.

Palette: obsidian `#070910`, deep purple `#30244e`, gilt `#d8ae65`, ivory `#f8eccf`, aether violet `#9c70e9`. Typography uses local serif stacks (Palatino, Georgia); no web fonts. All art is bundled by Vite, so the game still runs offline.

## How it was integrated

The delivered version was a separate layer: a stylesheet and a script in `public/`, loaded from `index.html` next to the unchanged compiled game. It was merged into the source instead:

| Delivered | Integrated as |
|---|---|
| `public/visual-overhaul.css` | `src/visual-edition.css`, imported in `src/main.ts` after `styles.css`; image paths point at `src/assets/visuals/` so Vite bundles and fingerprints them |
| `public/visuals/*` | `src/assets/visuals/*` |
| `public/visual-overhaul.js` (swapped portraits in the page by matching the two letters on the medallion, rewrote menu and credits text) | removed: `src/ui/portraits.ts` now draws the painted portrait from the **companion id** (`companionArt()`), and the menu tagline, footer and credits are in `src/ui/screens/mainMenu.ts` |

## Problems found and fixed during integration

1. **Character creation could not be finished.** The theme set `.creation{position:relative}`, which overrode the screen's `position:absolute; inset:0`. The screen lost its full height and on longer steps the Next button fell below the window.
2. **The exploration and combat HUD fell apart.** `.panel{position:relative}` and `.panel>*{position:relative}` overrode the absolute positioning of every HUD panel: the map filled half the screen, the log covered the party panel, the action bar floated mid-screen and only one party member was visible. The rules now use `:where()` (zero specificity), so the game's own positioning wins.
3. **Portraits keyed on initials.** A player character or NPC whose initials matched a companion (e.g. "KV") would have been given that companion's face. Portraits are now keyed on the companion id.
4. **Black triangle on the world map.** The dashed route path had no `fill="none"` and was filled black; the old opaque parchment had hidden it, the new map made it visible (a latent bug in `worldMap.ts`, fixed there).
5. **Action bar wrapped onto two rows** at common desktop widths; it now sizes to its content.
6. The title screen's lantern animation kept running on a hidden canvas; it no longer starts when the theme hides it.

`tests/visuals.test.ts` checks that every companion has a portrait, that matching initials never pull in painted art, that the theme only references bundled files, and that it never sets `position` on screens or HUD panels (the rule that caused problems 1 and 2).

## Not changed

- The exploration and combat boards are still drawn by the procedural canvas renderer; the theme adds a colour grade and vignette. Tokens on the board still show letters, not portraits.
- The player's portrait and NPC portraits are still procedural medallions.
- No new quests, scenes, sound or mechanics.

## Ideas for a later art pass

Painted tiles or tokens for the exploration and combat boards, NPC portraits, location backgrounds for dialogue, and animation — each added with the same regression checks.
