# BRDC-QUEST-005 — Tarina pysyy siellä minne sitä käveltiin

| | |
|---|---|
| **Alue** | `data/questSites.ts`, `features/map/useBoot.ts` |
| **Status** | `done` — hotfix 2026-09-15 (v0.6.13) |
| **Lähde** | Infinite 2026-09-15: *"quest pisteet onkin kartalla eri paikoissa… kartta on pysynyt paikallaan. Mutta eri quest paikat on nyt siirtyneet."* |

## 🔴 RED

Kaksi oiretta, **yksi syy**.

1. Tarinan paikat olivat siirtyneet, vaikka kartta ei ollut.
2. Questia pystyi edistämään väärässä paikassa, vaikka sitä paikkaa ei ollut löydetty.

`siteCell(id)` **laski paikan uudelleen joka kutsulla** ankkurista, suunnasta ja
matkasta. Ankkuri on linnan keskipiste, ja linna uudelleensijoitetaan aina kun Hearth
uudelleensijoitetaan (`claude.md` §10). Ankkurin liikahdus liikutti koko tarinaa — ja
heksarajan lähellä oleva paikka tarvitsee vain muutaman metrin vaihtaakseen heksaa.

Sama laskenta selittää oireen 2. Portti on olemassa ja se toimii
(`AdventureDialog`: `disabled={c.locked || !onHex}`, `atStageHex`:
`siteCell(site) === standingOn`) — mutta se vertaa **liikkuvaan** heksaan. Kun paikka
liukui pelaajan alle, portti aukesi siellä missä pelaaja sattui olemaan.

## 🟢 GREEN

- [x] Paikat kiinnitetään heksoihin kerran: `pinQuestCells`, `resolveQuestCells`, ja
      `siteCell` joka suosii kiinnitystä
- [x] Kiinnitys talletetaan bootissa avaimeen `quest-cells` — sama pieni tallennus jota
      `last-collect` käyttää; seitsemän h3-merkkijonoa ei ole IndexedDB:n asia
- [x] Kiinnitetään vain kun linna on olemassa; ilman sitä peli ei vielä tiedä missä
      tarina on
- [x] Portti: `lint:lines`, `tsc -b`, 1388 vitest, `pnpm build`

## Todennus

`questPin.test.ts`, kolme testiä. Ensimmäinen **toistaa bugin**: kiinnittämättä
`siteCell('statue')` vaihtuu kun ankkuri vaihtuu. Toinen todistaa korjauksen — kiinnitetty
paikka ei liiku vaikka ankkuri vietäisiin Helsinkiin tai nollattaisiin. Kolmas vaatii että
jokainen paikka kiinnittyy, ei vain se mistä tarina alkaa.

## ⚠️ Mitä tämä ei tee

Se **ei siirrä jo siirtyneitä paikkoja takaisin**. Ensimmäinen boot kiinnittää ne sinne
missä ne nyt ovat. Jos ne ovat tälle pelaajalle väärässä paikassa, `quest-cells` pitää
tyhjentää, jolloin ne kiinnittyvät uudelleen nykyisestä linnasta. Peli ei voi tietää mikä
niistä oli "oikea".
