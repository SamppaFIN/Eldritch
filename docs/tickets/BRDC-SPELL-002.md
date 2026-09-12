# BRDC-SPELL-002 — Scrying, ja loput koulukunnat

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SPELL-001, BRDC-MANA-001, BRDC-MAP-003, BRDC-KEEP-003 |
| **Status** | `in_progress` — 2026-09-12 (v0.5.76): Scrying ja Aegis tehty; estoloitsu ei ole mahdollinen ennen Vaihetta 5 |
| **Valmius** | 75 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 · `BRDC-SPELL-001` (valta/esto siirrettiin tänne) |

## 🔴 RED

`BRDC-SPELL-001` jätti tämän auki nimeltä mainiten: kotikoulukunnat (Insight, Bulwark)
tehtiin, **valta ja esto siirrettiin `BRDC-SPELL-002`:een**. Tiketti puuttui. Tässä se on.

Kentältä tuli sille sisältö: *"Loitsuja: Scrying, millä saa tietoon alueet."*

Scrying on täsmälleen se loitsu jota tämä peli tarvitsee ja jota sillä ei ole: sumu
(`BRDC-MAP-003`) tekee kartasta tuntemattoman, vartiotorni (`BRDC-BUILD-006`) avaa sitä
rakentamalla — ja manalle ei ole vieläkään mitään käyttöä, joka tuntuisi taialta.

## 🟢 GREEN

- [x] **Scrying.** 55 manaa, 6 h, paljastaa valitun alueen ilman kävelyä ja **ei kirjoita
      mitään**. Sumu nostetaan siellä missä loitsu katsoo, niin kauan kuin se on käynnissä;
      kun `activeSpells` pudottaa sen, heksat lakkaavat syntymästä ja maa pimenee itsestään.
      Ei ajastinta, ei siivousta — sama lukuhetken malli kuin rappiolla
- [x] **Ero Farsightiin kirjoitettu näkyviin.** Tiketti on viikkoa vanhempi kuin `farsight`
      (PIVOT §7), joka tekee saman verbin *pysyvästi*. Nyt: Farsight on lyhyt ja pysyvä
      (2 rengasta, kirjoitetaan storeen), Scrying on laaja ja väliaikainen. Testi kaatuu jos
      ne joskus sulautuvat
- [~] Kantama ja kesto ovat `spell.ts`:ssä, **eivät `constants.ts`:ssä**. Perustelu on
      tiedoston oma, jo kirjoitettu sääntö: *"it is a number belonging to one Rite, and the
      table is where a Rite's numbers live"*. `constants.ts` on lisäksi 395/400
- [x] Kantama kasvaa Consciousnessin mukana: 3 rengasta + 1 per 4 tasoa, katto 8.
      Katto siksi että kartta ei ole peli — 8 rengasta on jo 217 heksaa
- [x] **Vallan loitsu: Aegis.** Bulwark laajempana — ostaa rappiokellosta aikaa jokaiselle
      omalle solulle kahden renkaan sisällä. Sama `shelteredMs`-koneisto, ei uutta efektikoodia
- [ ] **Estoloitsua ei tehty, eikä se ole unohdus.** Ks. alla
- [x] Loitsut löytyvät Rites-välilehdeltä: `HOME_SPELLS` johdetaan `SPELLS`istä, joten
      molemmat ilmestyivät sinne ilman uutta koodia
- [x] Aktiivinen loitsu näkyy HUDissa aikoineen — olemassa oleva malli kantoi sellaisenaan
- [x] Puhtaat funktiot + testit: 10 `spellEffects.test.ts`, 4 uutta `spell.repo.test.ts`:ään,
      2 sumun saumaan. Scry vanhenee · kantama kasvaa eikä koskaan laske · katto pitää ·
      Scrying ei kirjoita storeen · Aegis ei koske maahan jota et omista

## Ratkaisematta jäänyt: estoloitsua ei voi kastaa kotona

Tiketti pyytää loitsua joka *"hidastaa vastustajan rappiota vastaan tekemää työtä"*.
Kirjoitin sen ensin — `wither`, Bulwark etumerkki käännettynä — ja **`spell.test.ts`:n oma
invariantti kaatoi sen**: *"every home spell does not target an enemy cell"*.

Testi oli oikeassa ja suunnitelmani väärässä, ja syy on syvempi kuin muoto. `projectCell`
palauttaa `imported`-solun koskemattomana tarkoituksella (`decay.ts:60`): tämä laite ei saa
vanhentaa toisen maata, koska se keksisi rappion johon kukaan ei suostunut ja lopulta
vapauttaisi solun jota sen oikea omistaja yhä pitää.

Eli **Wither olisi maksanut 70 manaa eikä olisi tehnyt yhdellekään oikealle rivaalille
mitään.** Ainoat solut joihin se olisi purrut ovat mock-maailman siemennetyt naapurit.

`snare` kantaa eston jo Wageriin, jossa se voidaan tuomaroida, ja se **jää vastaukseksi
kunnes Vaihe 5 tuo palvelimen**. Merkitty `[ ]`, ei rastitettu.

## Todennus

- `pnpm test` 1286, `tsc -b`, `check-line-limit`, `pnpm build` — vihreä
- desktop `opening` + `tutor` + `map` 24/25 · `dialogs` 13/13
- **`map.spec`in kameratesti on kuormaherkkä ja se ei ole tämän tiketin vika.** Todennettu
  stashaamalla koko työ: lähtötaso kaatui samassa ajossa eri kameratestiin
  (`marker sits exactly on the camera centre`), ja yksin ajettuna molemmat menevät läpi
- Jaot joita tämä vaati, koska tiedostot olivat täynnä: `spell.ts` → `spellEffects.ts`
  (taulukko ja loitsiminen vs. mitä käynnissä oleva loitsu tekee), ja `MapView` →
  `useShownCells.ts` (sumu + scry yhtenä kysymyksenä)

## Ei tässä

- Vastustajaan kohdistuvat loitsut jaetussa maailmassa. Kaikki tämä ajetaan paikallisesti;
  moninpeli on Vaihe 5, ja Infinite rajasi sen: *"Kaikki backend ja multiplayer asiat
  tehdään sit, kun saadaan lokaali versio toimiin."*
- Loitsuefektien grafiikka (`BRDC-ART-001`, `BRDC-FX-001`).
