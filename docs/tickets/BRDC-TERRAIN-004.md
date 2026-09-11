# BRDC-TERRAIN-004 — Kallio on louhos, ei kaivos

| | |
|---|---|
| **Alue** | `packages/core/src/rules/terrain.ts`, `bounty.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | done |
| **Edeltäjä** | BRDC-TERRAIN-002 (maastotaulu), BRDC-BOUNTY-001 (bonusresurssit) |

## 🔴 RED

Infinite kentältä 2026-09-11: *"resursseissa on nyt iron, ei stone.. ja kiveä tarvitaan
melki joka rakennukseen."*

Kolme erillistä syytä, kaikki mitattu koodista — ei arvattu:

**1. Tiilenlukija kutsuu paljasta kalliota vuoreksi.** `terrainFromTiles`
(`terrain.ts:370`) lukee `natural` ∈ {`peak`, `cliff`, `ridge`, `rock`, `scree`} →
`mountain` → **iron**. Tampereella `natural=rock` / `bare_rock` (avokallio) on OSM:n
yleisin luonnonkohde: Pyynikin harju, Kalevankangas, joka toinen pihakallio. Pelaaja
kävelee kallion yli ja saa rautaa.

Se on väärin myös oikeasti: **avokallio on louhos.** Sieltä otetaan kiveä. Rautakaivos
vaatii vuoren.

**2. Pelto puuttuu kokonaan, ja niitty on mäki.** `landuse=farmland` ei mäppäydy
mihinkään — `terrainFromTiles` palauttaa `null` ja maasto putoaa hashille.
`natural` ∈ {`grassland`, `meadow`} → `hill` (`terrain.ts:378-381`), eli **niitystä
tulee kiveä**. Infinite pyysi nimenomaan tulkintaa *"onko vuori, pelto, järvi"*.

**3. Tarjonta 1:1, kysyntä 6:1.** `kindForRegion` (`terrain.ts:133-140`) antaa `hill`ille
7 % (0.27–0.34) ja `mountain`ille 7 % (0.34–0.41). Mutta `BUILDINGS`in hinnoissa
**stone esiintyy 12 kertaa 15 rakennuksesta ja iron 2 kertaa.** Sama tarjonta, kuusinkertainen
kysyntä.

**4. Yksikään bounty ei tuota kiveä.** `BOUNTIES` (`bounty.ts:56-69`) tuottaa food ×4,
gold ×2, culture ×3. Kivi ja rauta eivät ole yhdessäkään. Civilization V:ssä *Stone* on
bonusresurssi tasangolla ja kukkuloilla — juuri se mekaniikka jonka Infinite pyysi.

## 🟢 GREEN

- [x] `natural` ∈ {`rock`, `bare_rock`, `scree`, `cliff`, `stone`} → **`hill`** (kivi).
      Vain `peak`, `ridge`, `volcano`, `arete` jäävät `mountain`iksi
- [x] `landuse` ∈ {`farmland`, `farm`, `orchard`, `vineyard`, `allotments`} ja
      `natural` ∈ {`grassland`, `meadow`} → **`plain`** (pelto).
      `terrainFromTiles` palauttaa nyt `plain`in eksplisiittisesti, ei `null`ia —
      pelto on tulkinta, ei tulkinnan puute
- [x] `kindForRegion`: `hill` 0.27–0.38 (**11 %**), `mountain` 0.38–0.42 (**4 %**).
      Muut rajat koskemattomat — lake, coast, forest, market ja plain pysyvät
- [x] Uusi bounty `granite`: `terrain: ['plain','hill']`, `resource: 'stone'`, `perHour: 2`.
      Kymmenes bounty; `BOUNTY_IDS` johdetaan taulusta, joten muuta ei tarvita
- [x] Testit: kallio → hill, huippu → mountain, pelto → plain, niitty → plain;
      jakauman osuudet mitattu 20 000 indeksin otoksella, ei arvattu
- [x] Portti: `check-line-limit`, `tsc -b`, `vitest run`, `pnpm build`

## Todennus

Jakauma mitattiin ajamalla `terrainOf` 20 000 indeksille ja laskemalla osuudet — ei
laskettu rajoista paperilla. Tiilisäännöt testataan `terrainFromTiles`illa suoraan,
koska se on puhdas funktio; `useTerrainResolver` ei ole testattavissa ilman GL-karttaa
ja se vain syöttää sille `queryRenderedFeatures`in tuloksen.

## Ei tässä

- **Rauta ei saa omaa bountya.** Kaksi rakennusta viidestätoista tarvitsee sitä; 4 %:n
  vuoristo riittää. Lisätään jos kenttä sanoo toisin.
- **`plain` ei ala tuottaa itse.** Tyhjä tasanko on `BRDC-BOUNTY-001`:n oma päätös ja se
  pitää: pelto tuottaa kun siltä *löytyy* vilja tai graniitti, ei automaattisesti.
