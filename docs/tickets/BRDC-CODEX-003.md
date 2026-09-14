# BRDC-CODEX-003 — Sijoitus on paikka, väli on se mitä sille voi tehdä

| | |
|---|---|
| **Alue** | `features/codex/figures.ts`, `CodexPanel.tsx` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S |
| **Riippuvuudet** | `BRDC-CODEX-001` (taulukko), `BRDC-CODEX-002` |
| **Status** | `done` — 2026-09-15 (v0.5.93) |

## 🔴 RED

Codex sanoi rivillä kolme asiaa: oma luku, sijoitus (*"3rd of 7"*), ja sen alla Best /
Average / Worst. Kaikki oikein — mutta kysymykseen **"olenko lähellä seuraavaa"** ei
vastannut mikään. Pelaaja laski sen päässään kolmea vertailulukua vasten, kävellessä,
puhelimen ruudulta.

Sijoitus on *paikka*. Väli on se osa jolle voi tehdä jotain — ja se oli jo datassa
(`metric.ranked` kantaa jokaisen realmin luvun), vain vähennyslaskun päässä.

## 🟢 GREEN

- [x] `gapLine(metric, mineValue, rank)` — puhdas funktio `figures.ts`:ssä, mittarin omassa
      yksikössä: *"1,200 m² behind 2nd"*, tai johtavalle *"2,800 m² ahead"*
- [x] Piirtyy **samalle riville** joka jo kantaa sijoituksen (`.codex__place`, `grid-column:
      1 / -1`) — ei uutta riviä, ei uutta korkeutta, sama napautusalue
- [x] **Tasapelit**: samalla luvulla olevat realmit jakavat sijoituksen, joten askel ylös
      mitataan lähimpään *eri* lukuun, ei taulukon seuraavaan riviin
- [x] `null` kun mitään mitattavaa ei ole — realm yksin maailmassa, tai kenttä jossa
      kaikki ovat tasan
- [x] `ordinal(n)` erotettu `placeWord`ista, joka käyttää sitä nyt itse — ei kahta
      järjestysluvun muodostusta
- [x] Portti: `lint:lines`, `tsc -b`, **1367** vitest (+4), `pnpm build`, e2e `-g "the Codex
      shows where you stand"` 2/2

## Todennus

Neljä testiä: väli ylöspäin, johtavan etumatka, tasapeli (mittaa 1. sijaan eikä
vieressä olevaan tasapeliin), ja hiljaisuus yksin/tasan. **Todennettu rikkomalla**:
`>` → `>=` vaihdettuna kaikki neljä punaistuivat (väli olisi ollut oma luku itseään
vasten, eli 0), sitten palautettu.

E2E:n omat väittämät ovat `toContainText`-osumia (`'2nd of 3'`), joten rivin jatkaminen
ei riko niitä — ajettuna ei rikkonutkaan.

## Ei tässä

- **Palkki keskiarvoa vasten.** Dokumentin luonnos piirtää sen; se olisi neljäs kanava
  samalle tiedolle jonka luku jo sanoo tarkasti, ja mittakaavapäätös (worst→best vai
  0→best) on oma kysymyksensä. Luku vastaa "kuinka paljon"; palkki vastaisi "suunnilleen
  missä" — jos kentältä tulee raportti että sijoitus ei hahmotu, se on oma tikettinsä
- Codex lukee yhä vain julkaisseita realmeja (`BRDC-CODEX-001`in oma rajaus)
