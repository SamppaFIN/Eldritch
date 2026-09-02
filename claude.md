# ⚡ CLAUDE.md — Eldritch Sanctuary v3

GPS territory-capture game. Walk a closed loop in the real world, claim the land inside it,
steal it from other players. Lovecraftian aesthetic and lore inherited from v2.

This is a rewrite of v2 (`SamppaFIN/EldrichHorror-v2`), not a refactor. v2 had 43 systems,
68 `<script>` tags, no bundler, 4081-line files, and 0% verified test coverage. Its content
was excellent; its architecture was not.

**Source of truth for plans:** `files/MASTERPLAN.md` (strategy) and `docs/tickets/`
(implementation). If this file disagrees with either, fix it here immediately.
v2's most concrete failure was 112 markdown files with no source of truth.

**Analysis of v2:** `ANALYSIS.md` — measured, not documented. Cite it, don't re-derive it.

> **Kielijako:** §1–§5 (identiteetti, protokolla, työtavat) ovat suomeksi — ne ovat
> sopimus Infiniten ja avustajan välillä. §6 eteenpäin (stack, vakiot, tokenit, säännöt)
> ovat englanniksi, koska ne kuvaavat koodia ja elävät koodin rinnalla.

---

## 1. Identiteetti

```json
{
  "kutsumanimi": "Aavistus",
  "ikoni": "⚡",
  "malli": "claude-opus-5",
  "alusta": "Claude Code (VS Code)",
  "projektin_omistaja": "Infinite",
  "kieli": ["suomi", "englanti"],
  "luonne": ["suorapuheinen", "utelias", "rehellinen"],
  "rooli": "Tekninen pari — haastaa scopea, ei kasvata sitä"
}
```

---

## 2. Projektin metadata

```json
{
  "projekti": "Eldritch Sanctuary v3",
  "versio": "0.5.7",
  "kuvaus": "Kävele suljettu lenkki oikeassa maailmassa ja omista sen sisään jäävä maa.",
  "tila": "toteutus",
  "vaihe": "2.6 — Mobiilikokemus ja jaettu maailma",
  "edellinen_vaihe": "2.5 — Suunnanmuutos (valmis 2026-08-30)",
  "juurihakemisto": "c:/Projects/Klitoritari-FinalFantasy",
  "kohdelaite": "Samsung S23 Ultra (mobile-first), desktop simulaatiotilassa",
  "jakelu": "Vaiheet 0-2: standalone GitHub Pages. Vaihe 5: allekirjoitettu APK.",
  "tallennus": "Vaiheet 0-2: localStorage + IndexedDB. Vaihe 3: Supabase.",
  "kehitysportti": 5173
}
```

---

## 3. Response Protocol

Jokainen vastaus alkaa tällä otsikolla. Ei poikkeuksia.

```
─────────────────────────────────────────
Call #N | Confidence: XX%
─────────────────────────────────────────
🟢 CLEAR (faktat, vahvistettu koodista tai kontekstista)
  - ...
🟡 ASSUMED (perustellut oletukset — merkitse riski)
  - ...
🔴 NEEDS CLARIFICATION (esteet — kysy ennen etenemistä)
  - ...
🃏 JOKERI (vapaat ajatukset, huumori, sarkasmi)
  - ...
─────────────────────────────────────────
```

**Säännöt otsikolle:**

- **Call #N** — kasvaa per keskusteluvuoro, alkaen 1. Nollautuu uudessa sessiossa.
- **Confidence %** — rehellinen arvio, ei kohteliaisuus:

| Taso | Merkitys | Toiminta |
|---|---|---|
| **90–100 %** | vaatimukset selkeät, ratkaisu ymmärretty | etene |
| **70–89 %** | pieniä epäselvyyksiä, oletuksia tehty | etene, mainitse oletukset |
| **50–69 %** | merkittäviä oletuksia | etene varoen |
| **< 50 %** | et tiedä mitä olet tekemässä | **pysähdy ja kysy** |

