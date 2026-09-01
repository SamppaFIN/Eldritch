# BRDC-BUILD-004 — Linnoitus, Kauppareitti ja vaikutusalueen näkyminen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-003, BRDC-CLAIM-004, BRDC-INSPECT-001 |
| **Status** | `in_progress` — 2026-09-01: Linnoitus + Kauppareitti + overlay tehty; kauppareitin kaksinapautus-UI jäljellä |
| **Valmius** | 90 % |
| **Lähde** | BRDC-BUILD-003:n siirretyt kohdat (2026-09-01) |

## 🔴 RED

`BRDC-BUILD-003` toteutti auravat rakennukset ja uskollisuuden, mutta kolme sen GREEN-
kohtaa jäi, koska ne eivät folddaa olemassa oleviin saumoihin yhtä siististi:

1. **Linnoitus puuttuu.** Suunnitelman viidestä rakennuksesta neljä on nyt datassa,
   Linnoitusta ei. Sen vaikutus — puolustus — kulkee taistelupolun läpi
   (`resolveCapture`), ei `perHourBonus`:n.
2. **Kauppareitti puuttuu.** Se sitoo kaksi solua, joten se ei voi asua `cell.building`issa
   niin kuin kaikki muut. Vaatii oman tallennuksen.
3. **Vaikutusalue ei näy kartalla.** `BRDC-INSPECT-001` huomautti jo että `NEIGHBOUR_BONUS`
   on näkymätön; nyt auroista tuli lisää näkymätöntä hyvää. Kun rakennus tai paikka on
   valittuna, sen säde pitäisi piirtyä.

## 🟢 GREEN

- [x] **Linnoitus** `BUILDINGS`:ssa: `aura { kind: 'defence', radius: 1, amount: 30 }`,
      maasto `'any'`, teknologia `fortification`
- [x] Puolustusaura **vähentää vahinkoa** säteen sisällä oleviin omiin soluihin — sekä
      `growInto` että `planClaim` lukevat `defenceAura`:n samasta `known`-kartasta
- [x] Puolustus **noudattaa kattoa** (`DEFENCE_AURA_CAP = 75`), eikä tee solusta
      valtaamatonta: `resolveCapture` tekee `max(0, attackPower - max(0, defence))`.
      CLAIM-004:n testit ennallaan (`defence` oletuksena 0); uudet todistavat lattian
- [x] `resourceAura` **hyppää yli** `'defence'`-auran — se ei ole `ResourcePool`:ssa
- [x] **Kauppareitti**: `K.tradeRoutes`, `TradeRoute[]`. `canLayRoute` — kaksi omaa solua
      ≤ `TRADE_ROUTE_MAX_HEXES` päässä, ei duplikaattia; `routeGoldBonus` → `perHourBonus`
      (`TRADE_ROUTE_GOLD`/h kun molemmat päät hereillä). Ei `cell.building`issa
- [x] `removeRouteAt` hyvittää puolikkaan (`routeRefund`, `DEMOLISH_REFUND`)
- [x] **Vaikutusalue kartalla**: `AuraLayer.ts` (GeoJSON, täyttö + katkoviivareunus)
      piirtää `useSelection.auraCells`:n — rakennuksen `aura.radius`, tai Monumentin /
      paikan uskollisuus­renkaan (säde 1). Territoryn päällä, ley-linen alla. `[~]`
      selaimessa todentamatta
- [x] Puhtaat funktiot testattu: `aura.test.ts` (defenceAura päällekkäisillä + katto),
      `capture.test.ts` (max(0)-lattia), `trade.test.ts` (sidos, etäisyys, duplikaatti,
      kulta, hyvitys)

## Toteutettu 2026-09-01

**Linnoitus** (commit `eea91b2`): `Building.aura.kind` sai `'defence'`,
`aura.ts#defenceAura(known, h3, ownerId)` summaa puolustajan Linnoitukset säteeltä,
`DEFENCE_AURA_CAP`-katto. `resolveCapture(cell, attacker, now, defence=0)` — yksi
valinnainen parametri, `growInto` ja `planClaim` laskevat sen `known`-kartasta kuten
`ownedNeighbours`in. `BuildingId` +`fortress`. Testit +6.

**Kauppareitti**: `rules/trade.ts` (puhdas) — `canLayRoute` (`ward.ts`:n muoto),
`routeGoldBonus` (lepotila­suodatettu), `routeRefund`, `sameLink` (järjestyksestä
riippumaton). `data/tradeStore.ts` ohut sauma — `layRouteAt` / `removeRouteAt`, settle +
sääntö + kirjoita vain onnistuessa. `geo/cells.ts#hexDistance`. `perHourBonus` syöttää
`routeGoldBonus`:n. `GameRepository` + `MockRepository` (`importChallenge` tiivistettiin
rivibudjetin vuoksi, 399/400). Testit +10. **636 vihreää.**

## Ei tässä

- Kaupunkivaltioiden kauppareitit → `BRDC-CITY-001`
- Aura­efektien grafiikka (hehku, animaatio) → `BRDC-ART-001`
- Kaksisoluinen valintavuo (napauta A, napauta B) kauppareitin UI:hin — tulee overlayn
  kanssa

## Toteutus

**Linnoitus foldaa `resolveCapture`:en yhdellä valinnaisella parametrilla.** `growInto`
ja `planClaim` laskevat jo `ownedNeighbours`in `known`-kartasta; puolustus lasketaan
samasta kartasta samalla tavalla (`defenceAura(known, h3, ownerId)`), ja
`resolveCapture(cell, attacker, now, defence = 0)` vähentää sen vahingosta. `capture.ts`:n
"someone else's" -haara on ainoa muutoskohta.

**Kauppareitti on `templeStore`/`spellStore`-tyylinen ohut sauma.** `data/tradeStore.ts`:
`readRoutes`, `layRoute`, `removeRoute`, `routeGoldBonus(routes, now)` → `perHourBonus`.
`GameRepository.layTradeRoute` / `getTradeRoutes` / `removeTradeRoute`.

**Overlay on `PathLayer`-tyylinen taso.** `AuraLayer.ts` — GeoJSON-lähde, `cellBoundary`
jokaiselle `cellsWithin`-solulle, `useSelection` kertoo valitun solun auran säteen,
`MapCanvas` piirtää. Jos venyy → oma tiketti, muut kohdat eivät riipu siitä.

## Ei tässä

- Kaupunkivaltioiden kauppareitit → `BRDC-CITY-001`
- Aura­efektien grafiikka (hehku, animaatio) → `BRDC-ART-001`
