# BRDC-WONDER-008 — The Dunwich Grove

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `rules/decay.ts`, kutsujat (`MockRepository`, `walkFlow`, `stepStore`) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään) |
| **Lähde** | `worldseed.ts` (`whispering_grove`), `rules/harmalaWonder.ts`in `dunwich-grove` |

## 🔴 RED — mitattu, ei arvattu

Dokumentti: *"+6 timber/h, +4 food/h. Forest cells you hold never decay below 200."*
Jälkimmäinen puolisko on **uusi rappiosääntö**, ei kertautuvasti nykyisiin sopiva:

- `projectCell` (`decay.ts:45`) tuntee tänään kaksi tapaa välttää rappio kokonaan
  (`home`, `underFortress` — molemmat *"return cell"*, ei rappiota lainkaan) ja yhden
  tavan hidastaa sitä (`loyalty`-kerroin, `BRDC-BUILD-003`). **Ei ole olemassa kolmatta
  muotoa: "rapistuu, mutta ei koskaan tietyn lattian alle."** Nykyinen polku on
  `if (strength <= 0) return null` — heksa vapautuu kokonaan, ei jää lattialle
- `projectCell` ei tänään saa maastotietoa parametrina ollenkaan — se ei tiedä onko
  solu metsää. Kutsuja laskisi tämän saman tavan kuin `underFortress`in jo laskee
  (`fortified(known, h3)`, `BRDC-CARD-001`)

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+6 timber/h, +4 food/h**, kun ihme on löydetty ja hereillä (`BRDC-WONDER-003`in
      `wonderBonus`)
- [ ] `projectCell`iin uusi valinnainen parametri, esim. `decayFloor?: number` — kun
      annettu, `if (strength <= 0) return null` korvautuu `strength <= decayFloor`
      -tapauksessa `{...cell, strength: decayFloor}`:lla sen sijaan että solu vapautuu.
      Kutsuja päättää arvon (`200` kun kaikki kolme pätee: `terrainForCell(cell).kind
      === 'forest'`, omistaja on löytänyt Dunwich Groven, `undefined` muuten) — sama
      "kutsuja laskee, sääntö vain lukee" -kuvio kuin `underFortress`illa jo on
- [ ] Testit: metsäsolu joka rapistuisi nollaan pysähtyy 200:aan eikä koskaan vapaudu;
      ei-metsäsolu samalla omistajalla rapistuu normaalisti; metsäsolu ilman ihmettä
      rapistuu normaalisti

## Päätös Infiniteltä

- **Voiko 200:aan pysähtynyt metsäsolu silti menettää omistajan piirityksessä
  (`resolveCapture`)?** Lattia on nimenomaan rappio-lattia dokumentin sanamuodossa
  ("never decay"), ei "never lost" kuten Linnoituksella — jos vastaus on "kyllä, piiritys
  toimii silti", tämä on selvästi heikompi suoja kuin Linnoitus eikä siitä pidä antaa
  väärää kuvaa kortilla
- Onko 200 kiinteä kaikilla vai suhteessa `MAX_STRENGTH`iin (500) — 40%?

## Ei tässä

- Muun maaston lattiat — dokumentti nimeää vain metsän
