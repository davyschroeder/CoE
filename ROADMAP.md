# Roadmap

Milestones follow the development order of the master brief. A milestone is complete only when its criteria are met **and** covered by tests or a documented manual check.

## Phase 1 — Foundation ✅ (v0.1)
Project (Vite + TypeScript + Vitest), main menu, character creation, dice engine, character statistics, three CPU companions, exploration screen, dialogue system, combat engine, inventory, save/load.
**Criteria:** all systems usable from the UI; unit tests for dice, checks, levelling, damage, saves.

## Phase 2 — Playable Prologue ✅ (v0.1)
Hollowmere (festival and fog), the inn, the Cathedral of Saint Orlen, the undercroft, the Anchor vault; 12 encounters, the Bellwarden boss, the Seeker finale; five quests (main + four side quests with branching outcomes); companion dialogue, banter and camp talks; ending that unlocks Act I.
**Criteria:** a scripted end-to-end test completes the prologue through the real engine and survives save/load (`tests/prologue.e2e.test.ts`); content-integrity tests pass.

## Phase 3 — Deeper RPG systems (next)
- [ ] Level 6–20 class features beyond the current set; more spells of levels 3–9 (fireball etc. exist; many do not); multiclassing (optional)
- [ ] Prepared-spell swapping UX in camp (exists via character sheet) + spell scrolls copying for wizards
- [ ] More enemies and elite variants; legendary actions for late bosses
- [ ] Crafting with materials (echo shards, fog essence, cores)
- [ ] Companion personal quests (stage 1 for all ten), companion–companion conflicts with consequences
- [ ] Faction reputation tiers with gated content and merchant changes
- [ ] Reaction choices for the player (opt-in prompt instead of automatic)
- [ ] Code-splitting the bundle (currently ~800 kB)
**Criteria:** each feature tested; balance simulation re-run (`GAME_DESIGN.md` §5).

## Phase 4 — Act I: Whispers of the Veil
Whispering Woods, ruins of Valdros, Ashenford; recruitment of the remaining seven companions; Sister Maren's betrayal (or its absence if she forgot Elsa); Ossaryx, the Gloaming Wyrm; consequences of every prologue choice (Lira, Corvin, Ysolt, the Grey Hawks, rescued townsfolk).
**Criteria:** Act I completable end-to-end in an automated test from a prologue save.

## Phase 5 — Acts II–VI
Per `STORY_BIBLE.md` §9–10, one act per milestone, each with an end-to-end test and save compatibility with the previous act. Six endings including the hidden one.

## Phase 6 — Polish
Animation, effects, music, performance, UX, accessibility review, balance passes, desktop packaging (Electron or Tauri) for Windows and Linux, full Dutch localisation.
