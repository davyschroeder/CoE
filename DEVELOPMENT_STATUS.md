# Development Status

_Last updated: build v0.4 (Phases 1–4 complete: Prologue and Act I; Aetherfall Isometric Edition)._

This file is the source of truth for **what actually works**. Anything not listed as implemented is not in the game yet.

## Summary

| Area | Status |
|---|---|
| Project, build, tests | ✅ Vite + TypeScript (strict) + Vitest; `npm test` runs the full suite incl. an end-to-end prologue playthrough |
| Phase 3 systems | ✅ Class features 6–10, 22 new spells (levels 2–5), legendary/elite/recharge monsters + loot, crafting, factions, reaction preferences, companion quests & conflicts, code splitting — see `GAME_DESIGN.md` §10 |
| Prologue "The Bell That Never Rang" | ✅ Fully playable start to finish; ends by unlocking Act I (chapter flag + epilogue summary) |
| Act I "Whispers of the Veil" | ✅ Fully playable from the morning after the prologue to the Act I epilogue: Hollowmere, the Whispering Woods, Ashenford, Valdros (4 realities), the Senate Dome; all ten companions recruitable — see below |
| Acts II–VI | ❌ Designed in `STORY_BIBLE.md` only. World map shows their regions as locked |

## Implemented features

**Core & rules**
- Dice engine (d4–d100, expressions, advantage/disadvantage, criticals), crypto RNG, seedable for tests.
- Ability scores/modifiers, proficiency, 18 skills, expertise, Jack of All Trades, saves, contests, passive Perception, death saves with nat 1/20 rules; nat 20/1 not automatic on checks.
- 8 ancestries, 8 backgrounds, **10 classes** with 2 specialisations each, levels 1–20 (HP, proficiency, slots, ASIs/feats, fighting styles, new spells; key features listed in `GAME_DESIGN.md`), 8 feats.
- 35 spells (cantrips to 3rd level) plus ~48 class features, basic actions and monster abilities, concentration, upcasting, pact magic, prepared vs known casters.
- ~75 items with real effects (weapons, armour, shields, cloaks, amulets, rings, potions, scrolls, tools, materials, quest items, several magic items).

**Characters & party**
- Character creation wizard (identity/portrait, ancestry, class, background, point buy / standard array / 4d6 roll, skills & expertise, spells, personality & motivation, choose exactly 3 of 10 companions, difficulty & optional rules).
- 10 companions with values, hard limits, personality and combat dials, bios, secrets (hidden), voices (reactions, suggestions, combat barks, idle remarks, refusals, votes, farewells), 59 banters, 10 camp conversations (264 nodes).
- Companion mind: multi-dimensional relationship (trust/respect/affection/agreement/fear), bonds, memories, mood, stress; reactions to tagged choices; opinions & arguments at decisions; party votes; objections to hard-limit violations; companions **can leave**.
- Level-up UI with subclass/ASI/feat/style/spell choices (companions pre-choose; player can override).

**Dungeon Master & content**
- Condition + effect languages, dialogue engine (conditional text, interjections, skill checks with roller choice, success/failure branches, locked options with reasons, once-only options, decision nodes, vote).
- 55 prologue-era dialogue trees (prologue main 23, prologue side 22, camp 10), plus the companion-quest trees (Phase 3) and 71 Act I trees (see below).
- 5 maps (Hollowmere festival/fog states, the Lantern & Lamb, the Cathedral, the Undercroft, the Anchor Vault), all reachability-checked.
- 5 quests: main quest (8 stages, 8 clues, 3 outcomes) + Trouble at the Lantern & Lamb (5 outcomes), Lost in the Fog (3 rescues, each solvable by fight or by skill/resonance), The Girl Nobody Remembers (3 outcomes incl. a hidden long-term consequence for Sister Maren), The Scholar's Dig (4 outcomes).
- 12 encounters, 12 enemy types incl. 2 bosses with mechanics (Bellwarden: pillars, phases, toll, summons; Seeker Ysolt), Echo Sentinel (recharging beam), echo-touched variants from instability.
- Multiple approaches everywhere: e.g. three routes into the undercroft, four ways to open the vault, five ways to deal with the Seeker.

**Exploration**
- Canvas tile renderer, fog of war with LOS, lighting by map state, party followers, click-to-move pathfinding, keyboard movement, zoom.
- Passive and active searching, secret doors, hidden caches, traps (detect/disarm/avoid/trigger), locks (key/pick/force), triggers, encounter zones, random encounters, stealth approach (ambush or sneak past), reality instability fragments, Aether Resonance glimpses, world map fast travel, time of day.
- Short/long rest, camp (talks, party swap, prepare spells, equipment), shops (3 merchants, discounts from story choices and reputation).

