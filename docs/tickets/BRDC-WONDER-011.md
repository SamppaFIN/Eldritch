# BRDC-WONDER-011 — The Dagon Spire

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `data/spellStore.ts`in `survey`, `geo/cells.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään) |
| **Lähde** | `worldseed.ts` (`drowned_spire`), `rules/harmalaWonder.ts`in `dagon-spire` |

## 🔴 RED — mitattu, ei arvattu — todellinen skaalautuvuusongelma, ei arvaus

Dokumentti: *"+8 mana/h realm-wide. Reveals every water hex within 2 km."*
Jälkimmäinen puolisko **ei sovi nykyiseen sumun-paljastus-koneistoon suoraan**:

- Ainoa olemassa oleva "paljasta ilman kävelyä" -verbi on Farsightin `survey()`
  (`spellStore.ts:126`): kirjoittaa jokaiselle säteen sisällä olevalle vielä
  kirjoittamattomalle heksalle tyhjän solun, **yksi `store.get` + `store.set` -pari
  kerrallaan, `await`illa jonossa**. Farsightin oma säde on 2 rengasta (`reach('farsight')`)
  — muutama kymmenen heksaa
- **2 km on ~40 rengasta.** `cellsWithin`in oma kaava (`3n(n+1)+1`) antaa **4 921 heksaa**
  yhdelle paljastukselle. Sama koneisto joka toimii 2 renkaalla ei ole mitattu 40:llä —
  ja `BRDC-SCALE-001`in koko oma tikettinsä oli olemassa juuri siksi että "skannaa kaikki"
  -kuvio kaatui puhelimella paljon pienemmässä mittakaavassa
- Tämä ei ole arvaus vaan suora laskutoimitus samasta kaavasta jota `BRDC-WONDER-002`
  itse käytti sijoituksen mittaamiseen (`scripts/build-hexseed.mjs`)

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+8 mana/h realm-wide**, kun ihme on löydetty — `BRDC-WONDER-003`in oma "Päätös
      Infiniteltä" kysyy juuri tätä (hereillä-ehto vai ei); Dagon Spiren dokumentti sanoo
      nimenomaan "realm-wide" eikä "sen omalla heksalla", joten tämä on yksi konkreettinen
      tapaus jolle se päätös vaikuttaa suoraan
- [ ] **Ennen paljastusosan toteutusta: mittaa, älä arvaa.** `sim/`iin uusi mittaus
      (`BRDC-BUILD-012`in `sim/siege.ts` on malli): kuinka kauan 4 921 solun `survey()`
      kestää oikealla IndexedDB-toteutuksella, ja mikä on todellinen kirjoitusmäärä kun
      vain vesi-maasto suodatetaan (todennäköisesti murto-osa 4 921:stä, koska vesi ei
      ole enemmistö missään realistisessa alueessa)
- [ ] **Jos mittaus näyttää ongelman:** joukkokirjoitus (yksi `store.set` monelle
      avaimelle kerralla, jos `KeyValueStore`-rajapinta sen sallii) ennen kuin ominaisuus
      kytketään päälle — ei toteuteta hiljaa hitaana
- [ ] Testit: mitattu suoritusaika kirjattuna tikettiin (kuten Fortress-piirityksen
      taulukko `BRDC-BUILD-012`issa), ei vain "toimii"

## Päätös Infiniteltä

- Onko 2 km kirjaimellinen, vai onko se dokumentin oma esimerkkiluku jota tässä pelin
  mittakaavassa (Härmälänranta, ei koko Suomi) kannattaisi pienentää? `BRDC-CARD-003`
  teki jo saman päätöksen "NEXT ERA AT 13"in kanssa — mallin luku ei aina ole tarkoitettu
  kirjaimelliseksi tässä koossa

## Ei tässä

- Muiden ihmeiden paljastussäteet — jokainen mitataan erikseen omilla luvuillaan
