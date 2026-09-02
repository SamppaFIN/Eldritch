# BRDC-CITY-002 — Kalastuskylä: ensimmäinen kaupunkivaltio, ja kauppa

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CITY-001, BRDC-TERRAIN-003, BRDC-BUILD-005 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Luodaan tuohon kartalle kaupunkivaltioksi tuo kalastuskylä, millä on pari
vartijaa.. pari vartiotornia ja kauppapaikka .. nämäkin optiot sitten aukeavat kun aukaisee
heksan.. siellä voi käydä kauppaa ja vaihtaa eri resursseja toiseksi."*

Kartalla ei ole ketään. Yhdeksän resurssia, eikä yhtään paikkaa jossa vaihtaa väärää
oikeaan — pelaaja joka on täynnä puuta ja ilman kiveä on jumissa, vaikka kävelisi kuinka.
`BRDC-CITY-001` on kirjoitettu koko Suomen mitassa ja siksi aloittamatta. Tämä on sen
pienin mahdollinen ensimmäinen pala: **yksi kylä, oikeassa paikassa, jonka kanssa voi
käydä kauppaa.**

## 🟢 GREEN

- [ ] **Kalastuskylä `data/`ssa paikkana**, Härmälän oikeilla koordinaateilla — sama muoto
      kuin `questSites.ts`. Muutama heksa, ei yksi: kylä on alue.
- [ ] Kylä näkyy kartalla omana merkkinään, ja **sen heksan avaaminen paljastaa mitä siellä
      on**: vartijat, vartiotornit, kauppapaikka. Ei valikkoa ennen kuin on käyty paikalla.
- [ ] **Kauppapaikka vaihtaa resurssin toiseksi.** Kurssi on puhdas funktio `packages/core`ssa,
      kylän oma ja huono pelaajan kannalta — kauppa on mukavuus, ei tulonlähde. Kurssi
      näkyy ennen vahvistusta.
- [ ] **Kylän maata ei voi vallata.** Se on kaupunkivaltio, ei kilpailija. Yritys kertoo
      miksi ei — ei hiljaista epäonnistumista.
- [ ] Suhde kylään on numero, joka muuttuu kaupankäynnistä. Ei vielä liittoutumia, mutta
      luku on tallessa niitä varten.
- [ ] Testit: kurssi on symmetrinen ja tappiollinen · kylän solu ei vaihda omistajaa ·
      vaihto ei voi viedä pouchia negatiiviseksi.

## Ei tässä

- Muut kaupunkivaltiot, koko Suomi, liittoutumat, sota (`BRDC-CITY-001`, `BRDC-ATLAS-001`).
- Vartijat taistelevina yksikköinä. Ne ovat tässä kuvausta; joukot ovat `BRDC-RAID-001`.
- Kylän vartiotornit pelaajan rakennuksina — `BRDC-BUILD-006`.
