# BRDC-TERRAIN-005 — Seitsemän maastolajia Worldseedin mukaan

| | |
|---|---|
| **Alue** | `rules/terrain.ts` (`TerrainKind`, `TERRAIN_TABLE`), `terrainSprites.ts`, `data/mapData.ts` (maalatut), `tokens.css`, `rules/bounty.ts`, `rules/wonder.ts`, editori |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `todo` — päätös D3 ensin (`BRDC-SEED-000`) |
| **Riippuvuudet** | `BRDC-SEED-000` |
| **Lähde** | `Eldritch-pelin uusi design systeemi/handoff/worldseed.ts` (`TERRAIN_RULES`), Worldseed-dokumentti §02 *Terrain law* |

## 🔴 RED

Pelin maastolajit (`rules/terrain.ts:80-90`): **plain, forest, hill, mountain, lake, coast, market**.
Worldseedin maastolajit: **water, marsh, forest, hill, trade, settlement, plain**.

| Nyt | Worldseed | Huom |
|---|---|---|
| lake, coast | **water** | ranta muuttuu lipuksi (`shoreline`), ei omaksi maastoksi |
| mountain | *(poistuu)* | hill tulee korkeuserosta (≥ 8 m), ei tageista |
| market | **trade** | nimi ja tagit muuttuvat |
| — | **marsh** | uusi: turve, järvimalmi, virvatuli, Sunken Bell |
| — | **settlement** | uusi: *"the first terrain where people, not ground, are the resource"* — kultaa ja kulttuuria, Tavernan paikka |

Maastolaji ei ole vain väri. Se päättää **resurssin** (`TERRAIN_TABLE`), **rakennuspaikat**,
**bonusresurssien** ja **ihmeiden** maastolistat, **laatan** (7 kuvaa) — ja se on
**tallessa**: `Cell.terrain` (`BRDC-TERRAIN-002`) ja maalattujen karttojen `t`-kenttä
(`MapDrawing`). Vanha tallennus lukee maastoja joita ei enää ole.

Worldseed-dokumentti määrittelee maastojen värit (`--t-water`, `--t-marsh`, `--t-forest`,
`--t-hill`, `--t-trade`, `--t-settle`, `--t-plain`, OKLCH). **`tokens.css`issa niitä ei ole.**
Sigil-dokumentissa on laatat `tWater`, `tMarsh`, `tWood`, `tHill`, `tTrade`, `tPlain` —
**settlementille ei ole laattaa kummassakaan dokumentissa.**

## 🟢 GREEN

- [ ] `TerrainKind` on Worldseedin seitsemän. Vanhoista uusiin **yksi funktio**
      (`lake|coast → water`, `mountain → hill`, `market → trade`), jota migraatio ja luku käyttävät
- [ ] **Vanha tallennus luetaan, ei pyyhitä** (§17): tallennettu `Cell.terrain` ja maalatut kartat
      muunnetaan lukuhetkellä. Testi: v-edellisen tallennuksen solu lukee uuden lajin
- [ ] `TERRAIN_TABLE` uusille lajeille: resurssi ja rakennuspaikat. **Settlementin kaksi tuottoa**
      (kulta + kulttuuri) eivät mahdu nykyiseen *yksi resurssi per maasto* -malliin → päätös
- [ ] `--t-*`-tokenit `tokens.css`iin dokumentin arvoilla, ja kartan literaalitaulu niiden
      rinnalle kuten `MAP_RESOURCE_COLOUR`
- [ ] Laatat: marsh Sigilin `tMarsh`ista; **settlement piirretään** (ei mallia)
- [ ] Bonusresurssien, ihmeiden ja rakennusten maastolistat päivitetty; editorin paletti
- [ ] Typecheck todistaa ettei mikään viittaa poistettuun lajiin

## Päätös Infiniteltä

**D3** (`BRDC-SEED-000`): otetaanko Worldseedin maastot pelin maastoiksi (suositus: **kyllä** —
siemen luokittelee niillä, ja kahden sanaston välinen käännös olisi pysyvä virhelähde) vai
käännetäänkö Worldseedin lajit nykyisille?

## Ei tässä

- Luokittelu OSM:stä ja vyöhykkeet — `BRDC-SEED-003`
- Korkeusmalli (DEM) mäille — päätös D10
