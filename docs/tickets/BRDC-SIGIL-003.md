# BRDC-SIGIL-003 — Löydöt kartalle, paljastuksen jälkeen

| | |
|---|---|
| **Alue** | `features/territory/bountySprites.ts`, `territoryMarks.ts`, `territoryFeatures.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | done — 2026-09-14 (v0.5.85) |
| **Edeltäjä** | BRDC-SIGIL-001, BRDC-SIGIL-002, BRDC-BOUNTY-001 |

## 🔴 RED

Design-dokumentti piirtäisi bonusresurssit kartalle esineinä. `BRDC-BOUNTY-001` on
tarkoituksella eri mieltä: *"Found, not given"* — bounty näkyy vasta paljastuksen
jälkeen, ja tähän asti vain ruutukortissa ja maakirjassa, ei kartalla lainkaan.

Ratkaisu (Infiniten valinta kolmesta vaihtoehdosta): **kartalle, mutta vasta paljastuksen
jälkeen. Ei kysymysmerkkiä paljastamattomalle maalle.** Mekaniikka pysyy koskemattomana;
löytö vain näkyy nyt myös siellä missä se on.

## 🟢 GREEN

- [x] **Kymmenen bounty-ikonia** — vehnäkimppu, karja, peura, turkikset, jalokivet,
      marmori, kala, meripihka, mauste, graniitti. `Record<BountyId, string>` pakottaa
      kääntäjän kieltäytymästä jos uusi bounty joskus jää ikonitta
- [x] **Ei yhden sävyn pakkoa.** Värilaki koskee tekstiä ja lukuja; dokumentin omat
      esimerkit (vehnä = vihreä varsi + kultainen jyvä) ovat monisävyisiä. Kussakin
      ikonissa sama pieni varjoellipsi pohjalla, kuten dokumentin omat merkit
- [x] **Portti tarkasti siellä missä pitääkin:** `bounty`-ominaisuus on tyhjä ellei solu
      ole **sekä minun että paljastettu** — `bountyOn` itsessään ei tiedä paljastuksesta
      mitään ja vastaisi mielellään paljastamattomallekin heksalle, joten portti on
      pakko olla `cellProperties`issa. Viisi testiä, joista yksi todennettu palauttamalla
      vuoto: kolme kaatuu jos portti poistetaan
- [x] Sijoitus vastapäätä rakennusglyyfiä (joka on siirretty alas), niin ettei vehnäpelto
      farmilla peitä toista — dokumentin oma periaate: rakenne keskellä, resurssi vieressä
- [x] Piilossa kunnes spritet ovat oikeasti atlaksessa, sama kuriosuus kuin maastolla
- [x] Portti: 1343 vitest, desktop `sigil` 2/2 kuormassa `lands`+`map`+`opening`in kanssa
      (31/31), `pnpm build`, `check-line-limit`

## Ratkaistu kentällä: kuinka löytää bounty testissä ilman kävelyä

`BRDC-CLAIM-014` tekee pitkästä peräkkäisten askelvaltausten ketjusta epäluotettavan
muutaman jalan jälkeen. Bountyn löytäminen kävelemällä olisi nojannut siihen samaan
vikaan. Ratkaisu: sama IndexedDB-kirjoitus jota `lands.spec.ts` jo käyttää samasta syystä
— vallataan ja paljastetaan leveä rengas suoraan tietokantaan, ei kävelemällä.

## Jaot joita tämä vaati

`TerritoryLayer.ts` osui kattoon toisen kerran samana päivänä. Symbolikerrokset (maasto,
glyyfi, rakennus, bounty, maamerkki, lippu, anomalia — kolmetoista lähes identtistä
`addLayer`-kutsua) siirrettiin omaan `territoryMarks.ts`iinsa. `CELL_DETAIL_MINZOOM`
siirtyi `layerIds.ts`iin, koska muuten syntyisi tuontisykli.

## Ei tässä

- Kysymysmerkki paljastamattomalle maalle — hylätty vaihtoehto, ks. Infiniten valinta.
