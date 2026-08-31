# BRDC-ART-001 — Lovecraft-grafiikka: heksat, liput ja loitsuefektit

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-REVEAL-001, BRDC-TERRAIN-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §4.3, §6 (G1–G4) |

## 🔴 RED

Kaikki maasto näyttää samalta: värillinen heksa. Kun suunnitelman paljastuskortti
lupaa *"Kuva heksan tyypistä (Lovecraft-tyylinen grafiikka)"*, sitä kuvaa ei ole
olemassa yhdellekään maastolle.

Ja pelaajat erottuvat toisistaan **pelkällä sävyllä**, minkä `claude.md` §14 kieltää
suoraan: *"Colour alone never carries information."*

## 🟢 GREEN

- [ ] **Jokaiselle maastolle tunnus**, joka toimii heksan kokoisena kartalla ja
      isona paljastuskortissa
- [ ] **Liput / vaakunat** pelaajille: omistajuus erottuu ilman värinäköä
- [ ] Omistajuudella on **kuvio, ei vain sävy** — `claude.md` §13 vaatii tämän jo,
      eikä se ole toteutunut
- [ ] **Loitsuefektit** pyhänä geometriana, animoituna `stroke-dasharray`illa
- [ ] Harvinaisuuden hehku (`BRDC-REVEAL-001`) osana samaa kieltä, ei erillisenä tyylinä
- [ ] Kaikki **inline-SVG, stroke, ei fill, ei rasteria** (`claude.md` §12)
- [ ] Jokaisella `width`/`height` — CLS < 0,1 on karttapelissä anteeksiantamaton
- [ ] Renderöinti 5 000 solulla mitattu; tunnukset **eivät saa** kaataa ruudunpäivitystä

## Toteutus

`claude.md` §12 on jo päättänyt tyylin, ja se on tässä tiketissä sitova: **pyhä
geometria rakenteena, ei koristeena.** Suunnitelman "pixel/SVG" ratkeaa SVG:n hyväksi
ilman keskustelua — rasteri ei skaalaa heksan koosta korttiin, ja `claude.md` sanoo
*"Never raster."*

Ja sama pykälä asettaa rajan, joka tässä tiketissä on helpoin rikkoa:

> *"geometry appears at moments — a claim, a level-up, an empty state. A screen covered
> in mandalas is noise."*

Maastotunnukset ovat **pysyvästi ruudulla**. Ne ovat siis eri rekisteri kuin
loitsuefekti: hiljaisia, matalakontrastisia, luettavia vilkaisulla. Jos kartta alkaa
näyttää kuvakemereltä, tunnus on liian kova — ja se on tämän tiketin oikea hyväksymiskoe,
ajettuna 360 px:llä ulkona.

## Ei tässä

- 3D. Suunnittelumuistiinpanojen Three.js-huomio pätee: ei ennen kuin 2D on hyvä
- Animoidut hahmot ja muotokuvat dialogiin → `BRDC-QUEST-001`
- Teemat. `docs/backlog/themes.md`, `MASTERPLAN` §8 päätös 3
