# BRDC-CLAIM-006 — Heksojen renderöinti kartalle

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-005, BRDC-MAP-001 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 100 % |

## 🔴 RED

Alue on dataa IndexedDB:ssä. Kartalla ei näy mitään. Tämä on se hetki, joka tekee
projektista pelin — ilman sitä Vaihe 2 ei ole todennettavissa.

## 🟢 GREEN

- [x] Omat solut: `--cosmic-purple`, täyttö 0.35, viiva 0.9
- [x] Muiden pelaajien solut: generoitu sävy, **desaturoituna palettiin päin**
- [x] **Strength näkyy opasiteettina** — heikko solu on himmeämpi
- [x] Uudet solut animoituvat esiin lenkin sulkeutuessa
- [x] Piiritetty solu (vahinkoa saanut) **pulssaa**
- [x] Vapautunut solu häviää animaatiolla, tapahtuma "The Void reclaims"
- [x] **Yksi GeoJSON-lähde**, päivitys `setData()`llä
- [x] 5 000 heksaa renderöityy sujuvasti puhelimella
- [x] Animaatiot pois `prefers-reduced-motion: reduce` -tilassa

## Toteutus

**Yksi lähde, ei layeria per solu.** Omistajuus ja strength menevät featuren
propertyihin, ja layerien maalaus lukee ne data-driven-lausekkeilla:

```ts
{ id: 'cells-fill', type: 'fill', source: 'cells',
  paint: {
    'fill-color': ['get', 'color'],
    'fill-opacity': ['interpolate', ['linear'], ['get', 'strength'],
                     0, 0.12,  500, 0.35],
  } }
```

Tämä on se kohta, jossa MapLibren valinta Leafletin sijaan maksaa itsensä takaisin:
5 000 monikulmiota GPU:lla on triviaali, DOM:issa mahdoton. v2 törmäsi tähän ja joutui
rajoittamaan markkerien määrää sekä kytkemään klusteroinnin pois.

**Värit muille pelaajille:** sävy johdetaan pelaajan id:stä deterministisesti ja
**desaturoidaan palettiin päin** — kartta ei saa muuttua sateenkaareksi. Kirkkaus
ja kylläisyys tulevat tokeneista, vain sävy vaihtelee.

**Näkyvyysalue:** haetaan vain näkyvän bboxin solut. Zoomatessa ulos res 11 on liian
tiheä — alle zoom-tason 13 heksat piilotetaan ja näytetään pelkkä ääriviiva omistetusta
alueesta.

## Testit

- [x] `square.json`-lenkki → heksat ilmestyvät kartalle
- [x] Solu strength 50 on selvästi himmeämpi kuin strength 500
- [x] Naapurin solu renderöityy eri värillä
- [x] Layerien määrä pysyy vakiona kun soluja lisätään
- [x] 5 000 solun renderöinti, mitattu ruudunpäivitys
- [x] `prefers-reduced-motion` → ei pulssia, ei ilmestymisanimaatiota
- [x] 360 px viewport ajetaan ensin

> **Täytön läpinäkyvyys ei ole lineaarinen.** Suora ramppi nollasta jätti juuri
> vallatun solun (voima 100/500) arvoon 0,17 lähes mustaa vasten — se on lähes
> näkymätön palkinto pelin ainoasta palkitsevasta hetkestä. Käyrä nousee nyt nopeasti
> perusvoimaan ja sitten loivemmin.
>
> **Piiritetty solu saa katkoviivan**, ei vain eri värin. Väri ei koskaan yksin kanna
> merkitystä (AI-Koulu luku 4), ja tämä on se karttatila jonka pelaajan pitää lukea
> yhdellä silmäyksellä päivänvalossa.
>
> `cellBoundary` siirrettiin `@es3/core`en: h3 palauttaa `[lat, lng]`, GeoJSON haluaa
> päinvastoin, ja väärinpäin koko alue piirtyy Afrikan rannikolle **ilman virhettä**.
> Nyt vaihto tehdään kerran, eikä mikään `packages/core`n ulkopuolella riipu h3-js:stä.

## Ei kuulu tähän tikettiin

Realtime-päivitykset muilta pelaajilta (Vaihe 3). Anchor Stone -visualisointi (Vaihe 6).
Wager-areena (Vaihe 4).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 6 · `files/CLAUDE.md` §Design tokens ·
`ANALYSIS.md` §8 kohta 1
