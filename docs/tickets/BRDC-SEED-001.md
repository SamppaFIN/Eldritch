# BRDC-SEED-001 — Worldseedin koordinaattien kohdistus

| | |
|---|---|
| **Alue** | uusi `packages/core/src/data/worldseedRegister.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `done` — ajettu ja todennettu 2026-09-16 |
| **Riippuvuudet** | `BRDC-SEED-000` |
| **Lähde** | Infinite 2026-09-16: *"tehdään niin, että luodaan tuo heksa gridi worldseedin mukaan… Seikkailun pisteet on hieman sinnepäin annettu, aiemmat lokaatio tiedot on oikein"* |

## 🔴 RED

**Mitattu, ei arvioitu.** Kuvakaappaus (`registration2.png`, tuotettu Playwright-skriptillä
joka piirtää dokumentin vyöhykkeet, maamerkit ja pelin vahvistetut seikkailupisteet samalle
oikealle kartalle) osoittaa: dokumentin geometria (16 vyöhykettä, 7 maamerkkiä) istuu siististi
todellisen katuverkon ja rannan päälle **Härmälän keskustassa** — mutta pelin vahvistetut
seikkailupisteet (patsas, järvi, trinket, erakko, sauva, peikko, viisaus, syvyys — kaikki
long-pressillä käyttäjän itsensä varmistamia) muodostavat **oman, täysin erillisen ryppäänsä
noin 400 m pohjoisessa**, lähempänä rantaa/puistoa eikä keskustaa. Kahden ryppään välissä ei
ole päällekkäisyyttä yhdessäkään pisteessä.

Tämä ei ole kohinaa vaan **yksi systemaattinen käännösvektori** koko dokumentin geometrialle:
sama ilmiö joka `BRDC-QUEST-006` löysi koodista (yksi vektori siirtää koko muodon), mutta
tässä virhe on dokumentin laadinnassa, ei koodissa.

**Mitattu vektori** (WGS84, molemmat patsaan sijainnit tunnetaan):

```
DOC statue  (worldseed.ts / kuva-projisoitu):  61.4693,    23.7287
GAME statue (Infiniten pitkä painallus, vahvistettu): 61.47290805, 23.72588249

Δlat = +0.00360805°  ≈ +402 m  (pohjoiseen)
Δlng = -0.00281751°  ≈ -150 m  (itään negatiivinen ⇒ 150 m länteen)
```

Infiniten ohje *"aiemmat lokaatio tiedot on oikein"* ratkaisee minkä puolen kääntää:
**GAME-piste on totuus, DOC-geometria käännetään sen päälle**, ei toisin päin.

## 🟢 GREEN

- [x] `registerWorldseed(doc, anchor)` (`packages/core/src/data/worldseedRegister.ts`):
      laskee `Δ = anchor - doc["Statue of the Boy"].at` ja lisää sen jokaiseen dokumentin
      koordinaattiin — `grid.origin`, `bbox`, `anchorStone`, `landmarks`, `zoneOverrides`
      (`bounds` ja `shoreline`), `leyLines`, `wonders`, `questChains` (`nodes` ja `items`).
      Puhdas, ei I/O:ta
- [x] Testi: dokumentin oma patsaskoordinaatti kääntyy `HARMALA_STATUE`hun asti < 0,2 m
- [x] Testi: toinen piste (Villa Härmälänranta) siirtyy **täsmälleen saman matkan** kuin
      patsas — todistaa yhden jäykän vektorin, ei sattumaa yhdellä pisteellä. Kahdeksan
      testiä yhteensä, kaikki 🟢 (`worldseedRegister.test.ts`)
- [x] `packages/core/src/data/seed/harmala.source.json` — dokumentin alkuperäinen data
      tallessa versionhallinnassa (kopio designkansiosta, joka itse ei ole versionhallinnassa).
      `scripts/register-worldseed.mjs harmala` ajaa käännön kertaalleen ja kirjoittaa
      `harmala.registered.json`in; ei ajeta ajon aikana
- [x] Ajettu: patsas päätyy täsmälleen `61.472913, 23.725988`; `anchorStone`, `grid.origin`,
      `bbox` ja kaikki maamerkit/ihmeet/questin solmut siirtyivät mukana
- [x] Kuvakaappaus toistettu käännetyllä datalla (Playwright, luettu suoraan
      `harmala.registered.json`ista): DOC-patsas ja GAME-patsas piirtyvät samaan pisteeseen,
      muut maamerkit oikeassa naapurustossa — kaksi ryppäätä ovat nyt yksi

## Ei tässä

- POI-luokittelu OSM:stä — `BRDC-SEED-002`
- Vyöhykkeiden jako heksoiksi — `BRDC-SEED-003`
- `anchorStone.at`in kommentti ("kept where it is") on vanhentunut nyt kun käännös hoitaa
  sen — ei korjattu tässä, se on sisältöä, ei koordinaatti
