# Development Status

_Last updated: build v0.2 (Phases 1–3 complete)._

This file is the source of truth for **what actually works**. Anything not listed as implemented is not in the game yet.

## Summary

| Area | Status |
|---|---|
| Project, build, tests | ✅ Vite + TypeScript (strict) + Vitest; `npm test` runs the full suite incl. an end-to-end prologue playthrough |
| Phase 3 systems | ✅ Class features 6–10, 22 new spells (levels 2–5), legendary/elite/recharge monsters + loot, crafting, factions, reaction preferences, companion quests & conflicts, code splitting — see `GAME_DESIGN.md` §10 |
| Prologue "The Bell That Never Rang" | ✅ Fully playable start to finish; ends by unlocking Act I (chapter flag + epilogue summary) |
| Acts I–VI | ❌ Designed in `STORY_BIBLE.md` only. World map shows their regions as locked |

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
- 55 dialogue trees in total (prologue main 23, prologue side 22, camp 10).
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
- Settings: CPU speed, manual dice, dice detail, hide enemy HP, auto-end turns, companion chatter, text speed, font size, language (UI), music & effects volume, in-game difficulty change.

**Presentation**: procedural portraits, tiles, lighting, animated menu, procedural music per mood + SFX, fullscreen, tooltips, responsive down to ~900px wide.

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
| `prologue.e2e.test.ts` | **plays the entire prologue** through the engine (dialogues, checks, 8+ fights with AI, travel, looting, resonance, boss, finale) and verifies save/load preserves all consequences |

Manual checks done in Chromium (Playwright): main menu, character creation (rogue, cleric, fighter), opening scene, exploration & movement, NPC dialogue with skill check roll card, all HUD panels, a full fog-hound combat (player casting + companion AI), camp & a companion conversation, the Bellwarden arena. No console errors.

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

## Known limitations / honest notes

- **Only the prologue is content-complete.** After the epilogue you can keep wandering Hollowmere, but Act I is not built.
- Class features beyond level 10 are progression-only (HP/slots/ASIs/extra attacks); the prologue party reaches level ~3–4, so most Phase 3 features are exercised by tests and will matter from Act I on.
- Spells stop at 5th level; summons and terrain-altering spells are not implemented.
- Reactions are not prompted interactively; your character follows the reaction preferences you set.
- Faction tiers affect prices and conditions; faction questlines begin in Act I. The new Act I monsters (incl. Ossaryx) are not yet placed in story encounters.
- Companion personal quests are hooks/foreshadowing only (camp talks); multi-stage companion quests start in Act I.
- Romance is limited to optional hints in camp talks.
- Combat arenas use the exploration map; very large maps may produce wide arenas.
- Audio is procedural and simple; there are no recorded music/voice assets.
- Dutch localisation covers only the main UI strings; all narrative text is English.

## Next development priority

1. Act I content (Phase 4) (see `ROADMAP.md`), starting with Hollowmere aftermath and the Whispering Woods, carrying over all prologue flags.

## Continuity notes for future sessions

- Content ids are stable: flags such as `bell_rang`, `lira_fate`, `maren_forgets`, `corvin_fate`, `ysolt_outcome`, `hawks_help`, `rescued_count`, `halric_named`, `heart_touched`, `prologue_complete` are referenced by later-act design and saves — do not rename.
- Add new content in `src/data/**` and run `npm test`: the content test catches broken references.
- Map grids are generated by a small script (kept out of the repo); edit `src/data/maps/grids.ts` directly or regenerate, then re-run the map tests.
- When adding mechanics, add them to `combat.ts`/`character.ts` and expose through `canUse`/`perform` so the AI stays rule-bound; re-run the balance simulation pattern from `tests/sim.ts`.
