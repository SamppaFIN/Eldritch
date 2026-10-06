# BRDC-MYTHOS-001 — Mythos-kortti jatkumoksi

| | |
|---|---|
| **Alue** | `rules/doom.ts` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | DOOM-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B7; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Päivän Mythos-kortti on yksittäinen sääntö ilman jatkumoa. Arkham Horrorin mythos-vaihe kertoo kaupungin tarinaa päivä päivältä.

## 🟢 GREEN

- [ ] Mythos-kortit ryhmitellään 3–4 päivän ketjuiksi ("kalastaja katosi" → "löytyi rannalta" → "puhuu toisella äänellä") — sama siemen, deterministinen
- [ ] Uutisotsikko näkyy kävelyarkissa kerran päivässä (pinoutuva kortti, ei ajastinta)
- [ ] DOOM-001:n avoin `[~]`: Mythos-säännöillä on vihdoin vaikutus (tuotanto/noppa) — kytketään
- [ ] Testit: ketju etenee päivittäin, sama kaikilla
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Pelaajien kirjoittamat uutiset.
