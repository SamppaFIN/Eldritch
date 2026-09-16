# BRDC-CODEX-004 — Kunnianimet: yksi per johdettu mittari, kaikki näkyvissä

| | |
|---|---|
| **Alue** | `features/codex/figures.ts`, `CodexPanel.tsx`, `codex-panel.css`, `features/character/CharacterPanel.tsx`, `character.css` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S |
| **Riippuvuudet** | `BRDC-CODEX-001` (taulukko, `placementIn`) |
| **Status** | `done` — 2026-09-16 (v0.6.41) |

## 🔴 RED

Kenttäraportti Infiniteltä 2026-09-16 (kenttätestaaja Marcel, saksankielinen englanti):
*"small lore and color trick for the codex of dominion.. give honorary title to the player
that holds the title, like landlord who holds the most area... lisää myös tuo titteli ja
jos monta niin kaikki, you näkymään"*.

Codexin taulukko sanoo sijoituksen (*"1st of 7"*) mutta ei koskaan mitä se *tarkoittaa*.
Johtaminen on numero muun joukossa — ei eroa "1st" ja "7th" välillä paitsi luku itse.
Yksikään ruutu ei myöskään kerro pelaajalle mitä hän *on*, vain missä hän seisoo.

## 🟢 GREEN

- [x] `METRIC_TITLE: Record<MetricId, string>` (`figures.ts`) — yksi lore-nimi per
      johdettu mittari (*The Landlord*, *The Pathwalker*, *The Farseer*, *The Sovereign*,
      *The Artificer*, *The Far-Warden*, *The Devoted*)
- [x] `titlesHeld(metrics, me)` — puhdas funktio, uudelleenkäyttää `placementIn`in jo
      olemassa olevaa `rank === 1`-sääntöä (tasapeli jakaa kärjen, `BRDC-CODEX-001`).
      Palauttaa kaikki mittarit joissa realm johtaa outright, ei vain ensimmäistä
- [x] `CodexPanel.tsx`: rivi jossa `mine.rank === 1` saa kultaisen reunan
      (`.codex__row--titled`) ja nimen perään pillin muotoisen badgen
      (`.codex__title`) — ei uutta riviä, ei uutta korkeutta
- [x] `CharacterPanel.tsx` ("You"): sama tieto haetaan itsenäisesti `useCodex(open)`illa
      (ei riipu siitä onko Codex koskaan avattu tällä käynnillä) ja piirretään omana
      listana (`.character__titles`) heti sigilin/nimen alla, ennen Consciousness-osiota
- [x] Sama badge-tyyli molemmilla ruuduilla (`.codex__title` / `.character__title`) —
      yksi visuaalinen sanasto kahdella paneelilla
- [x] Hiljainen kun ei johda mitään, tai kun realm ei ole listattu — ei "no titles yet"
      -riviä kummallakaan ruudulla
- [x] Portti: `lint:lines`, `tsc -b`, **1589** vitest (+5), `pnpm build`

## Todennus

Viisi uutta testiä `figures.test.ts`ssä: jokainen mittari saa `The `-alkuisen nimen;
titteli vain outright-johtajalle; tasapeli jakaa tittelin (`placementIn`in oma sääntö);
useampi titteli kerralla kun realm johtaa montaa mittaria; tyhjä lista kun realm on
listaamaton tai ei johda mitään. Koko sarja + olemassa oleva 1584 vihreänä.

## Ei tässä

- **Ei mekaniikkaa.** Titteli ei muuta mitään pelissä — ei bonusta, ei efektiä. Puhdas
  lore- ja väriviilaus, kuten pyyntö sanoi.
- **Hall of Fame / Retire Kingdom.** Sama viesti mainitsi highscore-listan retiroiduille
  kuningaskunnille — erillinen, isompi ominaisuus, ei aloitettu tässä tiketissä.
