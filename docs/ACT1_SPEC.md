# Act I — "Whispers of the Veil": implementation contract

This document binds the three Act I content files together. Canon: `STORY_BIBLE.md` §9 (Act I) plus everything the Prologue established. Formats: `src/data/schema.ts` (dialogue schema, condition and effect languages), `src/data/act1/module.ts` (ContentModule). All game text in English.

## Ownership

| File | Owner | Scope |
|---|---|---|
| `src/data/act1/valdros.ts` (+ `src/data/act1/epilogue.ts`) | Writer C | Main quest spine `a1_main`; Hollowmere the morning after (council, Maren, Hale, Corvin, Seris); recruiting **Seris** (Hollowmere) and **Vaelis** (Valdros); the ruins of Valdros incl. reality shifting; the Senate Dome: Maren's betrayal, the Conclave ambush, **Ossaryx**, Severin's projection, the end of Act I; travel events; the Act I epilogue lines |
| `src/data/act1/woods.ts` | Writer A | The Whispering Woods: the Greenmother and the Verdant Circle, the failing Whispering Stone, the Thornwake (Caddoc Briar), woodcutters, gloam hollow; recruiting **Orren** and **Korr**; advancing `a1_main` to `old_path` |
| `src/data/act1/ashenford.ts` | Writer B | Ashenford: Covenant garrison & tax-house, Conclave licensing office, hospice/temple, glassworks, Kiln & Kettle inn, Low Quarter (Wren House, cooper's shop = Unbound safe house), docks, Dawnblade mob; recruiting **Kael, Nima, Varek, Tessa, Ilyra, Brakka**; merchants; the warning about the ambush |

Each file exports one `ContentModule` (`WOODS`, `ASHENFORD`, `VALDROS`). Do not edit other files. Each writer also adds a self-check test `tests/act1_<region>.test.ts` that plays their own content through `tests/harness.ts` (see "Verification").

## Ids and prefixes

- Everything new is prefixed: Woods `a1w_`, Ashenford `a1a_`, Valdros/main `a1v_` — except the fixed ids below.
- Fixed ids: main quest `a1_main`; encounters used by the base maps: `a1_enc_gloam`, `a1_enc_wolves` (Writer A, map `woods`, `relative: true`), `a1_enc_echoes_valdros` (Writer C, map `valdros`, `relative: true`); the boss encounter `a1_enc_ossaryx` (Writer C, map `valdros_dome`).
- New NPCs go in `npcs` (unique ids, with the prefix). Existing NPC ids from `src/data/npcs.ts` (maren, hale, mayor, corvin, ysolt, wenna, pell, tobin, …) may be reused as speakers.
- Recruiting uses the existing effect `recruit <companionId>`. It adds the companion to the party if there is room (max 3 companions), otherwise to the reserve at camp. Gate every recruitment scene with `!recruited:<id>` (and the companion-present variant with `comp:<id>`): the player chose 3 of the 10 at the start, so any of the 7 others may still be unrecruited.

## Main quest `a1_main` (defined by Writer C)

| Stage | Objective (short) | Set by |
|---|---|---|
| `aftermath` | Hollowmere the morning after: speak with the council (Mayor, Hale) and Sister Maren | C (start: a Hollowmere scene, available when `prologue_complete`) |
| `woods` | Seek the Greenmother in the Whispering Woods (and, if you like, learn what Ashenford knows) | C, at the end of the aftermath — also `hub woods`, `hub ashenford` |
| `old_path` | Follow the Old Path to the ruins of Valdros, where Maren waits | **A**, when the Greenmother (or Orren) reveals the Old Path — effects `quest a1_main old_path`, `hub valdros`, `set a1_old_path_known` |
| `valdros` | Find a way into the Senate Dome | C (on arriving in Valdros) |
| `dome` | Confront what waits at the Anchor | C |
| `wyrm` | Deal with Ossaryx | C |
| `severin` | Hear the voice in the Anchor | C |
| `done` | Act I complete | C — ends with effects `set a1_complete`, `chapter act2`, `epilogue act1` |

## Cross-file flags (the contract)

Read freely; **set only by the owner**.

**From the Prologue (all):** `corvin_fate` (handed_over|freed|ally|killed), `ysolt_outcome` (fought|persuaded|escaped), `maren_forgets` (Lira was anchored → Maren no longer remembers Elsa → she has no reason to betray), `lira_fate`, `hawks_help`, `rescued_count`, `halric_named`, `heart_touched`, `knows_unbound`, plus companion quest outcomes `cq_<id>_outcome`.

**Writer A (Woods) sets:**
- `a1_greenmother_met`, `a1_old_path_known`
- `a1_thornwake` = `helped` | `stopped` | `bargained` (what you did about Caddoc Briar's sabotage of the Whispering Stone)
- `a1_stone` = `mended` | `broken` | `left`
- `a1_woods_done` (the Woods' main beats are complete)

**Writer B (Ashenford) sets:**
- `a1_warned_of_ambush` (the party learned the Conclave is waiting at Valdros — via the Unbound safe house, Corvin if freed/ally, Ysolt if `ysolt_outcome=persuaded`, or a garrison report). If set, C's dome scene lets the party spring the trap on its springers.
- `a1_safehouse` = `allied` | `visited` | `betrayed`
- `a1_wren` = `saved` | `lost` | `deal` (the Covenant raid on the Wren House orphanage)
- `a1_mob` = `dispersed` | `fought` | `bought` (the Dawnblade mob hunting Varek, or another Veilborn if Varek is already with you)
- `a1_glassworks` = `reconciled` | `estranged` | `absent` (Nima's family — `absent` if Nima is not with you or not recruited)
- `a1_ashenford_done`

**Writer C (Valdros/main) sets:**
- `valdros_reality` = `flooded` | `burning` | `inhabited` (unset = ruin). Changing it changes the map grid (see below). `valdros_ambush_started`, `valdros_done`
- `a1_maren_fate` = `spared` | `turned` | `killed` | `absent` (`absent` when `maren_forgets`: she never made the deal and is simply a horrified guide)
- `ossaryx_resolved`, `ossaryx_fate` = `slain` | `returned`. Returning Ossaryx home is a hidden-ending requirement: very hard — it needs Resonance (`res>=2`), understanding (e.g. lanterns from its hoard, its name for its lost world), and hard Persuasion/Insight checks; failure falls back to the fight.
- `a1_severin` = `refused` | `listened` | `tempted`
- `a1_complete`

## Maps and coordinates

Grids live in `src/data/maps/grids.ts` (generated by `tools/mapgen.py`). Named points of interest, all verified walkable, are exported as `POIS` from the same file — **use these coordinates** (or any other tile you verify is walkable in `grids.ts`: walkable chars are `, = : . w t % h D + s x a F _`). Do not place objects on top of other objects. Buildings in Ashenford have no interiors: visiting one means a dialogue at its door POI.

| Map id | Size | Base objects already present | POIs |
|---|---|---|---|
| `woods` | 56×40 | exits at the west edge (0,20–21) and east edge (55,20–21) → world map | entry_west (1,20), exit_east (54,20), woodcutter_fire (11,10, a brazier — inspect only), woodcutter_chief (10,10), greenmother (44,8), outpost_gate (43,15), outpost_warden (41,9), anchor_stone (30,30, the stone itself — inspect only), stone_approach (30,28), thornwake_fire (47,31, brazier), caddoc (46,31), thornwake_guard (46,29), gloam_hollow (10,31), ford (31,20), korr_spot (11,33), orren_spot (36,18), road_mid (22,19) |
| `ashenford` | 54×40 | north gate exit (26–28,0), south road exit (26–28,39) → world map | gate_north (27,1), bridge_south (27,38), square (27,14), fountain (27,15, blocks — inspect only), mob (24,16), varek_spot (25,17), garrison_door (10,10), garrison_officer (11,10), conclave_door (43,9), conclave_clerk (44,10), hospice_door (38,15), ilyra_spot (37,16), glassworks_door (14,15), nima_father (15,14), inn_door (9,22), tessa_spot (10,21), wren_door (33,22), wren_matron (34,21), cooper_door (41,22), cooper (42,21), docks (38,28), brakka_spot (35,28), tax_door (25,6), chapel_door (29,6), merchant_glass (21,13), merchant_arms (33,13), notice_board (26,12), tenement (49,22) |
| `valdros` | 48×40, 4 realities | south exit (22–25,38) → world map; dome entrances (only in their reality): great doors (23,3) if `valdros_reality=inhabited`, flooded culvert (31,7) if `=flooded`, breach (17,3) if `=burning` | gate_south (23,37), avenue (23,30), fountain (22,20), observatory (11,10, pillar area), vaelis_spot (12,10), dome_plaza (23,7), flicker_west (6,20), flicker_east (41,20), flicker_south (24,33), camp_spot (24,34), ambush_scout (27,9) |
| `valdros_dome` | 32×28 | exits back to Valdros (south 14–18,27; west 1,12; east 30,12) | entry_south (16,26), entry_west (2,12), entry_east (29,12), anchor (16,12, the Anchor — inspect only), maren_spot (16,15), ossaryx (16,7), vex (16,4), warden_a (12,6), warden_b (20,6), arcanist (16,3) |
| `hollowmere` (Prologue map) | 50×34 | after the prologue: south road exit (24–26,33) → world map. The prologue's night versions of Maren, the Mayor and Hale are hidden once `prologue_complete` | Free walkable spots for C's aftermath NPCs: (24,13), (21,16), (28,16), (29,14), (18,15), (25,10), (27,10) — Hale's watch house door is (29,5) (inspect present), Wenna (11,25) remains |

**Valdros realities.** The ruin variant has **no way into the Senate Dome**. Each reality opens exactly one route: `inhabited` (the great doors stand open), `flooded` (wade through the culvert), `burning` (the west wall has fallen). Writer C places "flicker" objects (at flicker_west / flicker_east / flicker_south and anywhere else in Valdros that is walkable in all four variants — the avenue `=` tiles x 22–25 and the cross-avenue y 19–21 are) whose dialogues set `valdros_reality`. Shifting should cost something or need something (Resonance, an Arcana check that can fail with a complication, a companion's help — Vaelis especially), and each reality should have its own flavour, dangers and dialogue (e.g. the inhabited Valdros has people in it who see you as ghosts). Use `set valdros_reality flooded` etc.; `unset valdros_reality` returns to the ruin.

## Enemies

Use templates from `src/data/enemies.ts`: fog_hound, hollow_echo, sellsword, sellsword_captain, restless_pilgrim, ossuary_guard, ossuary_archer, ossuary_crawler, echo_sentinel, conclave_warden, seeker_ysolt, thornwake_warden, gloam_stalker, covenant_soldier, conclave_arcanist, echo_knight, ossaryx. Encounter enemies may be marked `elite: true`. You may add new templates via `enemies` in your module, but only with **existing action ids** from `src/data/actions.ts`.

Party level across Act I: about 4 at the start, 5 after the Woods/Ashenford, 6 at the Dome. Size fights accordingly (3–5 regular enemies, elites sparingly). Writer C's Dome: the ambush (Conclave forces; who leads depends on `ysolt_outcome` — if she was persuaded she is *not* there, and may have warned you) and Ossaryx are separate fights; Ossaryx's stats are tuned by the engine developer.

## Verification (each writer)

1. `npx tsc --noEmit` — clean (errors in files you don't own are someone else's work in progress; mention them, don't fix them).
2. `npx vitest run tests/content.test.ts` — passes (checks every node, condition, effect, speaker, tag, quest stage/clue/outcome, item, map object position, exit, encounter).
3. Write `tests/act1_<woods|ashenford|valdros>.test.ts` using `Harness` from `tests/harness.ts` (see `tests/companionQuests.test.ts` for the pattern): start from a post-prologue state, play your region's main path and each side quest to completion (dialogues by option predicates, fights via `H.fight`), and assert the contract flags above get set. Run it.
