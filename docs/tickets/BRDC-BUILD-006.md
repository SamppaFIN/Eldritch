# BRDC-BUILD-006 — Vartiotorni näkee, muuri pitää

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-BUILD-005, BRDC-MAP-003, BRDC-ART-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Jos alueelle rakentaa vartiotornin, niin se paljastaa 2 rivin heksoja ja
maksamalla lisää enemmänkin. Vartiotornin aluetta ei voi vallata ilman joukkoja ja pelaaja
omistaa sen.. toinen mitä voi rakentaa on muurit .. muuri näytetään grafiikkana sitten
heksan ulkoreunalla.. tyyli sen mukaan onko risuaita, vai kivimuuri jne.. Tämä suojaa
alueen jakamisen, ettei toiset saa vallattua sitä niin helposti."*

Rakennukset tuottavat resursseja ja siinä kaikki. Yksikään ei tee mitään **kartalle** —
ei näkyvyydelle eikä rajalle. Pelaajalla ei ole tapaa vaikuttaa siihen mitä hän näkee tai
mitä hän pitää; hän voi vain kävellä ja odottaa.

Nämä kaksi ovat suora vastaus kahteen olemassa olevaan mekaniikkaan: sumuun
(`BRDC-MAP-003`) ja piiritysmalliin (`claude.md` §11).

## 🟢 GREEN

- [ ] **Vartiotorni paljastaa.** Rakennettuna se merkitsee kahden renkaan heksat
      paljastetuiksi pysyvästi — sama `explored`-tila kuin kävelyllä (`BRDC-MAP-003`).
      Päivitettävissä: lisämaksusta kolmas rengas, sitten neljäs, katto `constants.ts`:ssä.
- [ ] **Tornin heksaa ei voi vallata ilman joukkoja.** Piiritys ei pure siihen: hyökkäys
      kertoo *"The watchtower holds — you need troops."* Kun joukot tulevat
      (`BRDC-RAID-001`), tämä on niiden ensimmäinen kohde.
- [ ] **Muuri on solun ominaisuus, ei rakennus omalla ruudullaan.** Se nostaa solun
      puolustusta kertoimella ja piirtyy **heksan ulkoreunalle** viivana, jonka tyyli
      kertoo materiaalin: risuaita → paalutus → kivimuuri. Kolme tasoa, kolme hintaa.
- [ ] **Muuri piirretään stroke-viivana** vain niille reunoille joilla ei ole omaa maata —
      raja näkyy rajana, ei laatikkona. `--sacred-gold`ista poikkeava oma sävy.
- [ ] Puhtaat funktiot: `revealRing(building)` ja `wallDefence(cell)`. Molemmille testit,
      ja piiritystestiin tapaus jossa muuri kestää hyökkäyksen jonka se ilman muuria häviäisi.
- [ ] Molemmat näkyvät `BRDC-BUILD-005`:n suodatetussa listassa vasta kun ne voi rakentaa.

## Ei tässä

- Joukot. Torni *odottaa* niitä (`BRDC-RAID-001`), tässä se vain on valtaamaton.
- Muurin murtaminen erikseen. Se on osa piiritystä, ei oma verbinsä.
- Piiritysmallin numeroiden muu säätö (`claude.md` §11: älä yksinkertaista sitä pois).
