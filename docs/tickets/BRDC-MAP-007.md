# BRDC-MAP-007 — Paikan ja questin napautus ei koskaan laukea

| | |
|---|---|
| **Alue** | `features/map/MapCanvas`, `features/territory/useSelection` |
| **Vaihe** | Läpileikkaava |
| **Effort** | S |
| **Riippuvuudet** | BRDC-PERF-003 (`promoteId`) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Koodikatselmointi 2026-09-28 (`BRDC-PERF`-työn sivulöydös) |

## 🔴 RED

MapLibre muuttaa merkkijonomuotoisen `feature.id`:n luvuksi tiilen koodauksessa
(`parseInt(feature.id, 10)`, maplibre-gl 6.6.0). H3-id `'8b…'` palaa napautuksessa
lukuna `8`. `packages/core/src/geo/cells.ts:82-87` tietää tämän, mutta kolme napautuspolkua
luottaa silti merkkijono-id:hen:

- solun napautus (`MapCanvas.tsx:229`, `typeof id === 'string'`) ei koskaan osu, vaan kaikki
  menee `cellAt`in kautta (`:235`). Toimii, mutta sattumalta
- questin napautus (`:223`) ei koskaan laukea
- `onPlaceTap` (`:261-262`) ei koskaan laukea: **Anchorin napautus avaa solupaneelin
  sanctumin sijaan** (`useSelection.ts:212-217`)

## 🟢 GREEN

- [ ] Paikka-, quest- ja solulähteillä `promoteId`, ja napautus lukee id:n sen kautta
- [ ] Anchorin ja Templen napautus avaa oikean paneelin; questin napautus avaa questin
- [ ] E2e: napautus Anchoriin avaa sanctumin
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä

## Ei tässä

- Muut napautuksen muutokset. Tämä korjaa vain id-polun
