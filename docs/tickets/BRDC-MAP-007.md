# BRDC-MAP-007 — Paikan ja questin napautus ei koskaan laukea

| | |
|---|---|
| **Alue** | `features/map/MapCanvas`, `features/territory/useSelection` |
| **Vaihe** | Läpileikkaava |
| **Effort** | S |
| **Riippuvuudet** | BRDC-PERF-003 (`promoteId`) |
| **Status** | `done` — ajettu ja todennettu 2026-09-29 |
| **Valmius** | 100 % |
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

- [x] Solulähteillä `promoteId: 'h3'` (PERF-003), paikoilla ja questeilla `promoteId: 'key'`
      ja `properties.key` = h3 / site id. Napautus lukee `feature.id`:n, joka on nyt aito
      merkkijono
- [x] Anchorin napautus avaa sanctumin ("Your sanctuary"), ei solukorttia. Questin napautus
      saa oikean site id:n (`QuestMarkers.test.ts`)
- [x] E2e `place-tap.spec.ts` (molemmat projektit): Anchorin merkin paikka luetaan kartalta,
      napautus avaa sanctumin, eikä solukorttia ole
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines`

**Löydös matkalla:** Anchor puuttui kartalta kokonaan. PERF-002:n `keepIfSame` teki
`trail.revealed`ista vakaan, jolloin ennen Hearthin kirjoitusta tehty paikkojen luku jäi
voimaan. Korjattu p1-haarassa (paikat luetaan uudelleen, kun `castle` saapuu) ja viety
eteenpäin mergeillä.

## Ei tässä

- Muut napautuksen muutokset. Tämä korjaa vain id-polun
