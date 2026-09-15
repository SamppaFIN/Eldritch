# BRDC-SEED-003 — Vyöhykkeiden jako heksoiksi: maasto, bonusresurssit, ihmeet

| | |
|---|---|
| **Alue** | uusi `packages/core/src/data/worldseedPartition.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-SEED-001`, `BRDC-TERRAIN-005` |
| **Lähde** | `worldseed.ts` (`classify`, `populate`/`partition`+`allocate`, `place`), Worldseed §03 |

## 🔴 RED

`worldseed.ts`in putki (`survey → classify → populate/partition+allocate → place → freeze`)
on kirjoitettu axial `q:r`-ruudukolle 25 m circumradiuksella. Peli käyttää H3 res-11:tä
(~1622 m² lat 61:llä). Kumpaakaan ruudukkoa ei ole käännetty toisiksi missään — tämä on koko
"luodaan heksa gridi worldseedin mukaan" -pyynnön ydin.

Lisäksi jako on **alueellinen, ei heksakohtainen**: yhtenäinen saman maaston rypäs pilkotaan
7–55 heksan alueiksi, ja jokainen alue saa 1–3 bonusresurssiesiintymää (~5 % heksoista) —
tämä poikkeaa pelin nykyisestä per-heksa-hajautuksesta (`BOUNTY_SHARE`) täysin, ja on syy
miksi `BRDC-RES-001` ei voi vain lukea vanhaa hajautusfunktiota.

## 🟢 GREEN

- [ ] **Ruudukon käännös:** dokumentin axial `q:r` -keskipisteet muunnetaan `latLngToH3`illa
      res-11:een (käännetyn ankkurin koordinaatistossa, `BRDC-SEED-001`). Yksi solu voi saada
      nolla tai useamman axial-ruudun keskipisteen — enemmistöäänestys tai pinta-alapainotus
      päättää, kumpi maasto/data voittaa; testattu molemmilla ääripäillä
- [ ] `classify`: OSM-tagit ja `TERRAIN_RULES` tuottavat maastolajin per H3-solu, sisältäen
      `confidence`-arvon (`BRDC-CARD-001`in "?" -kiekkoa varten)
- [ ] `partition`: samaa maastoa olevat vierekkäiset solut ryhmitellään 7–55 solun alueiksi
      (H3-naapuruus, ei axial). Testi: tunnettu fixture-alue tuottaa alueen kokoluokan sisällä
- [ ] `allocate`: jokainen alue saa 1–3 bonusresurssiesiintymää yhdelle solulleen,
      maastoaffiniteetin ja harvinaisuuden mukaan painotettuna (`BRDC-RES-001`)
- [ ] Ihmekandidaatit (`BRDC-WONDER-002`): `require`-predikaatti suodattaa solut,
      `prefer`-painotus valitsee parhaan — sama koneisto kuin `allocate`, eri syöte
- [ ] `expectedCounts`-tyyppinen build-aikainen assertio: tiheydet, aluekoot ja
      ihmemäärä (9, `BRDC-SEED-000` D5) tarkistetaan joka buildissa, epäonnistuu äänekkäästi
- [ ] Yksikkötestit `seed.harmala.json`in käännetyllä datalla — ei live-verkkoa

## Ei tässä

- Maastolajien nimet ja värit — `BRDC-TERRAIN-005`
- Bonusresurssien data ja kuvat — `BRDC-RES-001`, `BRDC-RES-002`
- Lopullinen `HexSeed`-kokoonpano ja tallennus — `BRDC-SEED-004`
