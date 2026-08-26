# BRDC-GEO-001 — Geometriaydin: haversine, nopeus, pisteiden suodatus

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SETUP-001 |
| **Status** | `done` — 2026-08-26 |
| **Valmius** | 100 % |

## 🔴 RED

GPS-dataa ei voi luottaa sellaisenaan. Kaupungissa tarkkuus heittää kymmeniä metrejä,
puhelin raportoi hyppyjä, ja huijaaminen on triviaalia ilman validointia. v2 otti
sijainnit vastaan sellaisenaan ja kirjoitti ne suoraan tilaan.

## 🟢 GREEN

- [x] `packages/core/geo/haversine.ts` — etäisyys kahden pisteen välillä metreinä
- [x] `packages/core/geo/speed.ts` — nopeus segmentistä (m/s)
- [x] `packages/core/geo/filter.ts` — pisteiden suodatus vakioita vasten
- [x] Kaikki funktiot ovat **puhtaita** — ei DOM:ia, ei verkkoa, ei `Date.now()`ta
- [x] Jokaisella funktiolla on Vitest-testi. **Testaamaton ei mene läpi**
      (`files/CLAUDE.md` sääntö 3)

## Toteutus

Vakiot `packages/core/rules/constants.ts`:

```ts
MAX_ACCURACY_M        = 50      // huonompi tarkkuus -> piste hylätään
MAX_SPEED_MS          = 8       // ~29 km/h; nopeampi -> segmentti hylätään
MIN_POINT_INTERVAL_MS = 5_000   // tiheämpi -> piste hylätään
CONSOLIDATE_RADIUS_M  = 5       // v2 PathMarkerService: alle 5 m -> ei uutta pistettä
```

```ts
// packages/core/geo/filter.ts
export function acceptPoint(
  prev: TrailPoint | null,
  next: TrailPoint,
): { ok: true } | { ok: false; reason: RejectReason } {
  if (next.accuracy > MAX_ACCURACY_M)  return { ok: false, reason: 'accuracy' };
  if (!prev)                           return { ok: true };
  if (next.t - prev.t < MIN_POINT_INTERVAL_MS) return { ok: false, reason: 'interval' };
  const d = haversine(prev, next);
  if (d < CONSOLIDATE_RADIUS_M)        return { ok: false, reason: 'consolidated' };
  const v = d / ((next.t - prev.t) / 1000);
  if (v > MAX_SPEED_MS)                return { ok: false, reason: 'speed' };
  return { ok: true };
}
```

**`CONSOLIDATE_RADIUS_M` tulee v2:sta** (`server/services/PathMarkerService.js`) — siellä
alle 5 m päässä oleva piste kasvatti olemassa olevan markkerin laskuria uuden rivin
sijaan. Idea on hyvä ja se siirtyy; validointi on uutta.

**Hylkäyssyy palautetaan**, ei vain `false`. HUD näyttää sen (BRDC-HUD-001), ja Vaiheessa 3
sama syy kirjataan palvelimella.

## Testit

- [x] `haversine` tunnettuja etäisyyksiä vasten (Tampere → Helsinki ≈ 161 km)
- [x] `haversine` samalle pisteelle = 0
- [x] Piste jonka `accuracy` 51 → hylätään, 49 → hyväksytään
- [x] Kaksi pistettä 3 m päässä → `consolidated`
- [x] Kaksi pistettä 100 m päässä 5 s välein (20 m/s) → `speed`
- [x] Kaksi pistettä 2 s välein → `interval`
- [x] Ensimmäinen piste ilman edeltäjää → hyväksytään aina

> **Lisäksi toteutettu:** `filterTrail(previous, points)` ajaa erän läpi ja tuottaa
> `TrailResult`in. `prev` etenee vain hyväksytyistä pisteistä — yksi villi fix keskellä
> hyvää kävelyä pudotetaan, ja seuraava oikea piste mitataan viimeisestä *luotetusta*
> sijainnista, ei poikkeamasta. Tätä TRAIL-001 tarvitsee sellaisenaan.

## Ei kuulu tähän tikettiin

Lenkin tunnistus (BRDC-CLAIM-001). H3-muunnos (BRDC-CLAIM-002). Mock-provider-tarkistus
(Vaihe 5, natiivi).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 3 · `files/CLAUDE.md` §Constants, §Anti-cheat ·
`EXTRACTION.md` §D
