# BRDC-TEMPLE-001 — Temppelin voi rakentaa resursseilla, dwell antaa alennusta

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (mekaniikkamuutos + persistointi + testit) |
| **Riippuvuudet** | BRDC-MANA-001, BRDC-DWELL-001, BRDC-DWELL-002, BRDC-BUILD-005 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 (irrotettu `BRDC-BUILD-005`:stä) |

## 🔴 RED

Infinite: *"tehdään niin, että temppelinkin voi rakentaa resursseilla, mutta käytetty
aika antaa alennusta."*

Tällä hetkellä temppeli on **vain** dwell-paljastettu Place: seiso solussa
`TEMPLE_THRESHOLD_MS` (90 min) ja se saa nimen. `build.ts:141` sanoo tämän ääneen —
*"the one thing resources cannot buy, only time in a place"* — ja `library` /
`temple-grove` -rakennukset gettaavat `needs-a-temple`. Manan ainoa lähde on siis
90 min paikallaanoloa per temppeli. Se on liian jyrkkä sisäänkäynti manaan ja
teknologiaan, varsinkin kun dwell-kello on juuri vakautettu (`BRDC-DWELL-002`) mutta
kenttäkokemus on yhä ohut.

Tämä on **tietoinen mekaniikkamuutos**, ei bugikorjaus — siksi oma tikettinsä ja oma
plan-mode-suunnitelmansa.

## 🟢 GREEN

- [ ] **"Consecrate a temple" -toiminto** solulla jonka omistat: maksaa resursseja
      (stone + gold, hintakäyrä `constants.ts`:ään), luo `Place`-rivin `kind: 'temple'`
      samaan tapaan kuin dwell-paljastus. Ei `BUILDINGS`-rivi — Place, koska mana-koodi
      (`mana.ts`, `manaBonus`) lukee Placeja.
- [ ] **Dwell antaa portaittaisen alennuksen.** Solun kertynyt dwell vähentää hintaa:
      0 dwell → täysi hinta, `TEMPLE_THRESHOLD_MS` → ilmainen (= nykyinen paljastus).
      Väliltä lineaarinen tai 3–4 porrasta. Käyrä vakiona, ei paneelissa.
- [ ] **Rakennettu temppeli on kaikin puolin temppeli:** tuottaa manaa (`manaRate`),
      laajennettavissa (`expandTemple`), täyttää `templeAdjacent`-gaten libraryille ja
      temple-grovelle, rappeutuu saman kellon mukaan jos sitä ei käydä katsomassa.
- [ ] **Ei tuplatemppeliä:** jos solu on jo temppeli (dwell tai rakennettu), toiminto ei
      näy. Anchor/Hearth ei voi olla temppeli.
- [ ] Persistointi: rakennetut temppelit talteen (`K.builtTemples` tms. tai laajennettu
      places-store), `resetAll` siivoaa. `SCHEMA_VERSION` vain jos vanhaa ei voi lukea.
- [ ] Puhtaat funktiot + testit: `templeCost(dwellMs)` porras/lineaari · consecrate
      luo Placen ja veloittaa · gate estää tuplan · rakennettu temppeli tuottaa manaa ja
      täyttää `templeAdjacent`in · rappeutuu.
- [ ] `docs/backlog/` mahdollinen lore-rivi temppelin vihkimiselle (Cthulhu-henki), jos
      sopii — mekaniikka ensin.

## Ei tässä

- Temppelien visuaalinen tyyli kartalla (Place-markkeri on jo olemassa).
- Manan tasapaino / `manaRate`-numerot.
- `BUILDINGS`-taulun uudet rakennukset.
