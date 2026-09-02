# BRDC-ECON-003 — Pouch ei täyty, valtaus ei kilise, ja versiolahja

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-ECON-002, BRDC-CHAR-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"pouch ei näy"*, *"pouchini ei täyttynyt resursseista"*, *"en saanut plingiä
uuden alueen omistamisesta"*. Pelaaja käveli pitkän matkan eikä talous reagoinut mitenkään.

Mitattu ennen tikettiä, ei arvattu:

- `CLAIM_YIELD` **toimii ytimessä** — `data/resources.test.ts` väittää
  `total(getResources) === producing * CLAIM_YIELD` ja se on vihreä. Sääntö ei ole rikki.
- `usePouchPolling#positiveDelta` palauttaa **`null` kun `prev` on `null`**. Session
  ensimmäinen luku ei siis koskaan tuota gainia — ja pling ajetaan gainista.
- ECON-002 lisäsi `normalizePool`in, joka parantaa vanhan lyhyen poolin lukiessa. Jos
  kentällä nähty pouch oli tyhjä *eikä* NaN, vika on muualla kuin siinä.

Vika on siis sovelluskerroksessa tai tallennetussa datassa, ei `packages/core`in säännössä.
**Juurisyy mitataan ennen kuin mitään korjataan** — ECON-002 löytyi näin ja se on ainoa
tapa, jolla tästä ei tule toista arvausta.

## 🟢 GREEN

- [ ] **Juurisyy nimetty ja kirjattu tähän tikettiin.** Kolme epäiltyä eroteltuna: (a) pouch
      on oikeasti tyhjä storessa, (b) `getResources` ei tule luetuksi valtauksen jälkeen,
      (c) `positiveDelta` nielaisee sen `prev === null` -haaraan. Toistava testi ensin.
- [ ] Valtaus maksaa saaliin pouchiin ja **HUD näyttää sen heti**, ei minuutin pollia
      odotellen. `territory.lastClaim` on jo `usePouchPolling`in triggereissä — todenna että
      se oikeasti ajaa uuden luvun.
- [ ] **Pling soi uudesta vallatusta heksasta.** Ei vain tunnin vaihtumisesta.
      `playPling()` on olemassa (`features/hud/pling.ts`); kytkentä puuttuu tai ei laukea.
- [ ] **Versiolahja.** `APP_VERSION`in vaihtuessa pelaajalle **100 joka resurssia,
      30 manaa, 30 wisdomia**, kerran per versio. Portti `es3:granted-version`, ei
      kertaakaan kahdesti samalla versiolla.
- [ ] **Tyhjä pouch latauksessa → 100 joka resurssia.** Sama kertaportti, jotta rakennuksia
      pääsee testaamaan heti. Infiniten sanoin: *"ihan vaan että pääsee testaan rakennuksia"*.
- [ ] Testit: versiolahja annetaan kerran eikä kahdesti · tyhjä pouch täyttyy kerran ·
      valtaus kasvattaa pouchia · pling laukeaa valtauksesta.

## Ei tässä

- Debug-nappi (`+200 joka resurssia`, ECON-002) **jää paikalleen** kunnes tämä on kentällä
  todettu toimivaksi. Infinite: *"jos ton saa toimiin, niin ei tartte debug resurssin
  lisäystä"* — poisto on oma rivinsä sen jälkeen, ei tässä.
- Talouden tasapaino. Tämä tiketti korjaa putken, ei numeroita.
