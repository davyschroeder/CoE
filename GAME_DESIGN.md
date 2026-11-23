# Game Design Document — Chronicles of Aether

This document describes the systems **as implemented** in v0.1, plus their intended direction. Status of each feature is tracked in `DEVELOPMENT_STATUS.md`.

## 1. Pillars

1. **A table of four.** One human player and three CPU companions who behave like real players: they suggest, object, vote, joke, notice things and fight with distinct tactics.
2. **A Dungeon Master, not a menu.** Every location, object and conversation is narrated; skill checks are real dice; failure creates complications rather than dead ends.
3. **Choices persist.** All decisions are stored as flags, quest outcomes, relationship values and memories, saved with the game, and referenced by later content.
4. **Tactical d20 combat** that rewards positioning, terrain, conditions and resource management.

## 2. Rules (d20 core)

- **Abilities:** STR, DEX, CON, INT, WIS, CHA. Modifier = ⌊(score − 10) / 2⌋. Scores capped at 20 for player characters.
- **Proficiency:** +2 at level 1, +1 every four levels (+6 at 17).
- **Dice:** d4, d6, d8, d10, d12, d20, d100 via a single RNG module (crypto randomness in play; seedable in tests). Every roll that matters is logged with its breakdown in the **Dice Log**, and skill checks in dialogue show a roll card (d20 face(s), modifiers, total vs DC, success/failure).
- **Advantage/disadvantage:** roll two d20s; any source of each cancels out (no stacking).
- **Natural 20/1:**
  - *Attack rolls:* natural 20 always hits and is a critical (doubles damage dice); natural 1 always misses. Champion-style *Improved Critical* crits on 19–20.
  - *Ability checks and saving throws:* natural 20/1 have **no** automatic effect (shown for drama only).
  - *Death saves:* natural 20 → regain 1 HP; natural 1 → two failures.
- **Skills (18):** Athletics, Acrobatics, Sleight of Hand, Stealth, Arcana, History, Investigation, Nature, Religion, Animal Handling, Insight, Medicine, Perception, Survival, Deception, Intimidation, Performance, Persuasion. Expertise doubles proficiency; Jack of All Trades adds half to unproficient checks.
- **Contests:** Shove = Athletics vs the target's best of Athletics/Acrobatics; ties go to the defender.
- **Passive checks:** passive Perception (10 + bonus, +5 Observant) reveals hidden doors, traps and caches while exploring; other passive skills (Arcana, Investigation…) drive companion "notice" remarks.
- **Rest:** Short rest (1 hour; spend hit dice; recharge short-rest features and pact slots; Arcane Recovery; Song of Rest) — 2 between long rests (1 with *Limited rest*). Long rest (8 hours; full HP, slots, features, half hit dice, Resonance) only at the inn/camp.

### Classes (10)
Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Bard, Warlock, Sorcerer, Barbarian. Each has hit die, saves, armour/weapon training, skill list, starting kit, features at levels 1–5 (some beyond), two **specialisations** at level 3, and casting progression (full, half, or pact). Mechanically implemented signature features include: Second Wind, Action Surge, Extra Attack, Sneak Attack, Cunning Action, Uncanny Dodge, Evasion, Rage, Reckless Attack, Danger Sense, Unarmoured Defence, Lay on Hands, Divine Smite, Channel Divinity (Turn the Faithless, Sacred Weapon, Vow of Enmity), Bardic Inspiration, Cutting Words, Favoured Foe, Hunter's Mark, Hex, Agonising Blast, Quickened Spell, Sculpt Spells, Shield (auto reaction), Protection, Warding Flare, Probability Twist, Colossus Slayer, Dread Ambusher, Assassinate, Fast Hands, Frenzy, Ancestral Protectors, Ember Blessing, Elemental Affinity.

Simplification: all specialisations are chosen at level 3 (in the source tradition some come at levels 1–2).

### Progression
XP table to level 20; HP = max hit die at 1st level, then average + CON per level; ASI/feat levels per class; fighting styles; feats (Tough, Alert, War Caster, Deadeye, Mobile, Resilient, Healer, Observant); new spells/cantrips by class tables. Companions level themselves (their choices follow their personalities and spell preferences) and the player may override. Reserve companions earn half XP.

### Ancestries (8)
Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, and the original **Veilborn** (Unwritten-touched) and **Ashkin** (descendants of an erased people). Traits are mechanical (darkvision affects fog of war; Lucky rerolls 1s; Stoneblood resists poison; Unyielding drops to 1 HP once per long rest; etc.).

