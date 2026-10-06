# BRDC-MASKS-001 — Naamioiden muukalainen

| | |
|---|---|
| **Alue** | deck, tutkijan muistiinpanot |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | DOOM-003, QUEST-009 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C4; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Korteilla ei ole yhteyttä toisiinsa. Nyarlathotepin naamiot — sama olento monena hahmona — palkitsevat tarkkaavaisen pelaajan.

## 🟢 GREEN

- [ ] Muukalainen esiintyy 6 kortissa eri hahmoina (kalastaja, saarnaaja, lentäjä…) yhteisellä tuntomerkillä tekstissä
- [ ] Kun pelaaja on kohdannut 3, Keep tarjoaa "Nimeä muukalainen" — oikea vastaus antaa palkinnon ja valinnan
- [ ] Kohdatut naamiot tallennetaan (uusi avain)
- [ ] Testit: tunnistus, väärä arvaus maksaa sanityä
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Muukalainen muiden pelaajien korteissa.
