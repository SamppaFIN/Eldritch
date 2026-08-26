# BRDC-CLAIM-006 — Heksojen renderöinti kartalle

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-005, BRDC-MAP-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Alue on dataa IndexedDB:ssä. Kartalla ei näy mitään. Tämä on se hetki, joka tekee
projektista pelin — ilman sitä Vaihe 2 ei ole todennettavissa.

## 🟢 GREEN

- [ ] Omat solut: `--cosmic-purple`, täyttö 0.35, viiva 0.9
- [ ] Muiden pelaajien solut: generoitu sävy, **desaturoituna palettiin päin**
- [ ] **Strength näkyy opasiteettina** — heikko solu on himmeämpi
- [ ] Uudet solut animoituvat esiin lenkin sulkeutuessa
- [ ] Piiritetty solu (vahinkoa saanut) **pulssaa**
- [ ] Vapautunut solu häviää animaatiolla, tapahtuma "The Void reclaims"
- [ ] **Yksi GeoJSON-lähde**, päivitys `setData()`llä
- [ ] 5 000 heksaa renderöityy sujuvasti puhelimella
- [ ] Animaatiot pois `prefers-reduced-motion: reduce` -tilassa

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

- [ ] `square.json`-lenkki → heksat ilmestyvät kartalle
- [ ] Solu strength 50 on selvästi himmeämpi kuin strength 500
- [ ] Naapurin solu renderöityy eri värillä
- [ ] Layerien määrä pysyy vakiona kun soluja lisätään
- [ ] 5 000 solun renderöinti, mitattu ruudunpäivitys
- [ ] `prefers-reduced-motion` → ei pulssia, ei ilmestymisanimaatiota
- [ ] 360 px viewport ajetaan ensin

## Ei kuulu tähän tikettiin

Realtime-päivitykset muilta pelaajilta (Vaihe 3). Anchor Stone -visualisointi (Vaihe 6).
Wager-areena (Vaihe 4).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 6 · `files/CLAUDE.md` §Design tokens ·
`ANALYSIS.md` §8 kohta 1
