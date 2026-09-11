# BRDC-QUEST-004 — Seikkailu oli naulattu Pyynikkiin

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-QUEST-001 (Fuming Lake), BRDC-HEARTH-002 (Hearth) |
| **Status** | `done` — 2026-09-11 (v0.5.68) |
| **Valmius** | 100 % — portti vihreä, e2e todennettu vikaa vastaan |
| **Lähde** | Infinite 2026-09-10: *"koitin käydä seikkailua läpi, mutta en saanut mitään tarina dialogia.. se toimi jo joskus."* |

## 🔴 RED

**Koodi toimi. Tarina oli väärässä kaupungissa.**

Ajoin dialogin läpi ja se on ehjä: kertoja, tarina, kaksi valintaa. Mutta jokainen
kohtaus oli kovakoodattu koordinaatti noin 400 metrin alueella Härmälässä:

```
statue 61.4729, 23.7259 · lake 61.4753, 23.7280 · hermit 61.4731, 23.7326
troll  61.4766, 23.7306 · deep 61.4778, 23.7272
```

Ja tarinan **aloittaminen tarkoittaa patsaan päällä seisomista** (`useFumingLake`:
`h3 === siteCell('statue') && h3 === standingOn`). Eli kuka tahansa joka asuu muualla ei
voinut aloittaa sitä koskaan. *"Toimi jo joskus"* = se testattiin silloin Pyynikin lähellä.

Tämä on sama muoto kuin `seed.ts`:n oma kommentti varoittaa generoidusta sisällöstä:
*"never hard-coded — the game has to work in Tampere, in Turku, and on a test rig in a
different hemisphere."* Sääntö oli kirjoitettu ylös; sisältö ei noudattanut sitä.

## 🟢 GREEN

- [x] **Taulukko on nyt *muoto*, ei osoite.** `QUEST_SITES` säilyy sellaisenaan, koska
      patsaan, järven, erakon ja sillan väliset suunnat ja etäisyydet ovat käsin tehty
      kävely ja sen säilyttäminen tarkalleen on koko pointti.
- [x] **`SHAPE` johdetaan taulukosta**, ei kirjoiteta kahdesti: suunta ja etäisyys
      patsaasta jokaiseen kohtaukseen. Koordinaatin muuttaminen siirtää muotoa mukana —
      ne eivät voi ajautua erilleen.
- [x] **`anchorQuestSites(home)`** siirtää muodon pelaajan Hearthille. Moduulitason
      ankkuri eikä parametri yhdentoista kutsupaikan läpi — **sama kuvio jota
      `enableTerrainSurvey` jo käyttää**, ja samasta syystä: se on yksi maailmaa koskeva
      tosiasia, asetettu kerran, josta melkein mikään ei halua puhua.
- [x] **Ankkuroimattomana se pysyy siellä minne se kirjoitettiin.** Härmälässä pelaava
      saa saman tarinan kuin ennen.
- [x] Kartan merkit piirtyvät sinne missä tarinaa kävellään; **nimi tulee taulukosta,
      sijainti ankkurista.**
- [x] Ankkuri asetetaan `useBoot`issa kun Keep on tiedossa.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1167**) + `pnpm build` vihreä.
- [x] `questAnchor.test.ts` (7): ankkuroimaton on muuttumaton · **patsas asettuu
      ankkurin päälle, joten tarinan voi ylipäätään aloittaa** · jokainen suunta ja
      etäisyys patsaasta säilyy · **myös kohtausten väliset etäisyydet säilyvät**, ei
      pelkästään etäisyys patsaasta · toimii eteläisellä pallonpuoliskolla, mikä on koko
      pointti · jokainen kohtaus saa oman heksansa eikä yksikään romahda toisen päälle ·
      ankkurin poisto palauttaa alkuperäiseen.
- [x] e2e `adventure.spec.ts` — **ajetaan Helsingistä**, siis sieltä missä vanhalla
      buildilla ei ollut mitään: *"The tale starts here."*, nappi, ja dialogi jossa on
      kertoja, propelli ja valinta.
- [x] **Todennettu että testi nappaa vian:** ankkuri poistettiin väliaikaisesti,
      `pnpm build`, ja testi **kaatui**. Palautettiin, ja se menee läpi.
- [ ] Kenttä: aloita tarina omalta kotiruudultasi. *(Infinite ajaa.)*

## Päätös jonka tein puolestasi

Kysyin kahdesti ankkuroidaanko tarina vai jätetäänkö se Tampere-sisällöksi, enkä saanut
vastausta — ja *"jatka"*. Valitsin ankkuroinnin, koska vaihtoehto on että peli kantaa
sisältöä jota yksikään pelaaja Pyynikin ulkopuolella ei voi nähdä, ja se on huonompi
oletus kuin muodon siirtäminen.

**Se on yhden rivin päässä peruttavissa** (`anchorQuestSites(null)`), ja kentällä
kerrottavissa: jos tarina tuntuu väärältä sinun naapurustossasi — järvi kuivalla maalla,
silta ilman puroa — se on sen kertomisen arvoista, ja vastaus on kartta­editori (PIVOT §8)
joka sijoittaa kohtaukset oikeille paikoille.

## Ei tässä

- **Maaston sovittaminen ankkuroituun tarinaan.** Härmälässä järvi on järvellä, koska
  `terrainSeed.ts` asettaa sen. Muualla "The Fuming Lake" voi osua asfaltille. Se on
  karttaeditorin työtä, ei tämän.
- **Useampi seikkailu**, tai saman tarinan useampi esiintymä yhdellä kartalla. Ankkuri on
  yksi; kun tarinoita on kaksi, siitä tulee tarinakohtainen.
- **Salaisten kohtausten (`SECRET_SITES`) uudelleensijoittelu.** Ne liikkuvat samalla
  muodolla — ne ovat samassa taulukossa — joten ne toimivat, mutta niiden löytäminen
  kävelemällä on kenttäkysymys johon en ole vastannut.
