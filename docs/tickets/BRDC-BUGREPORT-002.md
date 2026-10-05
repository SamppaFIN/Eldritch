# BRDC-BUGREPORT-002 — Raportti suoraan GitHub-issueksi

| | |
|---|---|
| **Alue** | `features/report/BugReport.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | BUGREPORT-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-30 |
| **Status** | `todo` |

## 🔴 RED

Raportti jaetaan tai kopioidaan; issue pitää tehdä käsin.

## 🟢 GREEN

- [ ] Open as GitHub issue: esitäytetty `github.com/SamppaFIN/Eldritch/issues/new` (otsikko, label bug|enhancement, versio, alusta, laite, näkymä, kuvaus)
- [ ] Ei tokenia clientissä eikä bundlessa
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Vaihe 2 (Edge Function, anonyymi) — myöhemmin (D4).
