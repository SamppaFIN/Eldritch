# 👁️ Eldritch Sanctuary v3

**Walk a closed loop in the real world. The ground inside it remembers you.**

A GPS territory-capture game with a Lovecraftian face. You walk; a ley-line draws itself
behind you. Close the loop and the ground inside it becomes yours — as hexagons on a dark
map. Walk it again tomorrow and it strengthens. Stop walking and the Void takes it back.

> **Status:** Phase 0 complete. The foundation is in place; the map is not yet.
> See [`docs/tickets/`](docs/tickets/) for what is done and what is next.

---

## How it plays

| | |
|---|---|
| **Claim** | A walked loop, closed within 25 m of itself, fills with H3 hexagons |
| **Reinforce** | First pass on a new day: +25. Also there yesterday: +50. Cap 500 |
| **Decay** | 48 h grace, then −10/day, then −25/day after two weeks. At 0 the cell is released |
| **Corrupt** | Walking an enemy cell damages it. It only flips at 0 strength |

Reinforcement is **per calendar day**, not per visit — the game rewards a routine, not
grinding. A commute you walk every weekday reaches full strength in about two weeks;
a forest loop you do once a month never does.

Taking someone's established home block needs two or three separate walks on separate
days. That is a better game than stealing it in one go, and it doubles as anti-cheat:
a single forged route achieves nothing.

---

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

```bash
pnpm test         # unit tests (packages/core)
pnpm typecheck    # tsc -b, strict
pnpm lint:lines   # 400-line file limit
pnpm e2e          # Playwright; the 360px mobile project runs first
```

A ticket is done when all four are green **and** its GREEN checklist has been ticked
against an actual run.

---

## Layout

```
apps/game/       React PWA. Also the Capacitor webDir (Phase 5)
packages/core/   geo · rules · sim · types · persist — pure TS, fully tested
packages/ui/     shared components + tokens.css (one file)
docs/tickets/    the implementation plan, one BRDC ticket per feature
docs/backlog/    parked content — not built before Phase 5 ships
files/           strategy documents
```

---

## Phases

| | | Gate |
|---|---|---|
| **0** | Monorepo, tokens, `GameRepository`, Pages deploy | ✅ Deployed page looks right on a phone |
| **1** | MapLibre, GPS tracking, ley-line | Walk 10 min in airplane mode; the trail persists |
| **2** | Loop detection, H3, capture, decay | A block fills · tomorrow reinforces · 20 days releases |
| **3** | Supabase, RPCs, realtime, chat | Golden-fixture tests green (mock ≡ SQL) |
| **4** | The Wager — challenge a friend | Share a link; 30 minutes later there is a winner |
| **5** | Capacitor, foreground service, signed APK | Tracking works with the screen off |
| **6** | Lore back: codex, discoveries, quest, anchors | — |

Phases 0–2 are a standalone static site: no backend, no account, no network. If a gate
does not pass, the next phase does not start. That rule is the single structural
difference between this and v2.

---

## Why a rewrite

v2 ([`SamppaFIN/EldrichHorror-v2`](https://github.com/SamppaFIN/EldrichHorror-v2)) built
43 systems in 16 days. The ideas were genuinely good — territory grown from step markers,
a codex that deepens as you meet a thing more often, a Pratchett-meets-Lovecraft quest.
The architecture did not survive the pace:

| | v2 | v3 |
|---|---|---|
| Script tags in one HTML file | 68 | 1 module |
| Largest file | 4 081 lines | 400-line limit, enforced in CI |
| CSS | 34 files, 11 204 lines, 15 variables | 1 file, 372 lines, full token set |
| Save versioning | none — a stale save produced a level-118 player | one namespace, one version |
| Verified test coverage | 0 % (a report was published with zero hits) | coverage comes from a real run |
| Runtime CDN dependencies | Leaflet, Socket.io, Google GSI | none |

[`ANALYSIS.md`](ANALYSIS.md) has the full measurement. Its value carries over as **data** —
constants, lore, mechanics — not as code.

---

## Design

Palette measured from v2 and expressed in OKLCH; typography from v1, self-hosted.
Contrast is measured, not assumed — the game is played outdoors in daylight, one-handed,
while walking.

Sacred geometry is **generated from its construction rules**, not drawn: Metatron's Cube
is the thirteen circles of the Fruit of Life with every centre joined to every other,
seventy-eight lines, all of them earned. All stroke, no fill, animated by
`stroke-dasharray`.

UI/UX follows [AI-Koulu](https://samppafin.github.io/AI-Koulu/ui-ux/): WCAG 2.2 AA as the
floor, 44 px targets, visible focus, `prefers-reduced-motion`, 200 % zoom without
horizontal scrolling.

---

MIT · built by Infinite
