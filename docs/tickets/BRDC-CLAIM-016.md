# BRDC-CLAIM-016 — Valloitusmekaniikan hienosäätö

| | |
|---|---|
| **Alue** | `rules/capture.ts`, `rules/growth.ts`, `rules/constants.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `todo` — kirjattu, odottaa kenttädataa |
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

## Ei tässä

- Yksittäisten vakioiden muuttaminen ilman ajoa. Ne ovat tasapainossa keskenään:
  `NEIGHBOUR_BONUS`in nosto muuttaa myös puolustusta, koska sama luku on molemmilla
  puolilla
