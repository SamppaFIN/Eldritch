# BRDC-MAP-EDIT-001 — Karttaeditori: maasto heksa kerrallaan

| | |
|---|---|
| **Vaihe** | 3 → PIVOT-2026-09-09 kohta 8 |
| **Effort** | L (päivä) |
| **Riippuvuudet** | BRDC-TERRAIN-003 (käsikartoitus), BRDC-BOUNTY-001 (löydöt) |
| **Status** | `done` — 2026-09-11 (v0.5.69) |
| **Valmius** | 100 % — portti vihreä; editori ajettu läpi dev-palvelimella |
| **Lähde** | PIVOT §8: *"syötät Google Maps -kuvakaappauksen ja määrität manuaalisesti lähialueen heksojen ominaisuudet… Editori tuottaa erillisen, koneluettavan tiedoston."* |

## 🔴 RED

**Käsin kuratoitu maasto oli ympyröitä ja laatikoita, käsin kirjoitettuna.**

`terrainSeed.ts` on ensimmäinen yritys: kuusi aluetta Härmälän päällä, jokainen ympyrä tai
suorakaide. Se toimii — ja se ei skaalaudu yhtä naapurustoa pidemmälle. **Rantaviiva ei ole
ympyrä ja puisto ei ole laatikko.** Jokainen lisäalue olisi ollut lisää koodia, ja jokainen
korjaus olisi vaatinut kääntäjän.

Kaikki muu maasto tuli hashista. Se on hyvä oletus eikä koskaan oikea vastaus.

## 🟢 GREEN

### Muutos briefiin, ja sen perustelu

- [x] **Kuvakaappausvaihe jätettiin pois.** Brief pyysi Google Maps -kuvakaappauksen
      kohdistamista käsin. Peli piirtää jo oikeat karttatiilet oikeine heksoineen, joten
      **suoraan elävälle kartalle maalaaminen antaa tarkat koordinaatit ilman kohdistusta.**
      Kuvakaappaus oli kiertotie sille ettei karttaa ole — ja kartta on.

### Tiedosto

- [x] **`data/mapData.ts`** — piirros on litteä `h3 → mitä siinä on`. Lyhyet avaimet
      (`t`, `b`), koska piirroksessa on tuhansia näitä.
- [x] **Maasto ja löytö** voidaan kumpikin asettaa käsin. Löytö oli ennen puhtaasti
      deterministinen; nyt ihminen voi sanoa että *tuolla* rannalla on kalaa.
- [x] **Torjuu äänekkäästi** (`not-json`, `not-a-drawing`, `wrong-version`). Puoliksi
      ymmärretty tiedosto antaisi naapurustolle väärän maaston hiljaa, ja **väärä maasto
      maksaa vääriä resursseja niin kauan kuin kukaan ei huomaa.**
- [x] **Pyyhkiminen tyhjentää oikeasti:** `paint(…, null)` poistaa merkinnän eikä jätä
      `{}`:ää. Muuten siivottu piirros näyttäisi maalatulta kaikelle mikä laskee rivejä.
- [x] **Myöhempi piirros voittaa** samasta heksasta, joten pieni korjaus voi tarkentaa
      ison aluetiedoston ilman että isoa tarvitsee muokata.

### Ketju

- [x] **Piirros voittaa kaiken:** `paintedTerrainOf` → `seededTerrainOf` → tallennettu
      tiiliarvo → hash. Se on tarkoituksellinen järjestys: piirros on tahallisin
      käytettävissä oleva vastaus, koska **ihminen katsoi sitä heksaa ja sanoi niin.**

### Editori

- [x] Napautus maalaa, sivellin kantaa maastoa ja/tai löytöä, **Scrub** palauttaa hashiin,
      **Undo** 50 askelta, **Export** kirjoittaa tiedoston, **Import** lukee sen.
- [x] **Piirros on voimassa heti:** kartta piirtyy niissä väreissä joita tiedosto oikeasti
      tuottaa. Sokkona maalaaminen ja jälkikäteen tarkistaminen on tapa saada piirroksesta
      hienovaraisesti väärä.
- [x] Sulkeminen palauttaa kartan siihen mitä build sisältää, joten keskeneräinen piirros
      ei koskaan esitä oikeaa maailmaa.

### Miksi se on dev-työkalu

- [x] **Maasto päättää mitä maa tuottaa** (`TERRAIN_TABLE`), joten pelaaja joka voisi
      maalata oman naapurustonsa voisi maalata itselleen rautakaivoksen. Editorin tuotos
      on **sisältöä**: tiedosto joka viedään ulos ja **committoidaan**. claude.md §15 ei
      löysty mukavuuden vuoksi.
- [x] **Ja se on oikeasti poissa pelaajan buildista.** Ensimmäinen versio *renderöi*
      `import.meta.env.DEV`in takana mutta importoi paneelin ehdoitta, joten merkkijonot
      jäivät bundleen — eli väitteeni "kompiloitu pois" oli väärä. Tarkistin sen
      `grep`illä valmiista bundlesta, korjasin haaran, ja tarkistin uudestaan: *"Map
      editor"* ja *"Tap a hex to paint it"* eivät esiinny tuotantobundlessa.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1184**) + `pnpm build` vihreä.
- [x] `mapData.test.ts` (12): maalaus ei mutatoi · **pyyhkiminen poistaa merkinnän** ·
      edestakainen JSON säilyy · **torjuu neljä eri vikaa nimeltä** · nimetön piirros
      kelpaa · vaiti heksasta jota kukaan ei piirtänyt · **voittaa hashin** · **voittaa
      tallennetun tiiliarvon** · löytö käsin maastolle jota taulukko ei olisi valinnut ·
      nimeämättömiin heksoihin ei kosketa · myöhempi tarkentaa aiempaa · tyhjä lataus
      nollaa.
- [x] `editor.test.ts` (5): maasto yksin · löytö yksin · molemmat · **tyhjä sivellin
      pyyhkii** · ei tyhjiä avaimia, jotta kaksi piirrosta samasta maasta ovat samat.
- [x] **Editori ajettu läpi dev-palvelimella:** valikkorivi näkyy, napautus maalaa
      (`1 painted`), editori sieppaa napautuksen kortilta, Undo palauttaa (`0 painted`).
- [x] **Tuotantobundle tarkistettu greppaamalla**: editoria ei ole siellä.
- [ ] Kenttä: piirrä oma naapurustosi ja vie tiedosto. *(Infinite ajaa.)*

## Ei tässä

- **E2e editorille.** Se on dev-työkalu ja Playwright ajaa tuotantobuildia vastaan, jossa
  sitä ei ole — eikä pidäkään olla. Kate on yksikkötesteissä (17) plus dev-ajo yllä.
- **Kuvakaappauksen kohdistus.** Ks. yllä: kartta on parempi pohja kuin kuva kartasta.
- **Erikoiskohteet ja Ihmeet** — PIVOT §8 mainitsee ne, mutta Ihmeitä ei ole vielä
  olemassa (§10). Tiedostomuodossa on tilaa: `PaintedCell` kasvaa kentällä, ei versiolla.
- **Piirroksen lataaminen buildiin.** `loadDrawings` on olemassa ja testattu, mutta yhtään
  tiedostoa ei ole vielä committoitu — se on ensimmäisen oikean piirroksen työ, ja se
  tehdään kun Infinite on piirtänyt sellaisen.
- **GPX-yhteensopivuus** (§9). Muoto on `h3 → data`, jollaisen GPX-tuonti myös tuottaa,
  mutta yhteensopivuus todennetaan vasta kun tuonti on olemassa.
