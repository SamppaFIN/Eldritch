# BRDC-CHIMNEY-001 — Finlaysonin piiput merkkitulina

| | |
|---|---|
| **Alue** | wonders/landmarks, tower sight |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | LANDMARK-001, BUILD-013 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C6; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Tampereen tunnistettavimmat maamerkit puuttuvat pelistä. Tehdaspiiput merkkitulina antavat kaupungille oman ihmeen.

## 🟢 GREEN

- [ ] 3 piippua maamerkki-ihmeinä (sijainnit oletus, Infinite tarkistaa)
- [ ] Kun omistat kaikki 3, saat vartiotornin kaltaisen näön koko kaupunginosaan (towerSight-malli, säde oletus 1 km)
- [ ] Maamerkin karttamerkki (LANDMARK-001:n avoin slotti-kysymys ratkaistaan tässä)
- [ ] Testit: näkö vain kolmella
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Muiden kaupunkien maamerkit.
