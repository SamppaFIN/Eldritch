# BRDC-CLAIM-007 — Valtauksen palaute: lokirivi, ääni, värinä

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-TERRAIN-001 (`CLAIM_YIELD`), BRDC-CLAIM-006 |
| **Status** | `done` — 2026-09-01 |
| **Valmius** | 90 % |

## 🔴 RED

Solun valtaus maksaa jo `CLAIM_YIELD = 10` maaston resurssia (`addClaimYield`,
`pouch.ts:168`), mutta peli ei sano siitä mitään: pussi vain kasvaa hiljaa. Kentässä
kävellyt lenkki ei tunnu palkinnolta. Ei ääntä, ei värinää, eikä niitä voi säätää.

## 🟢 GREEN

- [x] Valtauksen jälkeen HUDin lokirivi kertoo resurssit: `◈ 3 awakened · +30 wood`
- [x] Uusi solu (`claimed`/`taken`) → lyhyt **ääniefekti** (syntetisoitu, ei tiedostoa)
- [x] ...ja **värinä** (`navigator.vibrate`, Android; iOS no-op eikä bugi)
- [x] Ääni ja värinä molemmat kytkettävissä pois — `Settings`-tietue localStoragessa
- [x] Pelkkä `reinforced` ei laukaise mitään — se ei ole palkintohetki
- [x] `claude.md` §6 sääntö 6: proseduraalinen ääni avattu tälle yhdelle hetkelle

## Toteutus

**Ei uutta pelisääntöä.** `CLAIM_YIELD` ja `resourceOf` ovat jo `@es3/core`ssa.
`claimFeedback.ts` (puhdas) lukee saman `outcomes`-listan jonka HUD jo saa:

- `resourceGainsFor(outcomes)` — `claimed`/`taken` × `resourceOf(h3)` × `CLAIM_YIELD`
- `gainsLine(gains)` — `"+30 wood · +10 gold"`
- `isRewardClaim(outcomes)` — tosi jos yksikin solu vaihtoi omistajaa

`claimLine()` (`Hud.tsx`) liittää `gainsLine`n loppuun. `useClaimFeedback(lastClaim,
settings)` katsoo `lastClaim.at`ia: uudella arvolla, jos `isRewardClaim`, soittaa
`playChime()`n (`AudioContext`, kaksi kolmioaaltoa 880→1318 Hz, 0.5 s kirjekuori) ja
`navigator.vibrate?.([40,30,40])`n — kummankin oman kytkimensä takana.

`settings.ts` — `{ sound, vibration }`, oletus molemmat päällä, `saveNow`/`load`
(`persist/save.ts`, avain `settings`). `MapView` lataa sen tilaan ja antaa
`<Hud settings=…>`. Kytkimet itsessään ovat BRDC-HUD-003.

**Ääni tiedoston sijaan:** `AudioContext`-syntetisointi ei tarvitse binääriä, ei
lisenssiä, ei CDN:ää — yksinkertaisin tapa täyttää "kiva ääniefekti". v2:n
äänitiedostot voi vaihtaa tähän myöhemmin omana tikettinään.

## Testit

- [x] `resourceGainsFor`: puu-solu → `{ wood: 10 }`; varastettu kulta → `{ gold: 10 }`;
      kaksi puuta → `{ wood: 20 }`; `reinforced`/`damaged`/`unchanged` → `{}`; plain → `{}`
- [x] `gainsLine`: `{ wood:30, gold:10 }` → `"+30 wood · +10 gold"`; `{}` → `""`
- [x] `isRewardClaim`: `claimed`/`taken` → tosi; `reinforced` ja `[]` → epätosi
- [x] 675 testiä vihreä, `tsc -b` puhdas, `lint:lines` OK
- [~] Äänen/värinän efektiä ei testata yksikkötasolla — selain-API, best-effort

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `claude.md` §6 sääntö 6
