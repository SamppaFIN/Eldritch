# BRDC-TECH-003 — "Schoolless" was never a word for a player

| | |
|---|---|
| **Alue** | `features/territory/ResearchPanel.tsx`, `BuildPanel.tsx`, `TempleSchoolPanel.tsx` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S |
| **Riippuvuudet** | `BRDC-TECH-002` (nimesi tämän omaksi tiketikseen omassa "Ei tässä" -osiossaan) |
| **Status** | `done` — 2026-09-15 (v0.5.90) |

## 🔴 RED

`BRDC-TECH-002` nimesi tämän oman GREENinsä ulkopuolelle kaksi asiaa, sanatarkasti:
*"`ResearchPanel.tsx:102`:n sisäinen jargon 'Every schoolless technology is known.'"* ja
puunäkymän jatkotyö (aikakausiryhmittely, `requires` piirto — ei tässä tiketissä, ks.
alla).

Kaksi konkreettista löydöstä auditoiden Research-ruutua samalla tavalla kuin
`BRDC-DETAIL-001`/`BRDC-KEEP-008`:

1. **"Every schoolless technology is known."** — pelaaja ei tiedä mikä "schoolless" on.
   Rivi näkyy kun Keepin oma tutkimuslista tyhjenee, mutta kuusi teknologiaa jää yhä
   tutkimatta (temppelin omat), eikä rivi kerro missä ne ovat.
2. **`titleCase` tuli väärästä moduulista.** `ResearchPanel.tsx` ja `TempleSchoolPanel.tsx`
   tuovat sen `./BuildPanel.js`:stä, joka itsekin vain uudelleenvie sen `./names.js`:stä —
   tutkimuskoodi riippui rakennuspaneelin moduulista ilman syytä.

## 🟢 GREEN

- [x] Jargon korjattu: *"The Keep's own study is complete. What is left is temple lore —
      a temple of the right element must be awake first."* — sama sanamuoto kuin
      `ManaPanel`in oma `REFUSAL['needs-a-temple']`, yksi laki
- [x] `titleCase` tuodaan suoraan `./names.js`:stä sekä `ResearchPanel.tsx`:ssä että
      `TempleSchoolPanel.tsx`:ssä; `BuildPanel.tsx`in tarpeeton uudelleenvienti poistettu,
      `BuildPanel.test.ts` tuo sen nyt myös `./names.js`:stä
- [x] Portti: `lint:lines`, `tsc -b`, 1363 vitest, `pnpm build` — kaikki vihreää

## Todennus

`temple.spec.ts` — kaksi testiä epäonnistui jo ennen tätä muutosta (`getByRole('dialog')`
osuu kahteen elementtiin, kun `BRDC-TUTOR-001`in "unlock"-opastusdialogi avautuu samaan
aikaan Research-dialogin kanssa) — todennettu toistamalla sama virhe identtisenä
muuttamattomalla koodilla (`git stash`). Ennalta oleva, ei tämän tiketin aiheuttama.

## Ei tässä

- **Puunäkymä.** `requires` piirretään, aikakausiryhmittely riviä kohti, ja kuusi
  koulullista teknologiaa näkyvät jollain listalla "vaatii <koulun> temppelin" -tekstillä
  sen sijaan että katoavat kokonaan Keepin näkymästä. Isompi rakennemuutos —
  `ResearchPanel`in oma tietohierarkia, sama luokka työtä kuin `BRDC-DETAIL-001`
- `BRDC-TUTOR-001`in "unlock"-dialogin ja muiden dialogien yhteentörmäys — löydetty
  kolmannen kerran tässä sessiossa (`step-claim.spec.ts`, `dialogs.spec.ts`, nyt
  `temple.spec.ts`), ei korjattu, oma tikettinsä jos siitä tulee raportti
