# BRDC-RES-003 — Stone was scarce

| | |
|---|---|
| **Alue** | `rules/terrain.ts`, `rules/bounty.ts`, `rules/terrainTiles.ts` |
| **Status** | `done` — 2026-09-24 (v0.6.62), **paikallinen commit, ei pushattu** |

## 🔴 RED

Infinite 2026-09-23 (todo 16, "vaihtelevia resurssiryppäitä"), tarkennus 2026-09-24:
*"kiveä ei ole juurikaan missään."* Kivi on 12:ssa 15:stä rakennuksesta, ja sitä antaa vain
`hill`-maasto (hash 11 %, tiilistä vain `natural=rock` yms.) sekä granite-bounty (1/8 heksoista
× osuus).

## 🟢 GREEN

- [x] Hash-maaston `hill` 11 % → 20 %, `mountain` 4 % → 5 % (kivi/rauta-suhde säilyy, kivi yhä
      yleisempi); `market` ja `plain` mahtuvat loppuun. Klusterointi res 9:ssä ennallaan
- [x] `granite` painotettu kolminkertaiseksi bounty-arvonnassa (vanha pooli), koska se on ainoa
      rakennusmateriaalia maksava bounty
- [x] `landuse=quarry` luetaan tileistä `hill`iksi
- [x] Testit: hill ≥ 12 % otoksessa, kaivos → hill

## Omat valintani / rajat

- Suhteet ovat arvauksia; ne muuttavat kaikkien hash-maaston (ei tiili- tai käsin luokitellun)
  heksojen tuottoa, myös jo hallussa olevien. Yksi kohta (`kindForRegion`) säätää
- "Vesi saa olla vettä" ei tarkoittanut tätä kertaa mitään erillistä: sitä ei kysytty tarkemmin,
  ja Infinite nimesi ongelmaksi kiven
