# BRDC-DREAM-001 — Unimatka yön yli

| | |
|---|---|
| **Alue** | deck-moottori, Unimaa-pakka |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | VIGIL-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C2; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Peli palkitsee vain liikkumisesta. Yöllinen lepo on luonteva hetki Unimaalle — ainoa mekaniikka, joka palkitsee nukkumisesta.

## 🟢 GREEN

- [x] Kun sovellus avataan aamulla (05–11) ja edellisestä sijainnista on ≥ 6 h ilman liikettä, nostetaan unikortti Unimaa-pakasta (8 korttia) — `rules/dream.ts`; walk writer vertaa yön yli edellistä lukemaa ja aamun ensimmäistä (≤ 2 rengasta = "paikallaan"); vain Keepin valtakunnalle (tutkija tarvitaan)
- [x] Kortti antaa vihjeen, resurssin tai maksaa sanityä — Will-koe samalla noppapoolilla — `dreamApi.face` (`diceFor` + Mythos-nopat), reunakortti `DreamCard`: napautus kohtaa, toinen kuittaa
- [x] Kerran vuorokaudessa; ei vaadi taustaseurantaa — `K.dream.day` (paikallinen päivä); kaksi lukemaa riittää
- [x] Testit: ehto (aika + paikallaanolo) puhtaana funktiona — `dreamt(previous, next, localHour)`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — e2e `dream.spec.ts` + eureka/mythos 360 px vihreä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Unimaan kartta.
