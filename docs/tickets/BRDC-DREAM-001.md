# BRDC-DREAM-001 — Unimatka yön yli

| | |
|---|---|
| **Alue** | deck-moottori, Unimaa-pakka |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | VIGIL-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C2; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Peli palkitsee vain liikkumisesta. Yöllinen lepo on luonteva hetki Unimaalle — ainoa mekaniikka, joka palkitsee nukkumisesta.

## 🟢 GREEN

- [ ] Kun sovellus avataan aamulla (05–11) ja edellisestä sijainnista on ≥ 6 h ilman liikettä, nostetaan unikortti Unimaa-pakasta (8 korttia)
- [ ] Kortti antaa vihjeen, resurssin tai maksaa sanityä — Will-koe samalla noppapoolilla
- [ ] Kerran vuorokaudessa; ei vaadi taustaseurantaa
- [ ] Testit: ehto (aika + paikallaanolo) puhtaana funktiona
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Unimaan kartta.
