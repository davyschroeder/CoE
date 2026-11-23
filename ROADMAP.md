# Roadmap

Milestones follow the development order of the master brief. A milestone is complete only when its criteria are met **and** covered by tests or a documented manual check.

## Phase 1 — Foundation ✅ (v0.1)
Project (Vite + TypeScript + Vitest), main menu, character creation, dice engine, character statistics, three CPU companions, exploration screen, dialogue system, combat engine, inventory, save/load.
**Criteria:** all systems usable from the UI; unit tests for dice, checks, levelling, damage, saves.

## Phase 2 — Playable Prologue ✅ (v0.1)
Hollowmere (festival and fog), the inn, the Cathedral of Saint Orlen, the undercroft, the Anchor vault; 12 encounters, the Bellwarden boss, the Seeker finale; five quests (main + four side quests with branching outcomes); companion dialogue, banter and camp talks; ending that unlocks Act I.
**Criteria:** a scripted end-to-end test completes the prologue through the real engine and survives save/load (`tests/prologue.e2e.test.ts`); content-integrity tests pass.

## Phase 3 — Deeper RPG systems ✅ (v0.2)
- [x] Class features to level 10 for all ten classes and specialisations (auras, Indomitable, Brutal Critical, Land's Stride, Magical Secrets, Expertise II, Potent Cantrip, Empowered Evocation, Wild Surge…)
- [x] 22 new spells of levels 2–5 incl. persistent auras (Spirit Guardians), Death Ward, Greater Invisibility, Hypnotic Pattern, Banishment, Cone of Cold
- [x] Smarter CPU spell preparation and AI support for the new options (auras, Aid, control spells)
- [x] Six Act I-ready enemies incl. Ossaryx with legendary actions; elite variants; recharge abilities; loot tables
- [x] Crafting with materials (10 recipes) + wizards copying scrolls into their spellbook
- [x] Faction overview with reputation tiers (Hostile → Allied), merchant pricing/refusal, `reptier:` conditions
- [x] Reaction preferences for the player character (Shield, opportunity attacks, defensive features); save format v2 with migration
- [x] Companion personal quests (stage 1 for all ten) and companion–companion conflicts with consequences
- [x] Code-split bundle (engine/UI, data, dialogue chunks)
- [ ] Class features 11–20 beyond progression (deferred to the acts that reach those levels)
- [ ] Spells of levels 6–9; summons; terrain-shaping spells
- [ ] Multiclassing (optional)
- [ ] Interactive reaction prompts (current design: preferences, because combat resolution is synchronous)

## Phase 4 — Act I: Whispers of the Veil
Whispering Woods, ruins of Valdros, Ashenford; recruitment of the remaining seven companions; Sister Maren's betrayal (or its absence if she forgot Elsa); Ossaryx, the Gloaming Wyrm; consequences of every prologue choice (Lira, Corvin, Ysolt, the Grey Hawks, rescued townsfolk).
**Criteria:** Act I completable end-to-end in an automated test from a prologue save.

## Phase 5 — Acts II–VI
Per `STORY_BIBLE.md` §9–10, one act per milestone, each with an end-to-end test and save compatibility with the previous act. Six endings including the hidden one.

## Phase 6 — Polish
Animation, effects, music, performance, UX, accessibility review, balance passes, desktop packaging (Electron or Tauri) for Windows and Linux, full Dutch localisation.
