# BRDC-HALL-004 — Eläköityessä kuva Chroniclesiin

| | |
|---|---|
| **Alue** | `data/hallOfFameStore.ts`, `features/hall/` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | HALL-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-31 |
| **Status** | `done` — 2026-10-06 |

## 🔴 RED

Eläköitynyt valtakunta on lukuja ja tarina, ei kuvaa.

## 🟢 GREEN

- [x] Retire-hetkellä kartan canvas `render`-callbackissa + `html-to-image` overlaylle (riippuvuus hyväksytty 2026-10-05), yhdistetty, ≤ 1280 px JPEG 0.8 — `features/hall/snapshot.ts`. Kartan säiliö ja body ovat läpinäkymätöntä tyhjyyttä, joka maalautui kartan päälle; ne tyhjennetään kaappauksen ajaksi. Retire-dialogi rajataan pois. 6 s jälkeen kuva jätetään ottamatta — eläköityminen ei koskaan odota sitä
- [x] IndexedDB:hen omaan avaimeen, Hall-merkintä viittaa — `K.chronicleImages` (`Record<id, dataURL>`, `FOREVER_KEYS`:ssä, jotta seuraava kausi ei pyyhi sitä), merkinnässä `image: true`; `repository.chronicleImages` + `chronicleImageStore.test.ts`
- [x] Hall of Fame / This device: pikkukuva, tap → koko kuva (portaali bodyyn, ESC sulkee). Jaettu Chronicles-välilehti ei saa kuvaa — kuvan jakaminen Workerille on "Ei tässä"
- [x] Säilyy reloadin yli (e2e) — `e2e/hall-picture.spec.ts`: JPEG, ≤ 1280 px, keskikolmanneksessa valaistuja pikseleitä (kartta, ei pelkkä HUD)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 1969 testiä, tsc, rivit OK, build OK; `hall-of-fame.spec.ts` 8/8

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Kuvan jakaminen Workerille.
