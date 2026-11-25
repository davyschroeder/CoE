# Walking and combat animation update.

## Base and installation.

This patch was made exclusively from the supplied `chronicles-of-aether-v0.4.3.zip`. No files from earlier game copies were reused.

Base archive SHA-256: `301c71863855ad54f29ebfebb337ee1b86f8efbee85b9603f53373d2c5a7b156`.

1. Open the existing v0.4.3 project folder containing `package.json`, `src` and `public`.
2. Extract this update directly into that folder and replace matching files. The ZIP has project-relative paths, with no extra enclosing project folder.
3. Run `npm ci`, then `npm run build`.
4. Start with the existing launcher or `npm run preview`.

Keep the existing artwork and all other project files. This patch contains only changed or added source, tests and this report. It excludes `node_modules/`, `dist/`, `build/`, source maps and unchanged images. No files need deleting.

The supplied archive identifies itself as v0.4.3, while its `package.json` still says 0.4.0. That existing package metadata has deliberately been preserved.

## Animation behavior.

- Walking adds a gentle alternating step, bob and lean to the existing painted miniature. Exploration and combat continue to move through the original `walkToward()` function and walking pace. The gait follows actual displayed travel and stops at rest; exploration input remains responsive.
- Physical attacks make a short lunge toward the displayed target and return to their tile. Target recoil or dodge begins at the strike's impact point, together with attack feedback.
- Spells charge with a cast glow. This includes player and companion spells, healing and support spells, and monster actions whose attack type is spell.
- Successful attacks produce recoil; missed attacks produce a dodge. Damage from terrain and other effects also receives feedback.
- Reaching 0 HP produces a falling animation. Removed enemies remain visible until the fall finishes. Downed party members retain a resting pose and remain clickable for healing on either side of their tile.
- The combat driver waits for movement, attack, reaction and fall clips before the next action, turn transition or result screen. The last fall cannot be skipped by an immediate victory or defeat transition.
- Slow, normal and fast action durations scale using the existing `COMBAT_WALK_MS` ratios. Instant drains pending movement and action presentation immediately. Reduced motion removes the walking gait and uses short, subdued action poses, with individual action durations capped at 140 ms.
- Animation queues can progress while drawing is suspended. Hidden pages settle pending presentation and pause the turn driver; leaving the screen cancels waits and prevents late battle callbacks.
- Opportunity attacks remain between movement segments. Terrain damage from voluntary movement is shown after the corresponding path, while forced pushes and pulls keep their event order.
- Natural-20 death-save revival clears a stale fallen pose even when the engine emits no heal event. Already fallen actors do not stand up just to fall again.

All new animation state is presentation state. It does not assign combat positions, HP, movement points, dice results or save data. The painted artwork is unchanged.

## Complete file list.

### Changed files.

- `src/ui/render/isometric.ts` — Applies optional miniature poses about the feet, renders cast/recoil glow, preserves stationary tile rings and shadows, and allows queued falls to control the visible down state.
- `src/ui/screens/explore.ts` — Tracks displayed walking distance for the player and companions, applies step poses, and respects reduced motion without changing movement timing or input handling.
- `src/ui/screens/combat.ts` — Connects combat events to ordered animation, synchronizes impact feedback, waits through final falls, retains defeated figures temporarily, handles cancellation and visibility, and makes fallen companions targetable.

### Added files.

- `src/ui/render/miniatureAnimation.ts` — Pure pose calculations for walking, lunge, cast, dodge, recoil and fall, with CPU-speed and reduced-motion duration helpers.
- `src/ui/render/combatAnimation.ts` — Presentation-only queue with movement barriers, concurrent attack/reaction clips, impact markers, instant draining and event-order normalization.
- `tests/miniatureAnimation.test.ts` — 15 tests for gait, pose endpoints, speed settings, reduced motion, composition, immutable inputs and gameplay RNG preservation.
- `tests/combatAnimation.test.ts` — 9 tests for movement/action barriers, impact and fall ordering, instant draining, cancellation, input immutability and hazard/forced-movement ordering.
- `tests/combatAnimationLifecycle.test.ts` — 6 tests of real screen methods covering terminal waits, instant completion, input locking, unmount cancellation and fallen-body targeting in both directions.
- `ANIMATION_UPDATE.md` — This installation guide, full change list and verification report.

### Deleted files.

None.

## Required verification results.

- `npm ci` — Passed; installed 45 packages. No dependency or lockfile changes were made.
- `npx tsc --noEmit` — Passed with exit code 0 and no TypeScript diagnostics.
- `npm test` — Passed with exit code 0. All 162 existing tests were preserved and passed, together with 30 new tests.
- `npm run build` — Passed with exit code 0; Vite reported `built in 2.67s`.

Exact full test summary:

```text
 Test Files  23 passed (23)
      Tests  192 passed (192)
```

The build reports warnings about modules imported both dynamically and statically (`src/engine/effects.ts` and `src/ui/dom.ts`). They do not prevent a successful build. npm also reports an environment-level http-proxy configuration warning; installation additionally reports an esbuild postinstall script not covered by the environment's install-script policy. The required commands nevertheless completed successfully. The save recovery test intentionally emits its corrupted-primary-save warning while checking backup recovery.

A byte comparison against the supplied ZIP verifies that engine code, rules, story/data, saves, settings, i18n, existing tests, artwork, CSS, autosave code, tooltip code, companion portraits and `src/ui/render/motion.ts` are unchanged.

For visual inspection, 36 frames were rendered through the actual token renderer using the supplied painted miniature atlas: six poses sampled at six progress points. Their feet-based transformations, glow and resting fall were inspected. These are native Canvas renders, not browser gameplay tests.

## Browser checks that could not be completed.

`npm run preview -- --host 127.0.0.1 --port 4173` starts successfully. A real browser session could not be opened in this environment:

- Local Chromium/Playwright exits before creating a page because socket creation is denied with Operation not permitted.
- The cloud browser control fallback fails before loading the preview with Browser Use could not read requirements.

Consequently, the required real-browser main menu, every character-creation Next step, Hollowmere exploration, conversation, world map with M, combat and reload/Continue sequence was **not tested** at 1280 pixels, 1600 pixels or phone width. Touch behavior and actual browser animation playback are also unverified. Passing TypeScript, automated tests, native renders and a production build does not substitute for these browser checks.

## UPDATE_RULES.md compliance.

No project-preservation rules were intentionally broken. Only the three listed presentation files were changed, with two new helpers and three new test files added. No existing tests were removed, skipped or weakened. The browser validation gate remains unperformed for the environment limitations stated above.

## Merge and browser check (after delivery)

Merged unchanged from the delivered files. The delivery followed `UPDATE_RULES.md`: built on the v0.4.3 ZIP, only presentation files changed, no tests removed, and the missing browser check was reported honestly.

The browser check it could not do was done afterwards in Chromium (1600 px): character creation, walking in Hollowmere, and a full fight (`enc_well`) at each CPU speed, ending the player's turns so companions and enemies act — normal (victory after 22 s), slow (25 s) and instant (5 s). Every fight reached the victory screen; no hang, no console errors. Burst screenshots show the area-spell flash, damage numbers and a character falling at 0 HP. `tsc` clean; 192 tests pass.
