# BRDC-SEED-000 — Päätökset: Worldseed pelin siemeneksi

| | |
|---|---|
| **Alue** | — (päätöspöytäkirja, ei koodia) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | — |
| **Status** | `answered` 2026-09-16 — ks. Vastaukset. Muut tiketit päivitetty vastaamaan |
| **Riippuvuudet** | — |
| **Lähde** | Infinite 2026-09-16: *"tee ensin suunnitelma ja tiketit kaikista heksan alustuksista ja uusista resursseista"* |

## 🔴 RED

`worldseed.ts` ja `seed.harmala.json` tuovat pelin nykyiseen malliin yhdeksän ristiriitaa,
joita ei voi ratkaista koodaamalla — ne ovat suunnittelupäätöksiä. Ne on listattu erikseen
niissä tiketeissä joissa ne tulevat vastaan; tämä tiketti on niiden yhteinen pöytäkirja,
jotta yksikään ei ratkea hiljaa oletuksena.

## 🟢 GREEN — päätökset

| # | Tiketti | Kysymys | Suositus | **Vastaus Infiniteltä** |
|---|---|---|---|---|
| **D1** | `TERRAIN-005` | 7 maastolajia korvaavat pelin 7? | Kyllä, korvaa | **Ei — pidetään kaikki.** Worldseedin 7 lisätään pelin 7:ään; ei poistoja. `TerrainKind` kasvaa yhdeksään |
| **D2** | `RES-001` | Pooli seedatun alueen ulkopuolella? | Hajautus uudella poolilla | **Hajautus samalla tavalla** — suositus vahvistettu |
| **D3** | `RES-001` | herd/furs/amber/spice: muunna vai jätä? | Muunna | **Jätetään myös vanha** — 10 vanhaa + 28 uutta rinnakkain, ei muunnosta |
| **D4** | `WONDER-002` | 9 paikallista korvaa 12 lovecraftilaista? | Korvaa | **Korvaa, ja keksi uusille ihmeille lovecraftilaiset nimet ja vastineet** — sisältötehtävä osaksi `WONDER-002`:ta |
| **D5** | `WONDER-002` | 8 vai 9 ihmettä? | 9 | **9** — vahvistettu |
| **D6** | `WONDER-002` | *Ten Thousand Steps* siirretään pois tasaiselta Härmälältä? | Siirrä pois | **Ei siirretä** — havaintokuvassa on mäkialueita; ks. D9 |
| **D7** | `TAVERN-001` | Tavernan Wager-rooli poistuu Wagerin mukana? | Kyllä | **Kyllä** — vahvistettu |
| **D8** | `QUEST-006` | Keep-ankkurointi säilyy seedatun alueen ulkopuolella? | Kyllä | **Kyllä toistaiseksi** — myöhemmin eri alueille omat questimekaniikat (uusi tarve, ei vielä tikettiä) |
| **D9** | `TERRAIN-005` | DEM `hill`-luokittelulle? | Ei vielä | **Ei DEM:iä.** Leirintäalueella ja Härmälänrannassa on tunnettuja mäkialueita — käytetään niitä nimettyinä vyöhykkeinä hillin merkkinä; jos joku hexi ei osu tunnettuun mäkialueeseen, se ei ole hill |

## Vaikutus muihin tiketteihin (päivitetty 2026-09-16)

D1 ja D3 kääntävät kolmen tiketin suunnan **korvauksesta liitokseksi** — nämä on jo
päivitetty niiden omiin RED/GREEN-osioihin:

- **`BRDC-TERRAIN-005`**: 7 → 9 maastolajia (union, ei swap); vanha `mountain`/`coast`/`market`
  säilyy Worldseedin `hill`/`water`/`trade`in rinnalla, ei käänny niiksi
- **`BRDC-RES-001`**: 10 vanhaa + 28 uutta = 38 bonusresurssia; herd/furs/amber/spice pysyvät
- **`BRDC-WONDER-002`**: 9 uutta ihmettä saavat lovecraftilaiset nimet/vastineet (uusi
  GREEN-kohta); *Ten Thousand Steps* pysyy mukana, vaatimus muuttuu nimetyksi mäkivyöhykkeeksi
  eikä DEM-arvoksi

## Ei tässä

- Itse toteutus — jokainen päätös toteutetaan sen omassa tiketissä
