# BRDC-WAGER-JSON-002 — Jaettu tuotto päällekkäisellä solulla

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-WAGER-JSON-001, BRDC-TERRAIN-001 |
| **Status** | `done` — 2026-09-01 |
| **Valmius** | 90 % |

## 🔴 RED

Kun tuotu haaste väittää solua jonka paikallinen pelaaja jo omistaa, `openChallenge`
**pudottaa** kilpailijan väitteen kokonaan (`wager.ts:86`). Molemmat kävelivät samaa
katua, mutta toinen ei näy missään eikä vaikuta mihinkään.

## 🟢 GREEN

- [x] Päällekkäinen solu ei putoa: se pysyy paikallisen pelaajan omana mutta merkitään
      `shared`iksi
- [x] `Cell.shared?: { with, mineAtImport, theirsAtImport }` — additiivinen valinnainen
      (kuten `imported`/`shelteredMs`), ei skeemanostoa
- [x] `trickle()` jakaa `shared`-solun tuntituoton: paikallisen osuus =
      `mineAtImport / (mineAtImport + theirsAtImport)`, kokonaisyksiköt (SQL-pariteetti)
- [x] Molemmilla nolla → jaetaan tasan (ei nollalla)
- [x] `shared` katoaa kun solua vahvistaa uutena päivänä (`resolveCapture` "already
      ours" -haara) — jalka ottaa koko tuoton takaisin
- [x] `applySpoils` ei kosketa päällekkäisiä soluja (suodatettu pois ennen)

## Toteutus

Voima toimii "kumpi on ollut useammin alueella" -mittarina, koska kertakäyttöinen
tekstihaaste ei kanna elävää käyntimäärää (`claude.md` §16 — ei serveriä ennen Vaihe
5). `cell.strength` **on** kertynyt käyntitiheys (`DAY_VISIT_BONUS`/`STREAK_VISIT_BONUS`
kasvattavat sitä kävely kerrallaan), joten jako tuontihetken voimasuhteella on rehellisin
tämän arkkitehtuurin tukema versio. Dokumentoitu yksinkertaistuksena, ei väitetä
oikeaksi käyntilaskuriksi.

`localShare(cell)` `terrain.ts`:ssä: `1` omalle maalle, murto `shared`ille. Loput
`trickle`istä ennallaan; loppupyöristys `Math.floor` hoitaa murto-osan.

## Testit

- [x] `trickle`: `shared` 100/100 → puolet perustuotosta; 150/50 → 3/4; 0/0 → puolet
- [x] `resolveCapture`: uuden päivän `reinforced` → `after.shared` `undefined`;
      saman päivän `unchanged` → `shared` säilyy
- [x] `openChallenge`: molemmat samasta pisteestä → tuodut päällekkäiset solut saavat
      `shared`in, omistaja ei vaihdu, `shared.with` = haastajan id
- [x] 688 testiä, `tsc -b`, `lint:lines` — puhtaat

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `wager.ts` §openChallenge
