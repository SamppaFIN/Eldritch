# BRDC-STANDARD-001 — Pystytä viiri sinne missä seisot

| | |
|---|---|
| **Alue** | `data/standardStore.ts`, `features/territory/standardLayer.ts`, `SheetActions.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Lähde** | Infiniten handoff 2026-10-05, F-13 |
| **Status** | `todo` |

## 🔴 RED

Ei tapaa merkitä paikkaa kartalle. Nimi: **Plant your standard** — Raise your banner tarkoittaa yhä valtakunnan julkaisua (Infinite 2026-10-05).

## 🟢 GREEN

- [ ] `repository.standard.plant(now)` GPS-heksalle; `not-yours` torjutaan storessa, ei vain UI:ssa
- [ ] `K.standard {h3, at}`, yksi kerrallaan, siirtyy uudelleen pystytettäessä; ei mekaniikkaa (D1)
- [ ] Lipputanko-sprite pelaajan lipun väreissä
- [ ] Nappi arkissa; muualla kuin omalla maalla disabloitu + näkyvä syy-rivi
- [ ] e2e: oma heksa → lippu; neutraali/vihollisen → estetty ja syy näkyy
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Viirin julkaisu jaettuun maailmaan.
