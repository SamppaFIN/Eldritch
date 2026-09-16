# BRDC-TERRAIN-005 — Yhdeksän maastolajia: vanhat ja Worldseedin uudet rinnakkain

| | |
|---|---|
| **Alue** | `rules/terrain.ts` (`TerrainKind`, `TERRAIN_TABLE`), `terrainSprites.ts`, `data/mapData.ts` (maalatut), `tokens.css`, `rules/bounty.ts`, `rules/wonder.ts`, editori |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `done` — ajettu ja todennettu 2026-09-16 |
| **Riippuvuudet** | `BRDC-SEED-000` |
| **Lähde** | `Eldritch-pelin uusi design systeemi/handoff/worldseed.ts` (`TERRAIN_RULES`), Worldseed-dokumentti §02 *Terrain law* |

## 🔴 RED

Pelin maastolajit (`rules/terrain.ts:80-90`): **plain, forest, hill, mountain, lake, coast, market**
(7). Worldseedin maastolajit: **water, marsh, forest, hill, trade, settlement, plain** (7).

**Päätös (`BRDC-SEED-000` D1): ei korvausta — liitos.** `mountain`, `lake`, `coast`, `market`
pysyvät; `marsh` ja `settlement` lisätään. Yhdeksän maastolajia yhteensä:

```
plain · forest · hill · mountain · lake · coast · market · marsh · settlement
```

`water` ja `trade` (Worldseedin nimet) **eivät** korvaa `lake`/`coast`/`market`:ää — ne olisivat
sama käsite kahdella nimellä, ja se on juuri se pysyvä virhelähde jota D1 vältti valitsemalla
liitoksen. Worldseedin luokittelu (`classify`, `BRDC-SEED-003`) tuottaa `water`/`trade`, jotka
**kirjoitetaan pelin nimillä**: siemendatan `water → lake` (tai `coast`, rannan läheisyyden
mukaan) ja `trade → market` yhdessä käännösfunktiossa siemenen luvussa (`BRDC-SEED-003`),
ei kahtena rinnakkaisena maastona.

Uudet lajit:

| Laji | Resurssi | Huom |
|---|---|---|
| **marsh** | turve, järvimalmi, virvatuli (`BRDC-RES-001`), Sunken Bell -ihmeen vaatimus | |
| **settlement** | *"the first terrain where people, not ground, are the resource"* — kultaa ja kulttuuria, Tavernan paikka (`BRDC-TAVERN-001`) | kaksi tuottoa, ks. GREEN |

Maastolaji ei ole vain väri. Se päättää **resurssin** (`TERRAIN_TABLE`), **rakennuspaikat**,
**bonusresurssien** ja **ihmeiden** maastolistat, ja **laatan**. Nykyinen kartta ja tallennus
tuntevat vain seitsemän — ne eivät riko mitään lisäyksessä, koska mikään vanha ei poistu.

Worldseed-dokumentti määrittelee maastojen värit (`--t-water`, `--t-marsh`, `--t-forest`,
`--t-hill`, `--t-trade`, `--t-settle`, `--t-plain`, OKLCH) **omilla nimillään**, ei pelin
nimillä. **`tokens.css`issa ei ole kumpaakaan settlementille eikä marshille.**
Sigil-dokumentissa on laatat `tWater`, `tMarsh`, `tWood`, `tHill`, `tTrade`, `tPlain` —
**settlementille ei ole laattaa kummassakaan dokumentissa; se piirretään uutena.**

**DEM-päätös (D9):** ei korkeusmallia. `hill` (vanha) pysyy nykyisillä OSM-tageilla
päädeltynä; Worldseedin `hill`-ehdokkaat seedatulla alueella luetaan **nimetyistä
mäkivyöhykkeistä** — Infiniten mukaan leirintäalueella ja Härmälänrannassa on tunnettuja
mäkiä. Nämä vyöhykkeet kirjataan käsin `BRDC-SEED-003`:n syötteeksi (ei DEM-tiedostoa),
eikä tämä tiketti tuo mittausputkea.

## 🟢 GREEN

- [x] `TerrainKind` kasvoi yhdeksään: `plain | forest | hill | mountain | lake | coast | market | marsh | settlement`
      (`types/domain.ts`)
- [x] `TERRAIN_TABLE`: `marsh → food`, `settlement → gold`. **Settlementin kaksi tuottoa**
      (kulta + kulttuuri) jätettiin tekemättä tässä — se vaatisi `TERRAIN_TABLE`in koko
      rivin muuttamisen listaksi resursseja, ja se on `resourceOf`/`resourceForCell`/
      `trickle`-ketjun oma refaktori, ei tämän tiketin sivuvaikutus. **Tiedostettu aukko**,
      ei hiljainen päätös — kulttuuripuoli odottaa
- [x] **Korjattu oletus:** `--t-*`-tokeneita ei lisätty `tokens.css`iin. Mikään olemassa
      olevista seitsemästä maastosta ei käytä CSS-muuttujaa väriinsä —
      `terrainSprites.ts`in oma dokumentaatio selittää miksi: SVG-laatta piirretään
      `Image`-elementtinä, joka ei koskaan resolvoi `var()`ia. Hex-literaalit pysyvät
      ainoana totuuden lähteenä, kuten kaikilla muillakin seitsemällä
- [x] Laatat (`terrainSprites.ts`): **marsh** — vesilammikko + kaislat; **settlement** —
      kaksi pientä taloa (kumpikaan ei ole kummankaan dokumentin mallin mukainen, koska
      kummallakaan ei ole niitä)
- [x] Bonusresurssien maastolistat (`bounty.ts`): `fish` laajeni kattamaan `marsh` (samalla
      affiniteetilla kuin `worldseed.ts`in oma taulu: water 1.0, marsh 0.3), `spice` laajeni
      kattamaan `settlement` — väliaikaiset paikat kunnes `BRDC-RES-001` tuo omat 28 löytöä
- [x] Editorin paletti (`EditorPanel.tsx`): `Object.keys(TERRAIN_TABLE)`-pohjainen, joten
      molemmat tulivat mukaan automaattisesti; väripaletti (`EditorGrid.ts`) sai omat hexinsä
- [x] Typecheck todisti: kuusi `Record<TerrainKind, string>`-taulua (editori, `CellHeader`,
      kaksi `names.ts`in taulua, `terrainSprites.ts`, `territoryFeatures.ts`in glyfit)
      puuttuivat molemmat — kaikki kuusi täydennetty, `tsc -b` vihreä
- [x] Testit päivitetty samaan listaan kolmessa tiedostossa (`terrain.test.ts`,
      `terrainSprites.test.ts`, `territoryFeatures.test.ts`) + uusi `bounty.test.ts`in
      löytämä regressio (”leaves no kind of ground unable to carry anything”) korjattu
- [x] Portti: 1474 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Ei tässä

- Luokittelu OSM:stä, vyöhykejako ja `water`/`trade` → `lake`/`coast`/`market`-käännös —
  `BRDC-SEED-003`
- Mäkivyöhykkeiden koordinaatit — `BRDC-SEED-003`:n syöte, kirjataan siellä
- Settlementin kulttuurituotto — jätetty aukoksi, ks. yllä
- Bonusresurssien varsinainen 28 kappaleen laajennus — `BRDC-RES-001`
