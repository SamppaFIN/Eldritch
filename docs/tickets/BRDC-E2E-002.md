# BRDC-E2E-002 — Kameratestit mittaavat lepotilaa, eivät lentoa

| | |
|---|---|
| **Alue** | `apps/game/e2e/map.spec.ts` |
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S |
| **Status** | done |
| **Edeltäjä** | BRDC-E2E-001, BRDC-MAP-004 |

## 🔴 RED

`map.spec.ts`:n kameratestit kaatuvat kuorman alla ja menevät läpi yksin. Kolme kertaa
2026-09-11…12, joka kerta eri testi — `the player marker sits exactly on the camera centre`
ja `the recenter button pins the camera back on the player`.

**Vika ei ole tuotteessa.** Mitattu ajamalla markkerin poikkeama keskipisteestä ajassa:

```
t+0 ms     dx=-0.20  dy=-0.20
t+500 ms   dx=-0.27  dy=-0.27
t+1000 ms  dx=83.38  dy=-90.20
t+2000 ms  dx=-55.22 dy=-70.22
t+4000 ms  dx=96.89  dy=190.85
t+8000 ms  dx=-0.18  dy=-0.18
```

Levossa markkeri on **0,2 pikselin päässä keskeltä** — täsmälleen niin kuin pitääkin.
Mutta perustamiskierros lennättää kameraa ensimmäiset sekunnit, ja poikkeama käy ±190
pikselissä. `the player marker sits exactly on the camera centre` ottaa **yhden**
`boundingBox`-lukeman heti `openMap`in jälkeen ilman mitään odotusta ja vaatii ≤ 1 px.

Se testi ei siis väitä mitä se tarkoittaa. Se tarkoittaa *"markkeri päätyy kameran
keskelle"*; se väittää *"animaatio on jo ohi siihen mennessä kun Playwright ehti mitata"*.
Se on ajoitusväite jota kukaan ei tarkoittanut tehdä, ja kuormitettu kone rikkoo sen.

`openMapSettled` pollaa alle 6 pikseliin — mutta yllä olevasta käyrästä näkee, että
**tuokin ehto täyttyy kesken lennon**, aina kun käyrä ohittaa nollan. Se ei siis takaa
lepotilaa niille testeille jotka sitä käyttävät.

## 🟢 GREEN

- [x] `waitForCameraStill`: lukee `mapState`in kahdesti ja vaatii keskipisteen ja zoomin
      **muuttumattomaksi** — lepo todetaan pysähtymisestä, ei kuluneesta ajasta
- [x] `openMapSettled` odottaa levon, joten jokainen sitä käyttävä testi saa oikean
      alkutilan eikä satunnaista hetkeä kierroksen keskeltä
- [x] Tiukka keskitystesti odottaa levon ja vasta sitten mittaa. **Raja pysyy 1 px:ssä** —
      testiä ei löysätty, se vain lakkasi mittaamasta väärällä hetkellä
- [x] `map.spec` ajettu kokonaan kolmesti peräkkäin ja kuorman alla muiden spesien kanssa

## Todennus

Ennen: `map.spec.ts` yksin **13/14**, ja kolmessa eri ajossa kolme eri kameratestiä.

Jälkeen:

| Ajo | Tulos |
|---|---|
| `map.spec` yksin | 14/14 |
| `map.spec` ×2 peräkkäin | 28/28 |
| `map` + `opening` + `tutor` + `dialogs` yhdessä — se kuorma joka rikkoi sen | **38/38** |

Raja-arvoja ei nostettu eikä `timeout`eja kasvatettu oireen peittämiseksi. Ainoa muutos on
**milloin** mitataan.

## Ei tässä

- `expect.poll`-rajojen viilaus muissa testeissä. Ne pollaavat jo, ja pollaava testi
  kestää kuormaa. Vain kertalukemat olivat rikki.
