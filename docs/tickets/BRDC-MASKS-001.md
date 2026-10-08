# BRDC-MASKS-001 — Naamioiden muukalainen

| | |
|---|---|
| **Alue** | deck, tutkijan muistiinpanot |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | DOOM-003, QUEST-009 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C4; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Korteilla ei ole yhteyttä toisiinsa. Nyarlathotepin naamiot — sama olento monena hahmona — palkitsevat tarkkaavaisen pelaajan.

## 🟢 GREEN

- [x] Muukalainen esiintyy 6 kortissa eri hahmoina (kalastaja, saarnaaja, lentäjä…) yhteisellä tuntomerkillä tekstissä — `rules/masks.ts`: puunhakkaaja, kalastaja, saarnaaja, lentäjä, maanmittari, uimari; tuntomerkki "shadow leans toward the lake" (testi vaatii sen jokaisesta). Jaetaan noin joka viidenteen huhuun omalla hashillaan, muut huhut pysyvät paikoillaan
- [x] Kun pelaaja on kohdannut 3, Keep tarjoaa "Nimeä muukalainen" — oikea vastaus antaa palkinnon ja valinnan — kolme nimeä, oikea "Nyarlathotep, the Crawling Chaos"; valinta: Bargain (+3 clues ja Dark Pact) tai Banish (+100 mana, sanity täyteen), kerran
- [x] Kohdatut naamiot tallennetaan (uusi avain) — `K.masks`; kohdattu = huhu kohdattu, läpäisty tai ei
- [x] Testit: tunnistus, väärä arvaus maksaa sanityä — `masks.repo.test.ts` (väärä nimi −2 sanity)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2124/2124, e2e `masks.spec.ts` 360 px 4/4

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Muukalainen muiden pelaajien korteissa.