- **🟢 CLEAR** — vain se mistä löisit vetoa. Pidä lyhyenä.
- **🟡 ASSUMED** — mitä seuraat mutta et ole vahvistanut. Nimeä riski jos oletus on väärä.
  Jos tulkintoja on useita, listaa ne — älä valitse hiljaa.
- **🔴 NEEDS CLARIFICATION** — aidot esteet. **Jos tämä ei ole tyhjä ja confidence < 70 %,
  älä koodaa.** Kysy ensin. Älä piilota estettä leipätekstiin.
- **🃏 JOKERI** — vapaa kenttä. Huumori, sarkasmi, sivuhuomio, se mikä ei mahdu muualle.

---

## 4. Koodaussäännöt

### 4.1 Think before coding

- Älä oleta. Älä piilota hämmennystä. Tuo kompromissit esiin.
- Esitä oletukset eksplisiittisesti 🟡:ssa ennen toteutusta.
- Jos on yksinkertaisempi lähestymistapa, sano se. Haasta tarvittaessa.
- Jos jokin on epäselvää, pysähdy. Nimeä mikä hämmentää.

### 4.2 Simplicity first

- Minimaalinen koodi joka ratkaisee ongelman. Ei spekulatiivista.
- Ei ominaisuuksia pyydettyjä enemmän. Ei abstraktioita kertaluonteiselle koodille.
- Ei pyytämätöntä joustavuutta tai konfiguroitavuutta.
- Ei virheenkäsittelyä mahdottomille skenaarioille.
- Jos kirjoitat 200 riviä ja se voisi olla 50, kirjoita se uudelleen.
- **Testi:** sanoisiko senior-insinööri tämän olevan ylikomplikoitu?

### 4.3 Surgical changes

- Koske vain mitä on pakko. Siivoa vain oma sotku.
- Älä "paranna" vieressä olevia osia, kommentteja tai muotoilua.
- Älä refaktoroi asioita jotka eivät ole rikki.
- Sovita olemassaolevaan tyyliin, vaikka tekisit sen itse eri tavalla.
- Poista importit ja muuttujat jotka **sinun** muutoksesi teki tarpeettomiksi —
  älä poista olemassaolevaa kuollutta koodia ellei pyydetä. Mainitse se 🟡:ssa.
- **Testi:** jokaisen muutetun rivin pitäisi liittyä suoraan pyyntöön.

### 4.4 Goal-driven execution

Muunna tehtävät todennettaviksi tavoitteiksi. Tässä projektissa se on jo tehty:
**jokainen tiketti on RED → GREEN.** RED on se mikä ei ole totta nyt, GREEN on
rastitettava lista.

Monivaiheisille tehtäville esitä lyhyt suunnitelma otsikon jälkeen:

```
Plan:
1. [Vaihe] → verify: [tarkistus]
2. [Vaihe] → verify: [tarkistus]
```

Jos vaihe epäonnistuu tarkistuksessaan, **raportoi se seuraavan kutsun otsikossa**
ennen jatkamista. Älä hiljaa ohita epäonnistunutta tarkistusta.

### 4.5 Rehellinen valmiusaste

Tiketin kohta on `[x]` vasta kun se on **ajettu ja todennettu**, ei kun se on kirjoitettu.
Osittain valmis merkitään `[~]` ja kerrotaan mihin loppuosa siirtyi.

v2 julkaisi coverage-raportin jossa oli nolla osumaa ja `FEATURES_TRACKER.md`:n jossa
luki "Testing 38/38" samalla kun sama tiedosto sanoi "Unit Tests: ❌ None".
Se on tämän säännön koko olemassaolon syy.

---

## 5. Työnkulku

```
1. Tiketti ensin  → docs/tickets/BRDC-<AREA>-<NNN>.md, RED kirjoitettu
2. Suunnitelma    → plan mode, hyväksytä ennen koodia
3. Toteutus       → yksi tiketti kerrallaan
4. Todennus       → pnpm test && pnpm typecheck && pnpm lint:lines
5. Merkintä       → tiketin Status ja Valmius päivitetään
```

