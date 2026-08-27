# BRDC-CLAIM-001 — Lenkin tunnistus (`loopDetection`)

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-GEO-001, BRDC-SIM-001 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 100 % |

## 🔴 RED

Kävelty lenkki ei tee mitään. Tämä on **koko pelin ydinmekaniikka** — ilman sitä
v3 on kartta jolla on viiva.

Naiivi toteutus ("onko uusi piste alle 25 m jostain aiemmasta") on väärä: se laukeaa
heti, kun pelaaja kävelee kadun päähän ja kääntyy takaisin. Se antaisi alueen
ilman että mitään on kierretty.

## 🟢 GREEN

- [x] `packages/core/geo/loopDetection.ts` on **puhdas funktio**
- [x] Signatuuri: `TrailPoint[]` → `{ closed: true, loop: TrailPoint[] } | null`
- [x] Palauttaa **vain sulkeutuneen osuuden**, ei koko jälkeä
- [x] Kaikki **viisi fixturea** antavat odotetun tuloksen (taulukko alla)
- [x] Validointi: `MIN_LOOP_POINTS`, `MAX_LOOP_AREA_M2`, `MAX_LOOP_DURATION_MS`
- [x] Ei DOM:ia, ei verkkoa, ei `Date.now()`ta

## Toteutus

**Vakiot** (`files/CLAUDE.md` §Constants):

```ts
LOOP_CLOSE_RADIUS_M  = 25
MIN_LOOP_POINTS      = 8
MAX_LOOP_AREA_M2     = 50_000   // × (1 + level/10)
MAX_LOOP_DURATION_MS = 90 * 60_000
```

**Algoritmi:**

1. Uudelle pisteelle etsitään lähin aiempi piste, joka on alle `LOOP_CLOSE_RADIUS_M`
2. **Ohita N viimeisintä pistettä** — muuten lenkki sulkeutuu itseensä välittömästi
3. Sulkeutunut osuus = pisteet löydetystä indeksistä nykyiseen
4. Osuuden on täytettävä: pisteitä ≥ `MIN_LOOP_POINTS`, kesto ≤ `MAX_LOOP_DURATION_MS`,
   monikulmion pinta-ala ≤ `MAX_LOOP_AREA_M2 × (1 + level/10)`
5. **Pinta-alatarkistus hoitaa `back-and-forth`-tapauksen** — edestakainen kävely
   tuottaa lähes nollapinta-alan monikulmion

Kohta 5 on tämän tiketin tärkein oivallus. Pelkkä etäisyys ei riitä; alue ratkaisee.

**Fixture-totuustaulu** (BRDC-SIM-001):

| Fixture | Odotettu |
|---|---|
| `square.json` | sulkeutuu kerran, alue ≈ neliön pinta-ala |
| `figure-eight.json` | sulkeutuu **kahdesti**, kaksi erillistä silmukkaa |
| `open-line.json` | `null` — ei sulkeudu koskaan |
| `back-and-forth.json` | `null` — pinta-ala liian pieni |
| `gps-noise.json` | sulkeutuu, alue järkevällä vaihteluvälillä |

**Pinta-ala:** kenkänauha-kaava (shoelace) tasoprojektiossa. Res-11-solu on ~2 150 m²,
joten metriluokan tarkkuus riittää — geodeettista tarkkuutta ei tarvita.

## Testit

- [x] Kaikki viisi fixturea, taulukon mukaisesti
- [x] Alle `MIN_LOOP_POINTS` pistettä → `null` vaikka etäisyys täsmäisi
- [x] Yli `MAX_LOOP_AREA_M2` → hylätään (autolla ajettu "lenkki")
- [x] Yli `MAX_LOOP_DURATION_MS` → hylätään
- [x] Tason vaikutus pinta-alarajaan: taso 10 → raja 1,5-kertainen
- [x] Tyhjä syöte ja yhden pisteen syöte → `null`, ei kaadu

> **Kaksi asiaa, jotka fixturet pakottivat muuttamaan:**
>
> 1. **Pinta-ala projisoidaan renkaan keskileveydelle**, ei ensimmäiselle pisteelle.
>    Ensimmäiseen pisteeseen sidottuna sama lenkki mittautuu eri kokoiseksi sen mukaan
>    mistä kulmasta kävelijä lähti. Pieni ero — ja väärä.
> 2. **`MIN_LOOP_AREA_M2` = 5 000, ei 1 000.** `gps-noise.json` sulki 1 278 m²:n
>    haamusilmukan pisteessä 32, ennen kuin kävelijä oli kiertänyt korttelia jota oli
>    kiertämässä. 5 000 m² on ~70 m neliö eli noin kolme res-11-solua: pienempi rengas
>    ei ansaitsisi solua lainkaan, joten sen sulkeminen ei ole kävelyn keskeyttämisen arvoista.
>
> **Perimetri ei kelpaa erottelijaksi**, houkuttelevalta kuin se näyttääkin: kohina
> paisuttaa sitä paljon enemmän kuin pinta-alaa. Sama 120 m kortteli on 480 m puhtaana
> ja **1 489 m** 12 m:n hajonnalla — joten jokainen perimetriin nojaava testi, myös
> isoperimetrinen suhde, arvioi oikean lenkin huonommaksi kuin haamun.
>
> **Suurin rengas voittaa:** `detectLoop` etsii *varhaisimman* pisteen sulkeutumissäteen
> sisältä. Iso lenkki kävellyt pelaaja saa ison lenkin, ei sen viimeistä mutkaa.

## Ei kuulu tähän tikettiin

H3-rasterointi (BRDC-CLAIM-002). Valtauslogiikka (BRDC-CLAIM-003). Kutsuminen
repositoriosta (BRDC-CLAIM-005).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 1 · `files/CLAUDE.md` §Constants, §Testing