### Backgrounds (8)
Soldier, Scholar, Criminal, Acolyte, Folk Hero, Noble, Outlander, Entertainer — each grants skills, items, and **unlocks dialogue options** (`bg:` conditions) throughout the content.

## 3. The Dungeon Master engine

Narrative content is data, not code. Two small, validated languages drive it:

- **Conditions** (`engine/conditions.ts`): `bell_rang && (class:cleric || item:holy_symbol)`, `trust:seris>=20`, `quest:mq_bell=investigate`, `lira_fate=faded`, `res>=1`, `time:night`, `comp:kael`, `bg:soldier`, …
- **Effects** (`engine/effects.ts`): `set flag`, `quest id stage`, `clue`, `complete id outcome`, `give item`, `gold`, `xp`, `rep faction n`, `react tags`, `rel comp dim n`, `bond`, `memory`, `combat enc`, `goto map x y`, `dialogue tree`, `res`, `instab`, `reveal`, `open`, `clock`, `rest`, `camp`, `epilogue`, …

`data/schema.ts` documents both. `tests/content.test.ts` parses **every** condition and effect, and checks that every node, quest stage, clue, item, encounter, map object and speaker referenced actually exists — content errors fail the build's tests.

**Dialogue trees** (`DialogueTree`) hold nodes with conditional text variants (`DText[]`), companion interjections, and options with tone, approach **tags**, skill checks (the player chooses who attempts it, best bonus suggested), success/failure branches, and effects. Nodes flagged `decision: true` enable *Ask the party* and *Let us vote*. Options can be locked with an explanation instead of hidden.

**Maps** carry the DM's narration on entry (variants by game state), lighting, reality instability, music, random encounters and objects (NPCs, containers, locked doors, secret doors, traps, exits, resonance spots, triggers, encounter zones).

**Interesting failure:** failed checks lead somewhere — a fight, a higher price, a hostile echo, a broken lockpick, a noisy door, damage on a fall, lost trust — and alternative routes always exist (e.g. the undercroft can be reached by the secret altar door, the sacristy key or lock, or by climbing the fallen tower; the vault opens by sigil-stone, Arcana, Corvin, or Resonance).

**LLM-readiness:** content flows through `DialogueSession` and the effect interpreter. An optional external LLM Dungeon Master could later generate `DialogueNode`s on the fly and be constrained to the same effect language, so it can never break state. It is not required and not implemented.

## 4. Companions (the "three other players")

Data: `data/companions.ts` (mechanics + personality model), `data/dialogue/companionVoices.ts` (lines), `banter.ts`, `camp.ts`.

Each companion has:
- **Values** per approach tag (−3…+3) for 22 tags (mercy, cruelty, honesty, deception, caution, boldness, curiosity, forbidden, greed, charity, authority, defiance, nature, faith, violence, diplomacy, stealth, protect, humor, pragmatic, knowledge, tradition) and **hard limits** (e.g. Seris: cruelty, forbidden magic).
- **Personality dials** (curiosity, caution, talkativeness, initiative, humour, temper) and **combat personality** (role, aggression, caution, support, focus).
- **State:** a multi-dimensional relationship with the player — **trust, respect, affection, agreement, fear** (separate concepts; e.g. honesty moves trust, mercy moves affection, boldness moves respect) — plus bonds with other companions, **memories** of significant events, mood and stress.

Behaviour (`engine/companionMind.ts`):
- **Reactions:** choosing a tagged option changes the relevant relationship dimensions and produces an in-character line. Strong reactions become memories. Crossing a hard limit is remembered; doing it twice while trust is negative makes the companion **leave the party** (with a farewell).
- **Opinions & suggestions:** at decision nodes, each companion computes a utility for every option (values + personality dials + stress/mood + a little noise) and argues for their favourite in their own voice.
- **Votes:** companions vote by the same utilities; the leader's vote counts double and breaks ties; overruling the party costs respect.
- **Objections:** options that violate an active companion's hard limits are marked ⚠ before you choose; choosing one triggers a refusal line.
- **Ambient role-play:** rate-limited idle remarks gated by location and story progress, companion-to-companion banter (with bond effects), "notice" remarks driven by passive skills (e.g. the best passive Arcana in the party spots the writing on a wall), interjections inside scenes, combat barks.
- **Camp:** private conversations with topics unlocked by story progress and trust; skill checks to read them; options that can deepen or damage relationships; optional, gated romance hints.

## 5. Tactical combat (`engine/combat/combat.ts`)