**Combat**
- Initiative, action economy, movement with difficult terrain, opportunity attacks, Extra Attack/multiattack, all listed conditions with effects, cover, high ground, AoE templates with friendly fire, reactions, concentration, death saves, revive, items in combat, explosive barrels & burning ground, pits & shoving, boss phases, flee where allowed, nonlethal brawls.
- Utility AI for companions and enemies; party orders; difficulty scaling.
- UI: initiative timeline, party panel with conditions & death saves, action bar grouped by action/bonus/spells/items with tooltips, spell slots & upcasting, movement preview with opportunity-attack warning, target highlights, AoE preview, hit chance with advantage reasons, combat log, floating numbers, barks, CPU speed setting.

**Saving & settings**
- 6 manual slots, quicksave (F5/F9), autosaves; versioned + checksummed + validated + migratable save format; backup & auto-recovery; export/import to file.
- Settings: CPU speed, manual dice, dice detail, hide enemy HP, auto-end turns, companion chatter, text speed, font size, music & effects volume, in-game difficulty change. The game is English-only (older saves with the former Dutch UI setting load as English).

**Presentation**: isometric exploration and combat boards with painted miniatures, scenery, materials and buildings; painted portraits (16 player choices, a unique face per companion, named or archetype NPC portraits); animated light, water, smoke and combat feedback; painted title screen and map of Elyndra; procedural music per mood + SFX; fullscreen, tooltips; desktop layout tested at 1280–1600 px wide.

## Tests (`npm test`)

| Suite | What it covers |
|---|---|
| `dice.test.ts` | parsing, bounds for every die, crit doubling, adv/dis, uniformity |
| `rules.test.ts` | modifiers, proficiency, XP levels, check maths, nat-20 rule, auto-fail saves, disadvantage, death saves, AC, resistances/vulnerability/immunity/temp HP, **every class 1→20** |
| `content.test.ts` | every dialogue node/option/condition/effect/speaker/tag; companion voices & banter; map objects on valid tiles; exits land on walkable tiles; encounters/enemies/items/spells/shops cross-references |
| `combat.test.ts` | initiative, action economy, illegal actions rejected, **every encounter × several seeds runs to completion with zero illegal AI actions**, all companions fight, Bellwarden win-rate floor, Action Surge regression |
| `save.test.ts` | round-trip, checksum corruption, validation, backup recovery, migrations |
| `state.test.ts` | quest monotonicity, no duplicate rewards, condition language, companion reactions/limits/leaving, opinions & votes, dialogue → state → reactions |
| `phase3.test.ts` | auras, Indomitable, Land's Stride, Expertise II, Magical Secrets, Spirit Guardians, Death Ward, ends-on-damage, elites, legendary actions, Ossaryx & new enemies fight legally, crafting, scroll copying, faction tiers & trade refusal, reaction preferences, save v1→v2 migration, AI picks auras |
| `companionQuests.test.ts` | **every companion quest** becomes available at camp and is completed through its own map objects (dialogue and fights); every conflict appears and resolves |
| `act1_engine.test.ts` | Valdros realities (grid swap, exactly one Dome route per reality, none in the ruin), travel time and road events, reachability of every Act I point of interest, milestone XP once per stage, `surpriseIf`, walkable arrival points, Pell's scene for every Lira outcome |
| `act1_woods.test.ts` / `act1_ashenford.test.ts` / `act1_valdros.test.ts` | every Act I quest and outcome played through its own dialogues and fights: Greenmother (calm or angered), the three Thornwake outcomes, Red Cord, Orren & Korr; Wren House ×4, mob ×3, glassworks ×3, safe house ×3, the five ambush-warning routes, all six Ashenford recruitments; aftermath, Seris, Vaelis, realities and their inhabitants, betrayal (or `maren_forgets`), ambush led by Ysolt or Vex, turned or parleyed, Ossaryx slain or sent home, Severin refused/listened/tempted, epilogue exclusivity |
| `act1.e2e.test.ts` | **continues the real prologue playthrough through all of Act I** (Hollowmere → Woods → Ashenford → Valdros → Dome → Ossaryx → Severin → epilogue → chapter `act2`) on earned XP only, asserts the designed level curve (4 → 5 → 6) and save/load |
| `prologue.e2e.test.ts` | **plays the entire prologue** through the engine (dialogues, checks, 8+ fights with AI, travel, looting, resonance, boss, finale) and verifies save/load preserves all consequences |

