# BRDC-TUTOR-001 — Asteittainen opetus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-REVEAL-001, BRDC-WIKI-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §3 |

## 🔴 RED

`FirstLook.tsx` opettaa ensimmäisen hetken ja sitten vaikenee. Kun tähän suunnitelmaan
tulee kymmenen resurssia, kuusitoista rakennusta, teknologiapuu, neljä loitsukoulukuntaa,
kaupunkivaltiot ja kaksitoista ihmettä, **vaikeneminen on sama kuin ei julkaisisi peliä**.

Ja tämä on ulkopeli: opetus luetaan kävellessä, kirkkaassa valossa, yhdellä peukalolla.
Kaikkea ei voi kertoa alussa, koska alussa ollaan menossa ulos.

## 🟢 GREEN

- [ ] Mekaniikat avautuvat **suunnitelman §3 taulukon mukaan**: 1. heksa → resurssit,
      3. heksa → rakentaminen, 5. heksa → temppeli ja mana, 10. heksa → kaupunkivaltiot,
      suljettu reitti → saartaminen, ensimmäinen loitsu → taikuus
- [ ] Avautuminen on **tapahtuma**, ei ilmoitus: pyhä geometria, sanat, hetki
- [ ] **Pieni palkinto kokeilusta** — suunnitelman oma ehdotus, ja se on hyvä:
      opetus, joka maksaa jotain, luetaan
- [ ] Opetus **linkittää wikiin** eikä toista sen sisältöä (`BRDC-WIKI-001`)
- [ ] Kaiken voi **ohittaa**, ja ohitettuun pääsee takaisin wikin kautta
- [ ] Opetus **ei koskaan keskeytä kävelyä**: se odottaa pysähdystä tai sulkeutuu itse
- [ ] Edistyminen on `es3:*`-tilaa ja häviää resetissä
- [ ] Kynnyslogiikka on puhdas funktio, testattu ilman selainta — kuten
      `FirstLook.test.ts` jo tekee

## Toteutus

**Kynnykset lasketaan tilasta, ei tapahtumista.** "Kolmas heksa" on kysymys, jonka
`getOwnedCells().length` vastaa milloin tahansa; tapahtumapohjainen laskuri hukkaa
tilanteen, jossa kolme heksaa tuli yhdessä lenkissä. Tämä on sama juurisyy kuin
`BRDC-REGRESSION-000` #3:ssa (v2:n boot-race) — johdettu tila kestää, emittoitu ei.

Suunnitelma lupaa *"lyhyt, tyylikäs opetusvideo/kuva"*. **Videoita ei tehdä.**
`claude.md` §12 antaa paremman ja halvemman keinon: pyhä geometria SVG:nä,
animoituna `stroke-dasharray`illa. Se on kevyt, terävä joka koossa ja jo tyyliä.

## Ei tässä

- Wikin sisältö → `BRDC-WIKI-001`
- Automaattinen wikin päivitys avautumisesta. Se on wikin puoli samaa saumaa