- Fights happen on the **exploration map itself** (an arena cropped around the participants), so walls, pews, rubble, barrels, pits and hazards are where you saw them.
- **Initiative** (d20 + DEX + bonuses), round/turn order, surprise from ambushes.
- **Action economy:** action, bonus action, reaction, movement (Dijkstra; difficult terrain ×2; allies passable, enemies block). Extra Attack/Multiattack split across movement. Action Surge.
- **Attacks:** melee, ranged, spell attacks, auto-hit (Magic Missile), multi-ray (Scorching Ray), saves with half damage, AoE (radius, cone, line) with friendly fire (Sculpt Spells exempts allies), damage types, **resistance/vulnerability/immunity**, temp HP, criticals.
- **Advantage sources** are computed and shown in tooltips: unseen attacker, prone (melee vs ranged), restrained, stunned, blinded, dodging, invisible, reckless, pack tactics, guiding light, Vow of Enmity, ranged-with-enemy-adjacent, Assassinate.
- **Cover:** half cover (+2 AC) from adjacent low obstacles between attacker and target; walls/pillars/trees block line of sight. **High ground:** +2 to ranged attacks against lower targets.
- **Reactions:** opportunity attacks on leaving reach (Disengage prevents), Shield, Protection, Warding Flare, Cutting Words, Probability Twist, Uncanny Dodge — applied automatically by rule.
- **Conditions** with mechanical effects: poisoned, frightened, charmed, stunned, prone, restrained, blinded, invisible, incapacitated, plus blessed, raging, dodging, hidden, inspired, hexed, marked, shielded, resonant, burning, slowed, disengaged, guarded, reckless, surprised. Durations; save-ends; **concentration** (CON save on damage, one at a time).
- **Dying:** party members at 0 HP make death saves; damage while down adds failures; Help (Medicine DC 10) or healing revives; Ashkin *Unyielding*. Without *Permadeath*, three failures leave the character out of the fight with a lingering-wound flag; with it, they die. Enemies die at 0 (Undead Fortitude may keep them at 1).
- **Environment:** explosive lamp-oil barrels (shoot them, or *Interact* to light one that bursts at the end of your turn; 3d6 fire, chains to nearby barrels, leaves burning ground), acid pools, fire tiles, pits you can **shove** enemies into, high daises, pews and rubble.
- **Bosses:** the **Bellwarden** has three resonance pillars that ward him (half damage except radiant/thunder) and heal him each round until shattered; a recharging AoE Toll (frighten), a summon, and a **phase 2** at half HP (faster, recharges more often; if you learned his name he falters, stunned). The **Echo Sentinel** has a recharging line beam and is vulnerable to thunder. **Seeker Ysolt** casts with a Shield-like reaction and binding sigils.
- **Items in combat:** potions (self or adjacent ally), scrolls and oil flasks.

