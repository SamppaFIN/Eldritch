# BRDC-BUILD-004 — Linnoitus, Kauppareitti ja vaikutusalueen näkyminen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-003, BRDC-CLAIM-004, BRDC-INSPECT-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
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

- [ ] **Linnoitus** `BUILDINGS`:ssa: `aura { kind: 'defence', radius: 1, amount: N }`,
      maasto `'any'`, teknologia `fortification`
- [ ] Puolustusaura **vähentää vahinkoa**, jonka vihollishyökkäys tekee säteen sisällä
      oleviin omiin soluihin — sekä kävelyhyökkäykseen (`growInto`) että lenkin
      sulkemiseen (`planClaim`)
- [ ] Puolustus **noudattaa kattoa** (`AURA_CAP_PER_CELL` tai oma) eikä voi tehdä solusta
      valtaamatonta: `max(0, damage - defence)`, ja `BRDC-CLAIM-004`:n testit todistavat
      ettei siege-tasapaino kaadu
- [ ] `resourceAura` **ei käsittele** `'defence'`-auraa resurssina — se ei ole `ResourcePool`:ssa
- [ ] **Kauppareitti**: oma avain `K.tradeRoutes`, `Array<{ a, b, builtAt }>`. Sitoo kaksi
      omaa solua enintään `TRADE_ROUTE_MAX_HEXES` päässä toisistaan; molemmat saavat
      kultaa tunnissa. Ei asu `cell.building`issa
- [ ] Kauppareitin purku hyvittää puolikkaan, kuten muutkin rakennukset
- [ ] **Vaikutusalue kartalla**: kun solu jolla on aura (tai paikka) on valittuna,
      `cellsWithin(h3, radius)` piirtyy omalle karttatasolle. Ei tekstinä
- [ ] Puhtaat funktiot testattu: `defenceAura` päällekkäisillä, `max(0, …)`-lattia,
      kauppareitin sidos ja etäisyysraja

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