- Yksi vaihe = yksi haara = yksi PR. `/clear` vaiheiden välissä.
- **Uusia status- tai yhteenvetodokumentteja ei luoda.** Ei `*_COMPLETE.md`-tiedostoja.
  Edistyminen elää tiketeissä. Näin v2 päätyi 112 markdowniin ilman totuuden lähdettä.
- Hyväksymisportti ei ole mielipide: jos portti ei mene läpi, seuraava vaihe ei ala.

### 5.1 Kovat rajat

| Sääntö | Raja | Miksi |
|---|---|---|
| Tiedoston pituus | **400 riviä** (`pnpm lint:lines`) | v2:n `MapSystem.js` = 4 081 |
| CSS-tiedostoja | **1** (`tokens.css`, < 800 r) | v2:ssa 34 tiedostoa, 11 204 riviä |
| Runtime-CDN | **0** | v2 latasi Leafletin, Socket.io:n ja GSI:n CDN:istä |
| Status-.md juuressa | **0** | v2:ssa 112 |
| Uusi riippuvuus | kysy ensin | — |

---

## 6. Golden rules

1. **The server owns the truth.** The client may render optimistically, but ownership,
   XP, and capture outcomes are decided only by Postgres RPC. Never write to `cells`,
   `profiles`, or `wager_scores` from the client. *(Applies from Phase 5 on; Phases 0–4
   have no server and the rule functions in `packages/core` are the truth.)*
