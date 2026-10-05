# BRDC-BUGREPORT-002 — Raportti suoraan GitHub-issueksi

| | |
|---|---|
| **Alue** | `features/report/BugReport.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | BUGREPORT-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-30 |
| **Status** | `done` — 2026-10-06 |

## 🔴 RED

Raportti jaetaan tai kopioidaan; issue pitää tehdä käsin.

## 🟢 GREEN

- [x] Open as GitHub issue: esitäytetty `github.com/SamppaFIN/Eldritch/issues/new` (otsikko, label bug|enhancement, versio, alusta, laite, näkymä, kuvaus) — `issueUrl` (`report.test.ts`) + `e2e/bug-report.spec.ts`. Repo on julkinen, joten issue **ei** kanna sijaintia eikä toimintalokia; ne kulkevat edelleen vain WhatsApp-jaossa. Kuvaus katkaistaan 1200 merkkiin (ä = 6 merkkiä URL:ssa)
- [x] Ei tokenia clientissä eikä bundlessa — linkki on ainoa kanava; `dist/` ja `src/` haettu (`ghp_`, `github_pat_`, `GITHUB_TOKEN`): ei osumia
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 1966 testiä, tsc, rivit OK, build OK

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Sivulöydös

Paneelin avausefekti riippui `onClose`-propista, joka on uusi nuolifunktio jokaisella valikon renderöinnillä — ja valikko renderöityy jokaisella GPS-paikannuksella. Kirjoitettu kuvaus pyyhkiytyi kesken lauseen. Nollaus ajetaan nyt vain avattaessa; ESC kulkee `useEscape`-hookin kautta. Spec tarkistaa, että teksti säilyy.

## Ei tässä

Vaihe 2 (Edge Function, anonyymi) — myöhemmin (D4).
