# BRDC-STANDARD-001 — Pystytä viiri sinne missä seisot

| | |
|---|---|
| **Alue** | `data/standardStore.ts`, `features/territory/standardLayer.ts`, `SheetActions.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Lähde** | Infiniten handoff 2026-10-05, F-13 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Ei tapaa merkitä paikkaa kartalle. Nimi: **Plant your standard** — Raise your banner tarkoittaa yhä valtakunnan julkaisua (Infinite 2026-10-05).

## 🟢 GREEN

- [x] `repository.standard.plant(now)` GPS-heksalle; `not-yours` torjutaan storessa, ei vain UI:ssa
- [x] `K.standard {h3, at}`, yksi kerrallaan, siirtyy uudelleen pystytettäessä; ei mekaniikkaa (D1)
- [x] Lipputanko-sprite valtakunnan väreissä (oma purppura, kultareuna); erillinen lippukerros jätettiin pois — kahden kokokäyrän kohdistus oli hauras
- [x] ⚑-nappi arkin rivissä; muualla kuin omalla maalla `aria-disabled` + himmennys, ja napautus kertoo syyn näkyvällä rivillä (puhelimessa ei ole hoveria tooltipille)
- [x] e2e `standard.spec.ts`: oma heksa → lippu kartalla, säilyy reloadin yli, toinen napautus kertoo syyn; torjunta vieraalla maalla testattu storessa (`standard.repo.test`) ja napin säännössä (`useStandard.test`) — e2e:ssä vieraalle heksalle ei pääse kävelemättä sitä omaksi
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Viirin julkaisu jaettuun maailmaan.