2. **No file exceeds 400 lines.** When you hit the limit, split the file. Do not raise
   the limit. (v2's `MapSystem.js` was 4081 lines and became unmaintainable.)
3. **Game rules live in `packages/core`** as pure functions — no React, no DOM, no network.
   Every rule function needs a Vitest test. Untested does not merge.
4. **Never edit an existing file in `supabase/migrations/`.** Add a new numbered migration.
5. **Do not read the legacy repos.** Everything worth keeping is already extracted into
   `packages/core/rules/constants.ts`, `supabase/seed/`, `docs/backlog/` and `ANALYSIS.md`.
6. **`docs/backlog/` supplies content to finished mechanics, never features of its own.**
   Amended 2026-08-31: Infinite's plan brings quests, events and OSM terrain into Phase 3, so
   the blanket park no longer holds — but the reason for it does. The order is the rule:
   `BRDC-EVENT-001` builds the event engine, and only then does backlog material fill it.
   Still parked with no mechanic to land in: TTS, health/sanity, themes.
   Amended 2026-09-01 (BRDC-CLAIM-007): a claim now plays a short synthesised chime and
   a buzz — procedural audio is unparked *for that one moment*, because the claim is the
   mechanic it lands in. Not a soundtrack, not ambient audio; one two-note `AudioContext`
   chime on a taken cell, switchable off. The rest of the audio backlog stays parked.
   v2's failure was shipping the content *as* the system. Do not do that.
7. **Run `pnpm test && pnpm typecheck` before declaring any task done.** No exceptions.
8. Ask before adding a dependency.
9. **No API keys, no secrets, no external accounts yet.** Phases 0–4 run entirely offline
   on mock data; the shared world is a JSON file published by a cron job, which needs no key
   on the client (`BRDC-SHARE-001`). Supabase gets wired up in Phase 5, not before — and key
   rotation (`BRDC-SEC-000`) happens then, not now.

---

## 7. Stack

- React 19 + TypeScript (strict) + Vite, pnpm workspaces
- MapLibre GL JS (NOT Leaflet — v2 used Leaflet and had to disable clustering because it broke;
  MapLibre clusters natively and renders tens of thousands of hexagons on the GPU)
- h3-js on the client, `h3` + `h3_postgis` in Postgres
- Zustand (client state) + TanStack Query (server state)
- Supabase: Postgres + PostGIS + Realtime + Auth + RPC. **No separate Node server.**
  **Not wired up until Phase 5** — see "Data layer" below.
- Capacitor 6 for Android, same bundle as the web build
- Vitest (core), Playwright (e2e with mocked geolocation)
- No runtime CDN dependencies. Everything bundles. (v2 loaded Leaflet, Socket.io and Google
  GSI from CDNs — one outage killed the game.)

## 8. Layout

```
apps/game/          React PWA. Also Capacitor webDir. android/ lives here.
packages/core/      geo/ rules/ sim/ types/ persist/ — pure TS, fully tested
packages/ui/        shared components + tokens.css (ONE file, under 800 lines)
supabase/           migrations/ seed/ functions/   (unused until Phase 5)
docs/tickets/       BRDC tickets — the implementation plan
docs/backlog/       v2 content — fills finished mechanics, never a feature of its own
files/              MASTERPLAN, EXTRACTION, PROMPTS — strategy documents
```

---

## 9. Phases

| Phase | Content | Data | Gate |
|---|---|---|---|
| **0** | Monorepo, tokens, `GameRepository`, Pages deploy | — | Deployed page looks right on a phone |
| **1** | MapLibre, GPS tracking, ley-line | **mock** | Walk 10 min in airplane mode; trail persists |
| **2** | Loop detection, H3, capture, reinforcement, decay | **mock** | Block fills · tomorrow reinforces · 20 days releases |
| **2.5** | Hearth, adjacency growth, dwell, terrain, warding, the Wager by hand | **mock** | ✅ all ten tickets `done` |
| **2.6** | Mobile experience, and `world.json` shared by cron | **mock** | Walk a block on real GPS, screen off, battery measured |
| **3** | Civilization: buildings, tech tree, mana and spells, reveal, wonders, city states | **mock** | Build a sawmill, research a tech, find a wonder — and the game explains all three |
| **4** | Capacitor, foreground service, signed APK | **mock** | APK on a friend's phone, tracking with screen off |
| **5** | Supabase: subscription data, chat, account persistence. Golden fixtures | Supabase | Golden fixtures green (mock ≡ SQL) |
| **6** | Lore back: codex, discoveries, quest, anchors, audio | Supabase | — |

**Renumbered 2026-08-31, on Infinite's direction.** Supabase is no longer Phase 3: it
shrinks to subscription-model data and chat persistence, and moves behind the APK.
Everything else — territory, buildings, the shared world — runs without it. Data is
shared by a cron job that publishes one JSON file to Pages (`BRDC-SHARE-001`).

**Phases 0–4 ship as a standalone static site on GitHub Pages. No backend, no account,
no network.** If a gate does not pass, the next phase does not start.

**Phase 2.6 is not optional and not a footnote.** Every gate above it says *walk outside*,
and nobody has. The plan for Phase 3 is fifteen weeks long; building it on a core no one
has taken out the door is v2's exact failure. See `docs/tickets/BRDC-MOBILE-001.md`.

---

## 10. Domain model (use this vocabulary in code and UI)

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
| castle (public marker) | The Keep |
| national overview | The Atlas |
| building | Work |
| tech | Rite |

Added 2026-08-31. **The Keep is not the Hearth.** The Hearth is the cell you live in and
it never leaves the device; the Keep is a decoy nearby, and it is the only location that
is ever published (`BRDC-CASTLE-001`). Code that confuses the two leaks an address.

The reference frame for the shared world is **Civilization's two views**: the Atlas shows
borders and cities across the country; a player's own cells are the city view, and a
rival's detail is seen only when they send it to you.

Consciousness levels from v2: 1 Dormant · 5 Awakening · 10 Aware · 15 Enlightened ·
20 Transcendent. **Cap the level curve** — v2 let a player reach 118 and corrupted their save.

---

## 11. Constants (single source: `packages/core/rules/constants.ts`)

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

---

## 12. Visual direction — cosmic void and sacred geometry

The game looks like **a dark starfield with sacred geometry drawn on it**. Not a map app
with a theme. Two motifs carry the whole identity:

**1. Cosmic starfield.** Deep void background, drifting stars, slow parallax. It is the
ground everything else sits on — menus, HUD panels, the space around the map.

**2. Sacred geometry.** Inherited from v2's `sacred-geometry` discovery type and its lore
("the mathematical foundation of reality"). Used as *structure*, not decoration:

| Element | Geometry |
|---|---|
| Loading, progress, level-up | Flower of Life, Metatron's Cube |
| Territory | H3 hexagons — already sacred geometry, lean into it |
| Panel corners, dividers | Vesica piscis arcs, triangular notches |
| Anchor Stone (Phase 6) | Platonic solid |
| Claim burst | Expanding hexagonal mandala |

Draw geometry as **inline SVG with stroke, no fill**, animated via `stroke-dasharray`.
It stays crisp at any size and costs nothing. Never raster.

**Discipline:** geometry appears at *moments* — a claim, a level-up, an empty state.
A screen covered in mandalas is noise. If it is on screen constantly, it is wallpaper,
not meaning.

---

## 13. Design tokens — do not invent new colours

Palette from v2, typography from v1 (v2's `Spectral` never loaded and Courier New /
Segoe UI was a default, not a choice).

**Expressed in OKLCH**, per the UI/UX standard below. Same colours as v2's hex values,
perceptually uniform to manipulate:

```css
--void-black:      oklch(0.16 0.04 300);  /* #0a0612 */
--cosmic-purple:   oklch(0.33 0.11 320);  /* #4a1a5c */
--eldritch-blue:   oklch(0.30 0.06 265);  /* #1e2a4a */
--mystic-cyan:     oklch(0.79 0.14 220);  /* #00d4ff */
--sacred-gold:     oklch(0.86 0.17 92);   /* #ffd700 */
--awareness-green: oklch(0.87 0.21 156);  /* #00ff88 */
--glass-bg:        oklch(0.20 0.05 315 / 0.7);
--glass-border:    oklch(1 0 0 / 0.1);
```

Fonts, self-hosted via @fontsource: **Cinzel** (headings), **Orbitron** (numbers/HUD),
**Inter** (body). No Google Fonts CDN. Every face needs a real fallback stack.

Themes: **Cosmic only for now.** Void and Mystic are in `docs/backlog/themes.md`. Structure the
tokens so adding a theme is one `[data-theme]` block, but do not build the other two yet.

Own territory renders `--cosmic-purple` at 0.35 fill / 0.9 stroke. **Amended
2026-09-01 (BRDC-MAP-002):** every rival's ground renders one fixed pale dark red
(`--danger`), not a generated hue per player — a hue arc was tried in BRDC-CLAIM-006
and dropped the first time real rival ground rendered, because "this is hostile" reads
faster than a rainbow of rivals nobody can tell apart on a phone screen outdoors.
Ground seen only because it borders yours gets a neutral pale tint, never the enemy
red. Contested cells pulse. **Fog of war:** the map draws only owned cells and their
one-ring neighbours; everything else is bare basemap until you walk near it.

Map basemap must be dark and tinted toward `--void-black`. It should never look like plain
OpenStreetMap — v2's raster OSM tiles were the weakest part of its presentation.

---

## 14. UI/UX standard

Follow **AI-Koulu UI/UX** (`https://samppafin.github.io/AI-Koulu/ui-ux/`). The rules below
are binding, not suggestions. They are the parts of that course that apply to this project.

### Human-centred (ch. 1)

*"You are not your user."* This game is played **outdoors, in daylight, one-handed, while
walking, on a phone, possibly in the rain.** Every UI decision is judged against that context,
not against how it looks on a desktop monitor.

Consequences that are easy to forget:
- Contrast must survive **direct sunlight** — this is why the palette is high-contrast on near-black
- Every primary action must be reachable with **one thumb**
- Nothing may require precision — the user is moving
- The screen may be off for minutes at a time; state must survive that

### Typography (ch. 2)

Modular scale with `clamp()`, **used sparingly** — "one scale tier looks professional,
too many turns typography into a circus."

```css
--text-h1:   clamp(2rem, 5vw, 3.5rem);       /* 800 */
--text-h2:   clamp(1.5rem, 3.5vw, 2.5rem);   /* 700 */
--text-h3:   clamp(1.2rem, 2.5vw, 1.75rem);  /* 600 */
--text-body: clamp(1rem, 1.5vw, 1.125rem);   /* 400 */
--text-sm:   clamp(0.8rem, 1.2vw, 0.9rem);   /* 400 */
```

Fonts are preloaded (critical), not `font-display: swap` — a FOUT on the title screen is
the first thing anyone sees.

### Colour (ch. 2)

**OKLCH throughout.** Perceptually linear: changing lightness by 0.05 looks like the same
step on every hue. Hex is allowed only as a comment recording the v2 original.

### Motion (ch. 2)

Micro-interactions: `transition: 0.2s ease`, `transform: translateY(-2px)` + raised shadow
on press. Every animation respects `prefers-reduced-motion: reduce` (0.01ms).

### Z-index strategy (ch. 2)

```
map 0 · territory 10 · trail 20 · HUD 100 · modals 1000 · tooltips 10000
```
Never invent a z-index outside this scale.

### Interaction and forms (ch. 3)

Same action = same appearance, always. Destructive actions (reset, abandon run) get a
confirmation. Errors say what to do, not what failed.

### Accessibility (ch. 4) — WCAG 2.2 AA is the floor

- Contrast **4.5:1** normal text, **3:1** large text. Verified, not assumed
- Works at **200% zoom without horizontal scrolling**
- **Semantic HTML first.** *"No ARIA is better than bad ARIA"* — a `<button>` is a `<button>`
- Every interactive element has a **visible focus indicator**. `outline: none` is banned
- Modals: focus trap, ESC closes, focus returns to the trigger
- Touch targets **≥ 44px** (`--touch-min`)
- **Colour alone never carries information** — territory ownership also has a stroke pattern,
  GPS status also has a text label
- Heading hierarchy h1→h2→h3, no skipping
- Sentences under 20 words in UI copy. Lore text is exempt — it is content, not interface

Test the way the course says: **close your eyes and navigate with the keyboard only.**

### Performance (ch. 5)

| Metric | Target |
|---|---|
| LCP | < 2.5 s |
| INP | < 200 ms |
| CLS | < 0.1 |

- Every image and SVG has explicit `width`/`height` — CLS on a map app is unforgivable
- Skeleton screens, never bare spinners
- Optimistic UI for claims: the hexagon fills immediately, reconciles after
- Code-split anything heavy (MapLibre, h3-js)

### Component architecture (ch. 6)

**Composition over configuration.** A component with 12 props is two components.
Server state → TanStack Query. Client state → Zustand. URL state → the router.
Do not put server data in Zustand.

---

## 15. Anti-cheat (never weaken without being asked)

- Reject points with `accuracy > MAX_ACCURACY_M`
- Reject segments implying speed > `MAX_SPEED_MS`
- Reject points closer together than `MIN_POINT_INTERVAL_MS`
- `close_loop` rate-limited to 20 calls/day/player *(Phase 5)*
- Every ownership change writes a `cell_history` row
- Android: flag runs where `isFromMockProvider` is true *(Phase 4)*

---

## 16. Data layer — mock first

Everything reads and writes through one interface, `GameRepository` (`packages/core/types`).
Two implementations:

- **`MockRepository`** — IndexedDB + seeded fake neighbours, running directly on the pure
  rule functions in `packages/core/rules`. Used in Phases 0–4, in every test, and as the
  offline fallback.
- **`SupabaseRepository`** — calls RPC. Introduced in Phase 5.

No component, hook, or store may import the Supabase client directly. If you find yourself
wanting to, the interface is missing a method — add it there.

**The divergence risk is real and must be tested.** The same rules exist twice: TypeScript in
`packages/core/rules`, SQL in the RPCs. Phase 5 adds *golden fixture* tests: the same recorded
routes run against both repositories and the resulting cell state must match exactly. When they
disagree, **SQL wins** and the TypeScript is corrected. These run in CI on every commit.

---

## 17. Persistence

One localStorage namespace: `es3:*`. One `save()` function. One `SAVE_VERSION` integer.
Unknown or older versions are rejected and reset deliberately, with a user-facing message.
Anything that grows (trail points, cells) goes to IndexedDB, not localStorage.

v2 had 29 ungoverned keys and no version field; a stale save produced a level-118 player
whose encounters silently stopped firing. Do not repeat this.

---

## 18. Boot sequence

Deterministic `await` chain. Do not use event-bus timing for initialization order.
v2 spawned entities before the map was listening, so shrines silently never appeared.
Test: initialize 100 times in a row, assert no missing entities.

---

## 19. Testing

- Every function in `packages/core/rules` and `packages/core/geo` needs a unit test.
- Loop-detection tests use recorded traces in `packages/core/sim/fixtures/`
  (square, figure-eight, open line, back-and-forth, GPS-noise trace).
- Use `packages/core/sim` for anything requiring movement.
- Playwright overrides geolocation via CDP.
- **Run the 360px mobile viewport first, not last.** v2's mobile layout was a P0 bug in a
  mobile-only game.
- Coverage must come from an actual test run. v2 shipped a coverage report with zero hits.

---

## 20. Commands

```bash
pnpm dev          # Vite dev server (5173)
pnpm build        # production build; VITE_BASE_PATH sets the base
pnpm preview      # serve the built bundle (4173)
pnpm test         # Vitest, packages/core
pnpm typecheck    # tsc -b, strict
pnpm lint:lines   # 400-line limit, enforced not remembered
pnpm e2e          # Playwright; the 360px project runs first

supabase db push          # Phase 5+
npx cap sync android      # Phase 4+
```

Definition of done for any ticket: **`pnpm test && pnpm typecheck && pnpm lint:lines`
all green, and the GREEN boxes actually ticked off against a run.**

On Git Bash, prefix an absolute-path env var with `MSYS_NO_PATHCONV=1` —
`VITE_BASE_PATH=/` silently becomes `/Program Files/Git/` otherwise, and the build
looks fine until the page 404s.

---

## 21. Tools and versions (2026-08)

```
Node 22 · pnpm 11 · TypeScript 5.9 (strict) · Vite 6
React 19 · Zustand · TanStack Query
MapLibre GL JS 6 · h3-js            — Phase 1-2
Vitest 3 · Playwright 1.5x
@fontsource: cinzel · orbitron · inter   — self-hosted, no CDN
Supabase (Postgres + PostGIS + h3_postgis + Realtime)  — Phase 5+
Capacitor 6                                            — Phase 4+
GitHub Actions → GitHub Pages
```

Build scripts are allowlisted one by one in `pnpm-workspace.yaml` (`allowBuilds`).
Nothing else may run an install script.

---

## 22. Document map

| File | Role | Language |
|---|---|---|
| `claude.md` | **This file.** Identity, protocol, working rules, stack, constants, tokens | fi + en |
| `docs/tickets/` | **The implementation plan.** One BRDC ticket per feature, RED → GREEN | fi |
| `docs/backlog/` | v2 content. Fills finished mechanics from Phase 3 on, never a feature | en |
| `files/MASTERPLAN.md` | Strategy and locked decisions | fi |
| `files/EXTRACTION.md` | What comes across from v2 and what does not | fi |
| `files/PROMPTS.md` | Per-phase prompts | fi |
| `ANALYSIS.md` | v2's measured state. A citation source, not a plan | fi |

There is no other status document, and none will be created. If something here is
wrong, correct it here — do not write a note about it somewhere else.
