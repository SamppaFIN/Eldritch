# BRDC-ART-007 — Ikonien ja korttien visuaalinen nosto

| | |
|---|---|
| **Alue** | `packages/ui`, `designSprites.ts`, `tokens.css` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Lähde** | Infiniten handoff 2026-10-05, F-50 |
| **Status** | `done` — 2026-10-06 |

## 🔴 RED

Ikonit ja kortit ovat eri aikoina piirrettyjä; viivat, hehku ja kehykset vaihtelevat.

## 🟢 GREEN

- [x] Yksi ikonityyli (viiva, hehku, tokenipaletti) — `--icon-glow` / `--icon-glow-text` (tokens.css), `.es-icon` jokaisella SacredGeometry-SVG:llä, muotokuvilla ja navin valitulla glyfillä. Kartan GL-spritet eivät ota CSS:ää; ne pysyvät `designSprites.ts`:n tyylissä
- [x] Korttikehykset (vesica-kulmat), hillitty kohina taustoissa — `.es-glass::after` neljä peilattua kaarta, `--glass-grain` staattinen SVG-tiili `::before`:ssa (maalataan kerran, ei suodinkierrosta per paneeli); 360 px kuvakaappaus tarkistettu. Vierittyvässä paneelissa alakulmat istuvat ensimmäisen näkymän alalaidassa, eivät sisällön lopussa
- [x] Cinzel/Inter kuten nyt — ei kosketeltu
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 1999 testiä, tsc, rivit OK, build OK

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
