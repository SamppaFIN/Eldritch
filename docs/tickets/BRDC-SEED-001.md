# BRDC-SEED-001 — Worldseedin koordinaattien kohdistus

| | |
|---|---|
| **Alue** | uusi `packages/core/src/data/worldseedRegister.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `todo` — mitattu, vektori tunnettu |
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

- [ ] `registerWorldseed(doc, anchor)`: laskee `Δ = anchor.game - doc.statue` ja lisää sen
      jokaiseen dokumentin koordinaattiin (vyöhykkeet, maamerkit, ihmekandidaatit) — yksi
      pieni funktio, puhdas, testattu tarkalla ±1 m toleranssilla
- [ ] Testi: syötteenä `worldseed.ts`:n oma `statue`-koordinaatti ja `HARMALA_STATUE`,
      tulos täsmää `HARMALA_STATUE`hun asti pyöristysvirheeseen
- [ ] Testi: toinen tunnettu piste (esim. `HARMALA_LAKE` jos sillä on dokumentissa vastine)
      päätyy järkevälle etäisyydelle käännön jälkeen — vahvistaa ettei kyse ole vain
      yhden pisteen sattumasta
- [ ] `seed.harmala.json`in koordinaatit ajetaan tämän läpi **kertaalleen build-skriptissä**,
      ei ajossa joka kerta — tulos tallennetaan käännettynä
- [ ] Kuvakaappaus toistetaan käännön jälkeen: molemmat ryppäät samalla kartalla, nyt
      päällekkäin — visuaalinen todiste ennen kuin heksan esiarvot generoidaan

## Ei tässä

- POI-luokittelu OSM:stä — `BRDC-SEED-002`
- Vyöhykkeiden jako heksoiksi — `BRDC-SEED-003`
