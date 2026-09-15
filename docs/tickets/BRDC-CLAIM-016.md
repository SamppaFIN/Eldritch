# BRDC-CLAIM-016 — Valloitusmekaniikan hienosäätö

| | |
|---|---|
| **Alue** | `rules/capture.ts`, `rules/growth.ts`, `rules/constants.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `mitattu` (v0.6.19) — ajo tehty, säätöpäätös Infinitellä |
| **Lähde** | Infinite 2026-09-15: *"todo listalle myös pelin valloitusmekaniikkojen hienosäätäminen"* |

## 🔴 RED

Valloituksen luvut ovat `constants.ts`issa ja ne on **johdettu v2:sta, ei mitattu tässä
pelissä**: `BASE_STRENGTH 100`, `MAX_STRENGTH 500`, `DAY_VISIT_BONUS 25`,
`STREAK_VISIT_BONUS 50`, `NEIGHBOUR_BONUS 15` (katto 90), `ANCHOR_BONUS 200`,
`DECAY_PER_DAY 10` → `25`.

`claude.md` §11 sanoo mitä niiden pitäisi tuottaa: *"Taking someone's established home
block should require two or three separate walks on separate days."* Sitä ei ole
todennettu kävellen.

## Mitä tämä tarvitsee ennen kuin lukuja koskee

**Kenttädataa, ei pöytäarviota.** Sarja on kokonaan mitattavissa `packages/core/sim`illä:
aja kaksi realmia toisiaan vasten sadan päivän ajan ja katso kuinka monta kävelyä
kotikorttelin ottaminen todella vaatii.

Kolme kysymystä joihin luvut vastaavat, ja joihin pitäisi olla vastaus ennen säätöä:

1. **Onko piiritys liian hidas vai liian nopea?** §11 lupaa 2–3 kävelyä; jos se on 6,
   kukaan ei hyökkää, ja jos se on 1, kukaan ei pidä mitään
2. **Palkitseeko rutiini oikein?** `STREAK_VISIT_BONUS` on kaksinkertainen
   `DAY_VISIT_BONUS`iin — onko peräkkäisyys sen arvoista?
3. **Onko rappio rangaistus vai kello?** 48 h armoaika ja kiihtyvä rappio tarkoittavat
   että viikon loma maksaa maata

## 🟢 Ajo tehty — `sim/siege.ts`

`walksToTake()` ajaa oikeita sääntöjä (`resolveCapture`, `projectCell`), ei laskee
vakioita paperilla. Matriisi: 4 tasoa × 3 naapurimäärää × ankkuri × pitääkö puolustaja
ruutuaan. `siege.test.ts` naulaa tulokset.

### Vastaukset kolmeen kysymykseen

**1. Onko piiritys liian hidas vai liian nopea?**
§11:n lupaus **pitää** siinä tapauksessa josta se puhuu — hyökkääjä jonka oma maa
ympäröi ruutua (6 naapuria), puolustaja kävelee ruutuaan: **3 kävelyä**, tasoilla 5–20.
Ilman omaa maata vieressä (0 naapuria) se on **6 kävelyä**. Se ei ole vika: peli on
naapuruuspohjainen, eikä tuntemattoman pidä voida kävellä sisään ja ottaa korttelia.

**2. Palkitseeko rutiini oikein?** Kyllä. Puolustaja joka kävelee ruutunsa joka päivä
nostaa piirityksen 3:sta 6:een (taso 5, 0 naapuria). Rutiini on mitattavasti puolustus.

**3. 🔴 LÖYDÖS: `ANCHOR_BONUS 200` pyyhkii kaikki muut muuttujat.**
Ankkuroitu hyökkäys osuu vähintään 305:llä kun `MAX_STRENGTH` on 500 — **mikä tahansa
ruutu pelissä kaatuu tasan kahdessa kävelyssä**. Taso, naapurit ja se pitääkö puolustaja
ruutuaan lakkaavat kaikki merkitsemästä. Taso 1 ilman omaa maata ottaa maksimivahvan
kotikorttelin yhtä nopeasti kuin taso 20 kuudella naapurilla.

§11 varoittaa itse: *"Do not 'simplify' this back to a single comparison."* Arvolla 200
ankkuri **on** se yksi vertailu.

### Suositus — ei toteutettu, koska tämä on makupäätös

`ANCHOR_BONUS` 200 → **90**, sama katto kuin naapuribonuksella. Silloin ankkuri on vahvin
yksittäinen etu muttei ohita muita: taso 5 / 6 naapuria / ankkuri = 305/kävely = 2
kävelyä, kun taso 1 / 0 naapuria / ankkuri = 195 = 3 kävelyä. Ero säilyy.

**Vakioita ei muutettu.** Tiketin oma sääntö oli "ei säätöä ilman ajoa"; ajo on nyt
tehty, ja luku on Infiniten päätettävä koska se on tuntuma-asia. `siege.test.ts` kaatuu
heti kun joku koskee vakioon, ja kertoo mitä se liikutti.

## Ei tässä

- Yksittäisten vakioiden muuttaminen ilman ajoa. Ne ovat tasapainossa keskenään:
  `NEIGHBOUR_BONUS`in nosto muuttaa myös puolustusta, koska sama luku on molemmilla
  puolilla