Manual checks done in Chromium (Playwright): Act I — the morning-after scene and council, the world map with Act I regions, Valdros arrival and a reality shift (flooded grid), the Senate Dome, the turned ambush (enemies surprised) and the Ossaryx arena, the Act I epilogue screen; earlier: main menu, character creation (rogue, cleric, fighter), opening scene, exploration & movement, NPC dialogue with skill check roll card, all HUD panels, a full fog-hound combat (player casting + companion AI), camp & a companion conversation, the Bellwarden arena. No console errors.

## Phase 3 additions (v0.2)

- **Class features 6–10** for every class and specialisation, all mechanically implemented (previously data-only features Indomitable, Combat Inspiration and Wild Surge now work too). Rogue Expertise II and bard Magical Secrets are chosen in the level-up screen.
- **22 new spells** (levels 2–5) incl. Spirit Guardians aura, Hypnotic Pattern (ends on damage), Banishment, Greater Invisibility, Death Ward; smarter CPU spell preparation; AI support for auras and Aid.
- **Monsters:** 6 Act I-ready templates (incl. Ossaryx with legendary actions and recharging breath), elite variants for any encounter, recharge abilities, loot tables & gold drops shown on the victory screen.
- **Crafting** at camp (10 recipes, 3 new crafted magic items) and **scroll copying** for wizards.
- **Factions** tab in the journal (5 factions + Hollowmere, tiers Hostile→Allied), faction-aligned merchant prices, hostile merchants refuse to trade, `reptier:` conditions.
- **Reaction preferences** for your character (Party screen); save format **v2** with automatic migration from v1.
- **Companion personal quests (stage 1, all ten companions)** in `src/data/companionQuests.ts`: each starts from camp (✦ A personal matter…) when that companion travels with you and their condition holds (trust and/or camp-talk hints; most after the prologue, Orren's, Korr's and Tessa's already during the fog night). 2–3 stages each, set in the existing maps, with tagged decisions, skill checks whose failure changes the outcome, relationship changes, memories, rewards (10 new items) and outcome flags for Act I (e.g. `cq_kael_outcome`, `vaelis_severin_hint`, `hollowmere_interdict`). 4 optional non-lethal fights; there is always a non-combat route.
  | Quest | Companion | Outcomes |
  |---|---|---|
  | A Letter With No Seal | Kael | honest / lied / empty (+ the courier's fate) |
  | What the Roots Remember | Orren | hidden / shared / tested |
  | The Voice in the Grey | Korr | sung / fought / silent |
  | Steadfast | Brakka | wrote / carried / kept / lost |
  | An Instrument of His Own Design | Vaelis | burned / kept / turned / pinged |
  | Sealed Orders | Seris | condemned / warded / questioned / spared |
  | The Voice in the Crackle | Nima | spoke / contained / flared / refused |
  | What the Water Gave Back | Ilyra | stayed / sought / vigil |
  | What the Choir Asks | Varek | bargained / refused / halric |
  | The Bell's Lost Verse | Tessa | sung / torn / half / unsung |
- **Companion conflicts (5):** Seris–Varek, Vaelis–Seris, Kael–Seris, Nima–Vaelis, Brakka–Korr. Shown at camp when both are in the party; side with one, the other, or try to reconcile them (Persuasion/Insight DC 14–15). Bonds and trust shift; one side choice in each costs a companion heavily.
- Fix: a party that re-entered the vault after the prologue had no exit (the original exit disappears once the Heart is touched); a return exit now appears.
- **Bundle split** into engine/UI, data and dialogue chunks (no chunk-size warning).
- Fixed along the way: CPU actions are re-validated after moving (a boss stunned mid-move by a phase change could otherwise act); bosses' scripted abilities check legality.

## Act I additions (v0.3)

Content lives in `src/data/act1/` (one `ContentModule` per region, merged into the global registries; contract in `docs/ACT1_SPEC.md`). Roughly 60,000 words of dialogue: 7 quests, 71 dialogue trees, 39 new NPCs, 9 new enemy templates, 17 encounters, 14 items, 3 shops, 7 road events and 48 epilogue lines.

- **Hollowmere, the morning after** (`valdros.ts`, `hollowmere.ts`): the council under the Lantern Tree, Captain Hale and Corvin's fate (handed over → you can get him released; freed/ally → he left word; killed → the truth or a lie), Sister Maren's half-true request, **Seris** recruitable; small scenes for Lira's fate (Pell), the Grey Hawks (`hawks_help`) and Brother Halric's name.
- **World map & travel**: travel takes hours; 40% chance of a weighted, once-only road event on longer journeys (refugees, Dawnblade pilgrims, Conclave riders, Ysolt on the road, a procession of the forgotten…). Wilderness camping (`K`) with interruption risk per map.
- **The Whispering Woods** (`woods.ts`): the Greenmother and the Verdant outpost, the Old Path (also reachable if you anger her), Caddoc Briar's Thornwake and the failing Whispering Stone (helped / stopped / bargained; broken / mended / left), the woodcutters' Red Cord, **Orren** and **Korr**.
- **Ashenford** (`ashenford.ts`): the Wren House (saved / lost / deal), the Dawnblade mob (dispersed / fought / bought), the Emberglass glassworks and Nima's father (reconciled / estranged / absent), the Unbound safe house (allied / visited / betrayed), garrison, Conclave office, hospice, chapel, inn, docks, two merchants; **Kael, Nima, Varek, Tessa, Ilyra, Brakka**. Five ways to learn of the ambush at Valdros.
- **Valdros** (`valdros.ts`): four realities with their own map grids (ruin / flooded / burning / inhabited), shifted at flickers for Resonance, an Arcana check that can hurt, or free with Vaelis; each reality opens exactly one way into the Senate Dome and has its own inhabitant; **Vaelis**; a hidden Conclave scout.
- **The Senate Dome**: Maren's betrayal (or, if `maren_forgets`, a horrified guide); the Conclave ambush led by Ysolt (if she fought/escaped) or High Seeker Vex — if you were warned, spotted them or caught the scout you can strike first (enemies surprised) or talk them into withdrawing; Maren spared / turned / killed; **Ossaryx** (fight, or the hidden path of sending it home: Resonance + understanding + two hard checks); Archon Severin's projection (refused / listened / tempted); the Act I epilogue and `chapter act2`.
- **Engine**: milestone XP on quest stages (`stages.<id>.xp`, granted once); `EncounterDef.surpriseIf` (story-driven surprise); a short-rest beat between the Dome's two fights; `shortRest` over-healing fixed (hit-die healing was accumulated twice); the map generator is now in the repo (`tools/mapgen.py`, with walkability and reachability checks); Act I content split into per-region chunks.
- **Balance** (AI-vs-AI simulation, level 6, Adventurer): the ambush is won 95–100% of the time; Ossaryx after the ambush and the short rest about 72% on average over 10 party/class combinations (best 11–12/12; an all-caster party without a frontline, e.g. Vaelis/Nima/Kael with a wizard, only ~2/12). The main path awards enough XP for level 4 at the start, 5 after the Woods, 6 at the Dome.

## Aetherfall Visual Edition (v0.3.1)

Painted title art, ten companion portraits, an illustrated map of Elyndra and a new interface theme, made with ChatGPT and integrated into the source (`src/visual-edition.css`, `src/assets/visuals/`, portraits via `companionArt()` in `src/ui/portraits.ts`). Integration fixed six problems in the delivered version, two of them game-breaking (character creation could not be completed; the exploration/combat HUD collapsed). Details and the list of fixes: `docs/VISUAL_EDITION.md`. Checked in Chromium: menu, all creation steps, exploration HUD, world map, dialogue and combat at 1600, 1366 and 1280 px wide.

## Aetherfall Isometric Edition (v0.4)

Made with ChatGPT as an update package and merged here; details in `docs/ISOMETRIC_EDITION.md`.

- **Renderer** (`src/ui/render/isometric.ts`, `mapArchitecture.ts`, `materials.ts`): shared isometric camera for exploration and combat, buildings assembled from map footprints (with a check that roofs never cover walkable tiles), painted props and materials from `public/art/`, painted miniatures, animated effects, pan/zoom/fit/focus/grid controls.
- **Portraits** (`src/ui/portraits.ts`): 16 player portraits chosen in character creation (stored in `portrait.art`; older saves get a fallback), story portraits for Pell, Mira, Lira, Jory, Brakka, Vaelis, Orren and Tessa, archetype portraits for NPCs and enemies.
- **Changed during the merge:** the update shipped the original theme CSS with the two layout bugs fixed in v0.3.1 (character creation could not be finished; the HUD collapsed) — the fixed theme is kept. Six companions (Kael, Seris, Nima, Ilyra, Varek, Korr) were mapped to shared archetype faces that NPCs and player choices also use (Seris looked like Captain Dray); they keep their own painted portraits, so every companion has a unique face (guarded by `tests/visuals.test.ts`). The unused Dutch UI table was removed.
- **Tests:** 158 in 19 files, incl. the update's projection, sprite selection, combat hit-testing, building-footprint and material-loading tests. Checked in Chromium: menu, all creation steps incl. the portrait gallery, exploration in Hollowmere, Ashenford and Valdros (ruin and other realities), the Senate Dome, world map, dialogue and a combat round — no console errors.

## Narration (v0.4.5)

The opening scene ("Arrival", the first two Dungeon Master screens) is narrated by a recorded voice made with ElevenLabs (voice: Darren), `public/audio/narration/prologue-arrival.mp3`. `src/data/narration.ts` maps recordings to dialogue nodes; `src/audio/narration.ts` plays a clip while the player is on its nodes, stops it when they move on or the dialogue closes, and ducks the music meanwhile. Settings → Audio → "Narration voice" sets the volume (0 = off). A missing file is silent. Checked in Chromium: plays on screen 1, continues on screen 2, stops afterwards. Only this scene is voiced so far.

## Known limitations / honest notes

- **The Prologue and Act I are content-complete; Acts II–VI are not built.** After the Act I epilogue you can keep exploring the Act I regions; Act II regions on the world map stay locked.
- Ossaryx is hard for parties without a frontline or healer (see Balance above); Story difficulty helps. Balance numbers come from AI-controlled parties, not human play-testing.
- Act I playtesting has been automated (every quest outcome, a full end-to-end run) plus a browser smoke test of key scenes; a complete manual playthrough by a human has not been done.
- Some prologue consequences are only light reactivity in Act I (Pell, the Grey Hawks, Halric's chalked name); bigger callbacks are planned for later acts.
- Class features beyond level 10 are progression-only (HP/slots/ASIs/extra attacks); the prologue party reaches level ~3–4, so most Phase 3 features are exercised by tests and will matter from Act I on.
- Spells stop at 5th level; summons and terrain-altering spells are not implemented.
- Reactions are not prompted interactively; your character follows the reaction preferences you set.
- Faction tiers affect prices and conditions; Act I contains faction-relevant choices (Verdant Circle, Unbound, Covenant, Last Dawn, Conclave), but full faction questlines start in Act II.
- Companion personal quests have one chapter each (Phase 3); their outcomes colour Act I scenes and the epilogue, follow-up chapters are for later acts.
- Romance is limited to optional hints in camp talks.
- Combat arenas use the exploration map; very large maps may produce wide arenas.
- Music and effects are procedural and simple. Only the opening scene has recorded narration.
- Art: miniatures are single illustrated poses (no frame-by-frame walk or attack cycles); the world is 2.5D Canvas, not 3D. Some minor NPCs without a matching miniature are drawn as a plain fallback figure. Several enemies of one type share a miniature; NPCs share archetype portraits.
- The painted atlases (`public/art/`, ~22 MB of PNG) make the first load heavier than before.
- The game is English-only by design.

## Next development priority

1. Act II "Kingdoms of Ash" (Phase 5, see `ROADMAP.md` and `STORY_BIBLE.md` §9): Solmara, the Iron Mountains, the Ember Wastes, the Fortress of the Fallen King — reusing the Act I pipeline (spec → per-region content modules → per-region tests → end-to-end test continuing from the Act I run).
2. A human playthrough of Act I to tune pacing and Ossaryx for frontline-less parties.

## Continuity notes for future sessions

- Content ids are stable: flags such as `bell_rang`, `lira_fate`, `maren_forgets`, `corvin_fate`, `ysolt_outcome`, `hawks_help`, `rescued_count`, `halric_named`, `heart_touched`, `prologue_complete` are referenced by later-act design and saves — do not rename.
- Add new content in `src/data/**` and run `npm test`: the content test catches broken references.
- Map grids are generated by `tools/mapgen.py` (`python3 tools/mapgen.py src/data/maps/grids.ts`), which also exports `POIS` and fails if a point of interest is blocked or unreachable. Act I flags (`a1_*`, `valdros_reality`, `ossaryx_fate`, …) are listed in `docs/ACT1_SPEC.md` and are part of the save contract — do not rename.
- When adding mechanics, add them to `combat.ts`/`character.ts` and expose through `canUse`/`perform` so the AI stays rule-bound; re-run the balance simulation pattern from `tests/sim.ts`.
