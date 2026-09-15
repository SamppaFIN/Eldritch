# BRDC-TERRAIN-005 — Yhdeksän maastolajia: vanhat ja Worldseedin uudet rinnakkain

| | |
|---|---|
| **Alue** | `rules/terrain.ts` (`TerrainKind`, `TERRAIN_TABLE`), `terrainSprites.ts`, `data/mapData.ts` (maalatut), `tokens.css`, `rules/bounty.ts`, `rules/wonder.ts`, editori |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `todo` — päätös tehty (`BRDC-SEED-000` D1, D9), toteutus alkaa |
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

- [ ] `TerrainKind` kasvaa yhdeksään: `plain | forest | hill | mountain | lake | coast | market | marsh | settlement`
- [ ] `TERRAIN_TABLE`: `marsh` ja `settlement` saavat resurssinsa ja rakennuspaikkansa.
      **Settlementin kaksi tuottoa** (kulta + kulttuuri) ei mahdu nykyiseen
      *yksi resurssi per maasto* -riviin → `TERRAIN_TABLE`in rivi laajenee listaksi
      resursseja yhden sijaan; testi kattaa sekä yhden että kahden resurssin maastot
- [ ] `--t-marsh` ja `--t-settle` `tokens.css`iin (dokumentin OKLCH-arvot); olemassa olevat
      seitsemän säilyvät nimillään ennallaan
- [ ] Laatat: marsh Sigilin `tMarsh`ista; **settlement piirretään** (ei mallia missään lähteessä)
- [ ] Bonusresurssien, ihmeiden ja rakennusten maastolistat laajenevat kattamaan marsh/settlement
      ilman että yksikään vanha maastolistaus muuttuu
- [ ] Editorin paletti: kaksi uutta maastoa valittavaksi vanhojen seitsemän rinnalle
- [ ] Typecheck: uusi `TerrainKind` on yhdisteen ylijoukko — mikään vanha `switch`/`match` ei
      saa haaraa puuttumaan (exhaustiveness-tarkistus jokaiselle `TerrainKind`-kytkimelle)

## Ei tässä

- Luokittelu OSM:stä, vyöhykejako ja `water`/`trade` → `lake`/`coast`/`market`-käännös —
  `BRDC-SEED-003`
- Mäkivyöhykkeiden koordinaatit — `BRDC-SEED-003`:n syöte, kirjataan siellä
