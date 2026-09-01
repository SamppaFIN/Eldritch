# BRDC-CASTLE-002 — Keep-ruudulta aukeaa kansakunnan paneeli

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | XS (tunti) |
| **Riippuvuudet** | BRDC-CASTLE-001, BRDC-HEARTH-001 |
| **Status** | `done` — 2026-09-01 |
| **Valmius** | 90 % |

## 🔴 RED

Keep-markkeri piirtyy kartalle mutta sitä ei voi napauttaa: `MapCanvas` saa `castle`-
propin vain piirtoa varten. Napautus osuu markkerin alla olevaan heksaan ja avaa
tavallisen `CellPanel`in. Kansakunnan tilastoille ei ole ovea kartalta.

## 🟢 GREEN

- [x] Keep-markkerin napautus avaa `HearthPanel`in (omat solut, resurssit, paikat,
      taso, tutkimus, ennuste, Wager-ovi) — se **on jo** "kaikki tilastot kansakunnasta"
- [x] `MapCanvas` saa `onCastleTap`-propin; `map.on('click', [CASTLE_CORE_LAYER,
      CASTLE_HALO_LAYER], …)` paikka-käsittelijän vieressä
- [x] `useSelection.onCastleTap`: `setSelected(null); setSanctum(true)` — samat kaksi
      riviä kuin `onPlaceTap`in `kind === 'anchor'` -haara
- [x] Ei uutta paneelia, ei uutta tilastokoodia

## Toteutus

`HearthPanel` on `MapView`ssä jo `inspect.sanctum`in takana. Ainoa puuttuva pala oli
reitti Keep-markkerilta siihen. Käsittelijä rekisteröidään paikkakäsittelijän jälkeen,
kuten Anchor-tapissa — geneerinen `onCellTap` ehtii ensin asettaa solun, Keep-tap
asettaa `sanctum`in viimeisenä ja voittaa.

`MapCanvas.tsx` ja `MapView.tsx` olivat rajalla; Keep-tapin kommentti tiivistettiin
kahteen riviin ja sumukommentti yhteen, jotta molemmat pysyivät alle 400.

## Testit

- [x] `tsc -b` puhdas, `lint:lines` OK (MapCanvas 398, MapView 399)
- [x] 688 testiä vihreä
- [~] Manuaalinen: Keep-markkerin napautus avaa kansakuntapaneelin — kentällä

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `claude.md` §10 (Atlas / kaupunkinäkymä)
