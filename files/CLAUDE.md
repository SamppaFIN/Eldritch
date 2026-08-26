# CLAUDE.md — Eldritch Sanctuary v3

GPS territory-capture game. Walk a closed loop in the real world, claim the land inside it,
steal it from other players. Lovecraftian aesthetic and lore inherited from v2.

This is a rewrite of v2 (`SamppaFIN/EldrichHorror-v2`), not a refactor. v2 had 43 systems,
68 `<script>` tags, no bundler, 4081-line files, and 0% verified test coverage. Its content
was excellent; its architecture was not. Content has already been extracted into this repo.

## Golden rules

1. **The server owns the truth.** The client may render optimistically, but ownership,
   XP, and capture outcomes are decided only by Postgres RPC. Never write to `cells`,
   `profiles`, or `wager_scores` from the client.
2. **No file exceeds 400 lines.** When you hit the limit, split the file. Do not raise
   the limit. (v2's `MapSystem.js` was 4081 lines and became unmaintainable.)
3. **Game rules live in `packages/core`** as pure functions — no React, no DOM, no network.
   Every rule function needs a Vitest test. Untested does not merge.
4. **Never edit an existing file in `supabase/migrations/`.** Add a new numbered migration.
5. **Do not read the legacy repos.** Everything worth keeping is already here in
   `packages/core/rules/constants.ts`, `supabase/seed/`, and `docs/backlog/`.
6. **Nothing from `docs/backlog/` gets built before Phase 5 ships.** This is the rule that
   v2 broke. Quests, combat, health/sanity, TTS, procedural audio, OSM buildings, AI dialogue,
   shrines, merchants, anchors — all parked. They are written down; they are not next.
7. **Run `pnpm test && pnpm typecheck` before declaring any task done.** No exceptions.
8. Ask before adding a dependency.

## Stack

- React 19 + TypeScript (strict) + Vite, pnpm workspaces
- MapLibre GL JS (NOT Leaflet — v2 used Leaflet and had to disable clustering because it broke;
  MapLibre clusters natively and renders tens of thousands of hexagons on the GPU)
- h3-js on the client, `h3` + `h3_postgis` in Postgres
- Zustand (game state) + TanStack Query (server state)
- Supabase: Postgres + PostGIS + Realtime + Auth + RPC. **No separate Node server.**
  v2's Express + Socket.io backend on Heroku is replaced entirely by RPC + Realtime.
  **Not wired up until Phase 3** — see "Data layer" below.
- Capacitor 6 for Android, same bundle as the web build
- Vitest (core), Playwright (e2e with mocked geolocation)
- No runtime CDN dependencies. Everything bundles. (v2 loaded Leaflet, Socket.io and Google
  GSI from CDNs — one outage killed the game.)

## Layout

```
apps/game/          React PWA. Also Capacitor webDir. android/ lives here.
packages/core/      geo/ rules/ sim/ types/ — pure TS, fully tested
packages/ui/        shared components + tokens.css (ONE file, under 800 lines)
supabase/           migrations/ seed/ functions/
docs/tickets/       BRDC tickets, one per feature
docs/backlog/       parked v2 content — do not build from this before Phase 5
```

## Domain model (use this vocabulary in code and UI)

| Code | UI / lore |
|---|---|
| trail | Ley-line |
| claim / loop closure | Awakening the Ground |
| steal | Corruption |
| cell (H3 res 11) | Warded Cell |
| anchor | Anchor Stone |
| duel | The Wager |
| level | Consciousness Level |
| leaderboard | Codex of Dominion |

Consciousness levels from v2: 1 Dormant · 5 Awakening · 10 Aware · 15 Enlightened ·
20 Transcendent. **Cap the level curve** — v2 let a player reach 118 and corrupted their save.

## Constants (single source: `packages/core/rules/constants.ts`)

```ts
H3_RES_OWNERSHIP = 11        // ~2150 m² per cell
H3_RES_REGION    = 6         // realtime channel shard, ~36 km²
LOOP_CLOSE_RADIUS_M   = 25
MAX_LOOP_AREA_M2      = 50_000   // × (1 + level/10)
MAX_LOOP_DURATION_MS  = 90 * 60_000
MIN_LOOP_POINTS       = 8
MAX_SPEED_MS          = 8
MAX_ACCURACY_M        = 50
MIN_POINT_INTERVAL_MS = 5_000
CONSOLIDATE_RADIUS_M  = 5        // from v2 PathMarkerService
BASE_STRENGTH         = 100
MAX_STRENGTH          = 500
DAY_VISIT_BONUS       = 25    // first pass through the cell on a new calendar day
STREAK_VISIT_BONUS    = 50    // ...and you were also there yesterday
DECAY_GRACE_HOURS     = 48
DECAY_PER_DAY         = 10
DECAY_PER_DAY_LATE    = 25    // after DECAY_LATE_AFTER_DAYS
DECAY_LATE_AFTER_DAYS = 14
NEIGHBOUR_BONUS       = 15    // per owned neighbour, cap 90
ANCHOR_BONUS          = 200
LEVEL_STRENGTH_BONUS  = 5
```

**Reinforcement is per calendar day, not per visit.** Walking the same cell five times today
does nothing after the first. Consecutive days pay double. The game rewards routine, not grinding.

**Decay accelerates.** 48h grace, then −10/day, then −25/day after two weeks. At strength ≤ 0
the cell is released, not kept at a floor — "The Void reclaims". A maxed cell survives ~33 days
untouched; a freshly claimed one ~12. This is what keeps the map alive with two players.

**Siege model, not instant flip.** Attack power =
`BASE_STRENGTH + level*LEVEL_STRENGTH_BONUS + neighbourBonus + anchorBonus`.
Enemy cells take `strength -= attackPower`; they only change owner when strength reaches 0,
and then reset to `BASE_STRENGTH`. Taking someone's established home block should require two
or three separate walks on separate days. Do not "simplify" this back to a single comparison.

Discovery constants come from v2 and live in the same file (spawn 150 m, collect 5 m,
max 10 active, 5 min respawn; common 60%/50xp, uncommon 25%/100xp, rare 12%/150xp,
epic 3%/200xp).

## Design tokens — do not invent new colours

Palette from v2, typography from v1 (v2's `Spectral` never loaded and Courier New /
Segoe UI was a default, not a choice).

```css
--void-black:#0a0612  --cosmic-purple:#4a1a5c  --eldritch-blue:#1e2a4a
--mystic-cyan:#00d4ff --sacred-gold:#ffd700    --awareness-green:#00ff88
--glass-bg: rgba(26,12,38,0.7)  --glass-border: rgba(255,255,255,0.1)
```

Fonts, self-hosted via @fontsource: **Cinzel** (headings), **Orbitron** (numbers/HUD),
**Inter** (body). No Google Fonts CDN.

Themes: **Cosmic only for now.** Void and Mystic are in `docs/backlog/themes.md`. Structure the
tokens so adding a theme is one `[data-theme]` block, but do not build the other two yet.

Required in the token set and absent from both v1 and v2: spacing scale, type scale with
`clamp()`, `--touch-min: 44px`, `prefers-reduced-motion`, `:focus-visible`.

Own territory renders `--cosmic-purple` at 0.35 fill / 0.9 stroke. Other players get
generated hues desaturated toward the palette. Contested cells pulse.

Map basemap must be dark and tinted toward `--void-black`. It should never look like plain
OpenStreetMap — v2's raster OSM tiles were the weakest part of its presentation.

## Anti-cheat (never weaken without being asked)

- Reject points with `accuracy > MAX_ACCURACY_M`
- Reject segments implying speed > `MAX_SPEED_MS`
- Reject points closer together than `MIN_POINT_INTERVAL_MS`
- `close_loop` rate-limited to 20 calls/day/player
- Every ownership change writes a `cell_history` row
- Android: flag runs where `isFromMockProvider` is true

## Data layer — mock first

Everything reads and writes through one interface, `GameRepository` (`packages/core/types`).
Two implementations:

- **`MockRepository`** — IndexedDB + seeded fake neighbours, running directly on the pure
  rule functions in `packages/core/rules`. Used in Phases 0–2, in every test, and as the
  offline fallback.
- **`SupabaseRepository`** — calls RPC. Introduced in Phase 3.

No component, hook, or store may import the Supabase client directly. If you find yourself
wanting to, the interface is missing a method — add it there.

**The divergence risk is real and must be tested.** The same rules exist twice: TypeScript in
`packages/core/rules`, SQL in the RPCs. Phase 3 adds *golden fixture* tests: the same recorded
routes run against both repositories and the resulting cell state must match exactly. When they
disagree, **SQL wins** and the TypeScript is corrected. These run in CI on every commit.

## Distribution

**Signed APK, no Play Store.** No Play Console, no review, no background-location declaration.

Consequence that is easy to forget: updates do not arrive automatically. Phase 5 must ship
`version.json` on GitHub Pages, a startup version check with a lore-flavoured prompt, and a
server-side `min_client_version` that rejects RPCs from clients too old to write correct data.
Skipping the last one reproduces v2's level-118 bug by a different route.

## Persistence

One localStorage namespace: `es3:*`. One `save()` function. One `SAVE_VERSION` integer.
Unknown or older versions are rejected and reset deliberately, with a user-facing message.

v2 had 29 ungoverned keys and no version field; a stale save produced a level-118 player
whose encounters silently stopped firing. Do not repeat this.

## Realtime

One broadcast channel per H3 res-6 region: `territory:<h3_r6>`. The client subscribes only
to visible regions (max 4) and unsubscribes on pan. Do not use Postgres change-streams for
cells — they cannot be filtered by viewport.

Presence carries position rounded to ~50 m, except inside an active Wager arena where exact
position is shared with the opponent only.

## Boot sequence

Deterministic `await` chain. Do not use event-bus timing for initialization order.
v2 spawned entities before the map was listening, so shrines silently never appeared.
Test: initialize 100 times in a row, assert no missing entities.

## Testing

- Every function in `packages/core/rules` and `packages/core/geo` needs a unit test.
- Loop-detection tests use recorded traces in `packages/core/sim/fixtures/`
  (square, figure-eight, open line, back-and-forth, GPS-noise trace).
- Use `packages/core/sim` for anything requiring movement.
- Playwright overrides geolocation via CDP.
- **Run the 360px mobile viewport first, not last.** v2's mobile layout was a P0 bug in a
  mobile-only game.
- Coverage must come from an actual test run. v2 shipped a coverage report with zero hits.

## Commands

```
pnpm dev · pnpm test · pnpm typecheck · pnpm build · pnpm e2e
supabase db push
npx cap sync android
```

## Workflow

Ticket first (`docs/tickets/BRDC-<AREA>-<NNN>.md`, RED = what must become true), then plan,
then implement, then prove GREEN with a test run. One phase per branch. `/clear` between phases.
