# BRDC-BUILD-010 — Maa kertoo mihin se kelpaa, vaikket vielä osaisi

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-BUILD-005 (`splitBuildable`), BRDC-BUILD-002 (Mine, Quarry) |
| **Status** | `done` — 2026-09-11 (v0.5.66) |
| **Valmius** | 100 % — portti vihreä, desktop `opening` 8/8 |
| **Lähde** | Infinite 2026-09-10: *"myöskin puuttuu rakennus joka buustaa vuorien tuotantoa.. tarvitaan kaivokset jne."* |

## 🔴 RED

**Kaivos on ollut olemassa `BRDC-BUILD-002`:sta asti. Pelaaja ei vain nähnyt sitä koskaan.**

| Rakennus | Maasto | Tuotto | Vaatii |
|---|---|---|---|
| Mine | vuori | +5 rautaa/h | Mining |
| Quarry | vuori | +9 kiveä/h | Mining + Mine |

`splitBuildable` jakoi katalogin kahtia: **rakennettavissa nyt** ja **kaikki muu**. Kaikki
muu meni `+ 14 more` -napin taakse, aakkosjärjestyksessä. Eli vuorella seisova pelaaja
näki *"Nothing can be built here yet"* ja napin takana Mine-rivin neljäntoista sellaisen
rakennuksen seassa jotka **eivät voi koskaan** olla vuorella — kalastamo, satama, viinitarha.

Lopputulos: peli näytti siltä ettei siinä ole kaivoksia. Se ei ole raportoijan virhe; se
on se mitä ruutu sanoi.

Ja tämä on kolmas kerta tässä sarjassa kun sama muoto toistuu: **sisältöä on olemassa,
mutta ruutu ei kerro polkua sinne.** `BRDC-UI-002` (harmaa nappi ilman syytä) ja
`BRDC-UI-003` (Research ei kerro vajetta) olivat kaksi ensimmäistä.

## 🟢 GREEN

- [x] **`splitBuildable` jakaa kolmeen**, ei kahteen:
      - `ready` — voi nousta nyt
      - `here` — **kuuluu tälle maalle** mutta on estetty (teknologia, varat, tilaa ei ole)
      - `elsewhere` — väärä maasto tai puuttuva temppeli; ainoa osa jonka piilottaminen
        on perusteltua
- [x] **"This ground holds"** -osio näyttää `here`-listan aina, syineen: *"Mine — Needs
      Mining"*. Vuori kertoo olevansa vuori.
- [x] Nappi sanoo mitä sen takana on: *"+ N for other ground"* eikä *"+ N more"*.
- [x] Tyhjän tapauksen teksti korjattu: *"Nothing can be built on this ground"* — se on eri
      väite kuin *"…here yet"*, ja nyt se on tosi vain kun se on tosi.
- [x] **Temppelin puute lasketaan väärään maastoon.** Library vaatii temppelin viereensä,
      mikä on tosiasia naapurustosta eikä tästä heksasta — se ei kerro mihin *tämä* maa
      kelpaa. Testattu erikseen, koska se on ainoa rajatapaus.
- [x] `cell-panel.css` osui **401 riviin** ja jaettiin: `build-panel.css` sai
      `.cell-panel__build*`-säännöt. Sauma vastaa komponentteja — `BuildPanel.tsx` on ollut
      oma tiedostonsa `BRDC-BUILD-001`:stä asti. 302 + 104.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1140**) + `pnpm build` vihreä.
- [x] `BuildPanel.test.ts`: neljä testiä kirjoitettu uusiksi kolmijaolle — **lukittu Mine
      pysyy vuorensa kanssa** eikä mene "+ more" -muurin taakse · kalastamo menee ·
      temppelin puute lasketaan väärään maastoon · täysin kelvoton maa on kokonaan
      `elsewhere`.
- [x] e2e `opening.spec.ts` +1 desktopilla: kortti sanoo *"This ground holds"*, näyttää
      *"Needs …"* -syyn, ja napin teksti on *"for other ground"*. 8/8.
- [ ] Kenttä: seiso vuorella ja katso että Mine mainitaan. *(Infinite ajaa.)*

## Mitä tämä ei korjaa

Mining on **170 viisautta** kolmen teknologian päässä (toolmaking 30, masonry 60,
mining 80). Kuuden tunnissa se on lähes kolmekymmentä tuntia — `BRDC-REVEAL-002` lyhentää
sitä, koska jokainen tasangon paljastus maksaa 20 viisautta, mutta kaivos on silti kaukana.

**Onko se liian kaukana, on tasapainokysymys eikä näkyvyyskysymys**, enkä muuttanut sitä
raportin nojalla. Nyt kun polku näkyy, sen pituudesta voi olla eri mieltä tietoon
perustuen. Jos se tuntuu kentällä liian pitkältä, se on oma tikettinsä.

## Ei tässä

- **Rakennusten järjestys `here`-listan sisällä.** Nyt aakkosittain; halvin ensin tai
  lähin teknologia ensin olisi ehkä parempi, mutta se on arvaus ennen kenttätestiä.
- **Polku teknologiaan kortista.** *"Needs Mining"* ei ole linkki Research-ruutuun.
  Houkuttava, mutta `ResearchPanel` on modaalin takana jonka läpi ei pääse sulkematta
  sitä — sama este jonka `BRDC-TECH-002` jo kirjasi.