### Tactical AI (`engine/combat/ai.ts`)
Utility scoring over (position, action, target) candidates generated through the engine's own validation API (so the AI cannot break rules — tests assert zero illegal actions):
- expected damage × hit chance (with advantage/cover), kill chance, target threat, concentration targets, vulnerabilities/resistances;
- healing need and revival priority; buff/control value scaled by target threat and duration;
- risk: opportunity attacks along the path, exposure at the end position (fragile casters avoid melee, tanks seek it), hazards;
- resource cost (spell slots/features) moderated by the *Save your strongest abilities* order, party health and boss fights;
- AoE placement counting enemies hit vs allies hit; barrel shots when ≥2 enemies are clustered; pillar targeting in the boss fight; shoving into pits;
- personality weights per companion and **party orders**: Follow my lead (focus the player's target), Take initiative, Hold position, Protect the weakest, Save your strongest abilities, Use stealth, Avoid unnecessary combat.
- Enemy AI profiles (brute, pack, archer, caster, skirmisher, boss scripts) and difficulty-dependent noise (Tactician enemies play near-optimally).

### Difficulty
Storyteller / Adventurer / Veteran / Tactician scale enemy HP (×0.7…×1.3), enemy attack/DC bonus (−1…+1) and AI precision. Options: permadeath, limited rest, hide enemy HP, manual dice (click to roll), detailed dice breakdowns, CPU speed, auto-end empty turns, text speed, font scale, companion chatter frequency, separate music/effects volume.

Balance reference (simulated with the AI controlling the whole party, 16 runs each): Adventurer level-1 fog fights 69–100% wins, level-2 dungeon fights 100%, **Bellwarden at level 3: ~80%** (≈40% HP left); Tactician Bellwarden ~38%. A thoughtful human player should do better than the autopilot.

## 6. Exploration

- Tile maps (5-ft squares) with **fog of war** (line of sight, radius by lighting; darkvision extends it), explored memory saved per map.
- Click-to-move pathfinding (routes around known traps), keyboard movement, party followers.
- **Hidden things:** caches, secret doors and traps revealed by passive skills or the **Search** action (active check, costs time).
- **Locks:** key, pick (Sleight of Hand; disadvantage without thieves' tools; bad failures jam the lock), or force (Athletics, crowbar bonus, noisy).
- **Traps:** detect (passive), disarm (Sleight of Hand; a bad failure sets it off), or avoid; stepping on them forces a save.
- **Triggers and encounter zones**, random encounters (halved when sneaking), **stealth approach**: with *Use stealth*, a group Stealth check vs DC lets you ambush (enemies surprised) or sneak past.
- **Reality instability** per map (0–10): fragments of other timelines appear as you walk, and at ≥5 enemies may spawn **Echo-Touched** (extra HP, psychic resistance, psychic damage). Using Resonance raises local instability.
- **Aether Resonance** (unique mechanic): gained at the midnight bell. Spend points at resonance spots/options to *glimpse* what a place remembers — revealing hidden doors, names, shutdown glyphs, vault sequences, alternate solutions (calming echoes, escaping the Seeker). Restored by long rest or Aether Draughts. It supplements, never replaces, class abilities.
- World map with fast travel between discovered hubs; later-act regions are shown but locked.
- Time of day and a clock; resting and actions advance time.

## 7. Items & economy

Weapons (simple/martial, properties: finesse, light, heavy, two-handed, versatile, thrown, reach, ranged), armour (light/medium/heavy with Dex caps, Strength requirements, stealth disadvantage), shields, clothing, cloaks, amulets, rings, potions, scrolls, tools, materials, components, quest items, uncommon/rare magic items with real effects (to-hit/damage bonuses, extra damage dice, AC, saves, skills, resistances, resonance). Equipment slots, training requirements, item comparison tooltips, rarity colours, carry weight vs capacity, party gold, three merchants with stock, buy/sell prices modified by discounts earned in the story and Hollowmere reputation.

## 8. Quests, factions, saving

- Quest journal with objectives, journal entries per completed stage, clues discovered, and outcomes. Stages only move forward; completion rewards are granted once.
- Faction reputation values (Conclave, Covenant, Verdant Circle, Last Dawn, Unbound, Hollowmere) change through choices; Hollowmere reputation affects prices. (Faction questlines begin in Act I.)
- Saves: 6 manual slots + quicksave + autosave (on map change, before combat, at the end of the prologue). Versioned JSON with checksum, schema validation, migrations, write-verify, backup copy and automatic recovery; export/import to file. Saving is unavailable mid-combat (autosave happens right before).

## 9. Presentation

Canvas rendering of procedural tiles, tokens, lighting tints, glows and floating combat text; DOM UI with a parchment/dark-stone/bronze/aether palette; procedural SVG portraits; tooltips explaining rules everywhere; procedural WebAudio music per mood and sound effects; fullscreen toggle; UI strings localisable (English + partial Dutch) — narrative content is English and keyed by stable ids for future content packs.

## 10. Phase 3 systems (v0.2)

### Class features, levels 6–10
| Class | New mechanics |
|---|---|
| Fighter | Indomitable (L9, reroll a failed save, 1/long rest). Vanguard: Remarkable Athlete (L7, +½ prof to STR/DEX/CON checks and initiative), Relentless (L10, self-heal below half HP). Bulwark: Guardian's Aura (L7, adjacent allies +1 AC), Steadfast (L10, advantage vs fear/charm). |
| Rogue | Expertise II (L6, two more skills). Nightblade: Deadly Ambush (L9, +2d6 vs creatures that haven't acted). Veil-Thief: Supreme Sneak (L9, advantage on Stealth). |
| Barbarian | Feral Instinct (L7, advantage on initiative), Brutal Critical (L9). Unbroken: Mindless Rage (L6, immune to charm/fear while raging). Ancestors: Spirit Shield (L6, reaction −2d6 damage to an ally). |
| Paladin | Aura of Protection (L6, +CHA to saves within 2 squares), Aura of Courage (L10). Lantern: Aura of Devotion (L7). Iron Vow: Relentless Avenger (L7, opportunity hits slow). |
| Ranger | Roving (L6, +1 speed), Land's Stride (L8, ignore difficult terrain), Nature's Veil (L10, bonus-action invisibility). Hunter: Escape the Horde (L7). Fogwalker: Iron Mind (L7, WIS save proficiency). |
| Cleric | Hearth: Blessed Healer (L6), Divine Strike (L8). Lantern: Improved Flare (L6, protect allies), Potent Spellcasting (L8). |
| Wizard | Evoker: Potent Cantrip (L6), Empowered Evocation (L10). Resonance: Resonant Ward (L6, temp HP on casting), Probability Mastery (L10). |
| Bard | Countercharm (L6), Magical Secrets (L10, two spells from any list). Lore: Additional Magical Secrets (L6). Valor: Extra Attack (L6); Combat Inspiration now adds the die to damage. |
| Warlock | Repelling Blast (L5). Hollow Choir: Entropic Ward (L6), Thought Shield (L10). Ember Court: Ember's Own Luck (L6, +1d10 to a failed save), Fiendish Resilience (L10). |
| Sorcerer | Wild Surge now real (d20 ≤ 2 on levelled spells → one of six surges). Wild: Bend Luck (L6, +1d4 to an ally's failed save). Ember: Ember Ward (L6). Empowered Spell (L10, reroll damage). |

Saving throws in combat go through one routine (`Combat.save`) that applies auras, Countercharm, Steadfast, Ember's Own Luck, Bend Luck and Indomitable in that order. Condition immunities from auras/rage/Thought Shield are checked in `conditionBlocked`.

### Spells (levels 2–5)
Aid, Web, Blindness; Spirit Guardians (a concentration aura that damages enemies starting their turn within 3 squares), Hypnotic Pattern (charm + incapacitate, ends on damage), Fear, Slow, Vampiric Touch (drain), Conjure Barrage; Ice Storm, Blight, Banishment (target untouchable while banished), Greater Invisibility (does not end on attacking), Death Ward; Cone of Cold, Mass Cure Wounds, Hold Monster, Flame Strike, Destructive Wave (spares allies), Synaptic Static, Greater Restoration. Conditions can now be flagged *ends on damage*.

CPU casters prepare spells by score (their signature spells, spell level, healing/area/control value) and the AI values auras as sustained damage worth stepping into the fight for.

### Monsters
New templates ready for Act I: Thornwake Warden (pulling vines, healing sap), Gloam Stalker (pack hunter, venom), Iron Covenant Soldier (reach), Conclave Arcanist (fire, webs, shield ward), Echo Knight (memory-edged blade), and **Ossaryx, the Gloaming Wyrm** (Dusk Breath with recharge, Frightful Presence, **legendary actions** between other creatures' turns: Tail Sweep, Wing Buffet). Any encounter enemy can be marked **elite** (+50% HP, +1 AC, +1 proficiency, double XP). Templates declare **recharge** resources and **loot tables**/gold dice; drops are rolled on victory.

### Crafting
Ten recipes at camp (potions, antitoxin, elixirs, Aether Draughts, oil flasks, cleric scrolls, and three crafted magic items: Echo-Ward Charm, Bellsong Pendant, Fogweave Cloak). The best party member for the recipe's skill makes the check; failure salvages half the materials (none on a failure by 5+). Wizards can copy wizard-spell scrolls into their spellbook (Arcana DC 10 + level, 50 gp per level).

### Factions
Five major factions plus Hollowmere, with leaders, seat, ideology, strengths, flaws, internal divisions and relations from the story bible. Reputation tiers: Hostile ≤ −40, Wary ≤ −10, Neutral, Trusted ≥ 15, Allied ≥ 50. Merchants belong to a faction (default Hollowmere): Wary +15%, Trusted −10%, Allied −20%, Hostile refuses to trade. Content can test `rep:<faction>>=N` or `reptier:<faction>=Trusted`.

### Reactions
Reactions stay automatic (combat resolution is synchronous and must stay deterministic for the AI and tests), but your own character follows your **reaction preferences** (Party → Your reactions): Shield always / below half HP / never; opportunity attacks always / never; defensive features automatic / never. Saved in the game (save format v2).

### Companion personal quests and conflicts
Each companion has a first personal quest (`cq_<id>`, category *companion*). When the companion travels with you and their conditions are met (trust, story progress), a **✦ A personal matter…** button appears at camp. When two companions who clash are both in the party, camp shows their argument and you can step in; your mediation changes their bond and their trust in you. Content lives in `src/data/companionQuests.ts` and is merged into the quest, dialogue, map, encounter and item registries.
