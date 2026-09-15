# BRDC-RES-002 — Resurssien ja rakennelmien kuvat designin symboleista

| | |
|---|---|
| **Alue** | `bountySprites.ts`, `buildingSprites.ts`, `placeSprites.ts`, `terrainSprites.ts`, `spriteRaster.ts`, `territoryMarks.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-RES-001`, `BRDC-TERRAIN-005` |
| **Lähde** | `Eldritch-Worldseed.html` (21 `<symbol>`), `Eldritch-Sigil.html` §03 (47 `<symbol>`), Sigil §03 *Bonus resources* |

## 🔴 RED

Infinite: *"katso että kaikki resurssit on toteutettu"*.

**Dokumenteissa on kuva jokaiselle** `worldseed.ts`:n nimeämälle spritelle — tarkistettu: 39/39
löytyy jommastakummasta HTML:stä `<symbol>`ina (28 bonusresurssia, 11 rakennelmaa, laatat,
jalustat).

**Pelissä** on omat proseduraaliset versiot: 10 löytöä, 15 Työtä, 2 paikkaa, 7 maastolaattaa.
**Puuttuu:** 18 bonusresurssin kuvaa, `forge`, `tower`, `tavern`, `landmark`, `wonder`, sekä
maastolaatat `marsh` ja `settlement` (settlementille ei ole mallia missään).

Dokumentin `resGroups`-taulukossa on **väliaikaisia kuvaviittauksia**: Ley Crystal → `#rWisp`,
Ancient Oak → `#rOrchard`, Wheat → `#rStall`, Horses → `#rCaravan`, Iron Ore → `#rScrap`.
`worldseed.ts`:ssä viittaukset ovat oikein, ja kuvat löytyvät.

Sigil §03 määrää lisäksi kolme sääntöä joita peli ei vielä kokonaan tee:

1. Resurssi seisoo **vasemmassa alakulmassa**, rakennelma omistaa keskustan
2. **Alle 14 px** kuva muuttuu tummaksi kiekoksi resurssin värisellä reunalla oikeaan yläkärkeen
3. **Tutkimaton maa** näyttää harmaan ääriviivakiekon ilman kuvaa — *"the map admits it does not know"*

## 🟢 GREEN

- [ ] Kaikki 28 bonusresurssia ja `forge` / `tower` / `tavern` / `landmark` / `wonder` piirretään
      dokumenttien `<symbol>`-polkudatasta samaan rasterointiputkeen (`spriteRaster`, pixelRatio 2,
      `watchRemoval`-vahti)
- [ ] Kuva-id:t `worldseed.ts`:stä, **ei** `resGroups`in väliaikaisista
- [ ] Harmaa **"?"-kiekko** kun heksan luokittelun `confidence < 0.5` tai heksaa ei ole tutkittu
- [ ] **Ihme maamerkin päällä:** maamerkki piirretään halona ihmeen ympärille, ei toisena merkkinä
      (Worldseed §04)
- [ ] Settlement-laatta piirretty ja hyväksytetty
- [ ] Katselmointi: kaikki kuvat yhdelle arkille renderöitynä + kartalla zoomeilla 16/17/19

## Ei tässä

- Resurssien data ja tuotot — `BRDC-RES-001`
