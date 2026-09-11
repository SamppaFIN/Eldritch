# BRDC-GPX-001 — Nauhoitettu reitti kävellään sisään, ei tuoda

| | |
|---|---|
| **Vaihe** | 3 → PIVOT-2026-09-09 kohta 9 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-TRAIL-001 (`submitTrail`, `filterTrail`), BRDC-GROW-001 (naapuruusvaltaus) |
| **Status** | `done` — 2026-09-11 (v0.5.71) |
| **Valmius** | 100 % — portti vihreä, desktop `gpx` 3/3, mobile-360 axe 8/8 |
| **Lähde** | PIVOT §9: *"Putki: GPX → sama muoto kuin live-GPS → territorio-engine niin että tuonti käyttäytyy identtisesti live-kävelyn kanssa."* |

## 🔴 RED

**Kelloon tai trackeriin nauhoitettu kävely ei päässyt peliin mitenkään.**

Se on erityisen kipeää tässä pelissä: koko mekaniikka on kävely, ja ne kävelyt joita
ihmiset jo nauhoittavat — juoksulenkit, pyöräilyt, vaellukset — olivat pelille olemattomia.

## 🟢 GREEN

### Se mikä tekee tästä oikean

- [x] **Tuonnilla ei ole omaa valtauspolkua.** `parseGpx` lukee tiedoston samaksi
      `TrailPoint[]`:ksi jonka live-GPS tuottaa, ja ne menevät `submitTrail`ille. Siinä
      kaikki. Samat suodattimet, sama naapuruussääntö, sama dwell.
- [x] **Ja se on testattu väitteenä eikä oletuksena:** sama reitti kävellen ja tuotuna
      päätyy **täsmälleen samaan maahan**, ja testi varmistaa ettei kyse ole siitä että
      kumpikaan ei ota mitään.
- [x] **Oma runinsa**, ei käynnissä olevaan. Tiistaina nauhoitettu reitti ei ole jatkoa
      nyt käynnissä olevalle kävelylle, ja sen pujottaminen sinne tekisi hypyn viimeisen
      oikean fixin ja tiedoston ensimmäisen pisteen väliin.

### Kaksi asiaa joita muoto ei kanna

- [x] **Tarkkuutta ei ole olemassa GPX:ssä.** `hdop` on lähin vastine ja on laimennusluku
      eikä metrejä; tavallinen karkea muunnos on viisi metriä yksikköä kohti. Ilman sitä
      `GPX_ASSUMED_ACCURACY_M` (10 m) astuu tilalle — **nimettynä vakiona eikä
      piilotettuna literaalina** — koska jokaisen pisteen hylkääminen kentän puutteesta
      jota formaatissa ei ole tekisi ominaisuudesta hyödyttömän. Villi `hdop` rajataan
      `MAX_ACCURACY_M`:ään: tuonti ei saa keksiä tarkkuuslukemaa jollaista peli ei muuten
      koskaan näe.
- [x] **Aikaleimaton reitti torjutaan nimeltä.** Ei tekninen yksityiskohta: väli- ja
      nopeussuodattimet **ovat** anti-cheat, ja keksitty aikaleima on keksitty nopeus.
- [x] **Järjestetään ajan mukaan**, ei luoteta tiedoston järjestykseen. Kahdesta laitteesta
      yhdistetty tai työkalun uudelleenkirjoittama reitti voi tulla epäjärjestyksessä, ja
      takaperin menevä väli lukisi negatiivisena nopeutena — jollaista suodattimia ei ole
      kirjoitettu arvioimaan.

### Luottamus, sanottuna suoraan

- [x] Tiedosto voi väittää mitä tahansa. **Nopeus- ja välisuodattimet ajetaan silti**, joten
      teleporttaava väärennös lentää ulos samalla tavalla kuin huono fix — se on testattu.
      Mutta **kärsivällisesti väärennetty tiedosto on erottamaton kävelystä**, ja sen
      teeskenteleminen olisi pahempaa kuin sanoa se. Aito auktoriteetti on Vaiheen 5
      palvelin, kuten `claude.md` §15 jo kirjaa.

### Ruudulla

- [x] ☰ → **Import a walk**. Kertoo mitä luettiin, mitä otettiin, ja **mitä heitettiin pois
      ja miksi** — *"3 faster than walking"*, *"2 standing still"*. Reitti joka laskeutuu
      puolittain hiljaa on sellainen jonka pelaaja päättää olevan rikki.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1204**) + `pnpm build` vihreä.
- [x] `gpx.test.ts` (12): lukee reitin · **järjestää ajan mukaan** · itsesulkeutuva muoto ·
      wpt ja rtept myös · **oletustarkkuus on nimetty ja mahtuu rajan alle** · hdop viisi
      metriä yksikköä · **ei koskaan huonompaa kuin peli sallii** · tunnistaa mikä ei ole
      GPX · tyhjä GPX · **aikaleimaton torjutaan nimeltä** · osittain aikaleimatusta
      säilytetään aikaleimalliset · rikkinäinen koordinaatti ohitetaan.
- [x] `gpx.repo.test.ts` (3) oikean `MockRepository`n läpi: **tuotu ja kävelty reitti
      ottavat saman maan** · teleportti heitetään ulos koska kävelypolku heittää ·
      pisteet luetaan takaisin metrilleen.
- [x] e2e `gpx.spec.ts` (3, desktop): oikea tiedosto luetaan ja raportoidaan ·
      ei-GPX sanoo sen nimeltä · aikaleimaton kertoo miksi.
- [x] mobile-360 `standards.spec.ts` (axe, WCAG 2.2 AA) 8/8.
- [ ] Kenttä: vie oma lenkkitiedosto sisään. *(Infinite ajaa.)*

## Vika jonka testit nappasivat kirjoittaessa

`ATTR` rakensi attribuuttilausekkeen **template literalista**, jossa `\b` on
askelpalautin eikä sanaraja. Lauseke ei voinut osua mihinkään, joten **jokainen piste
menetti koordinaattinsa hiljaa** ja jäsennin sanoi vain *"no-points"*. Regex näyttää
oikealta luettuna; se on väärin vain ajettuna.

Ja yksi testini oli väärässä: itsesulkeutuvan `<trkpt/>`:n oikea vastaus on `no-times`
eikä `no-points` — elementti *löytyi* ja torjuttiin siitä yhdestä asiasta joka siitä
puuttuu. Se on parempi todiste kuin alkuperäinen väite.

## Ei tässä

- **Palvelimelle vienti** (§9:n *"toimittava myös palvelimelle"*). Tuotu maa on tavallista
  omaa maata, joten se lähtee `world.json`iin normaalin julkaisun mukana — erillistä
  polkua ei ole eikä tarvita. Todennettu vasta kun Infinite julkaisee tuodun lenkin.
- **GPX-vienti.** Peli tallettaa kuljetut pätkät (`paths`), joten se olisi mahdollista,
  mutta kukaan ei ole pyytänyt sitä.
- **Karttaeditorin tiedostomuodon yhteensopivuus** (§8 pyysi sitä). Molemmat ovat
  `h3 → dataa`, mutta yhteensopivuus on väite jota ei ole vielä koeteltu, eikä sitä
  kirjata tehdyksi ennen kuin on.
