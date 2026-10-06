# BRDC-ERA-001 — Aikakauden luonne (Humankind)

| | |
|---|---|
| **Alue** | `rules/era.ts`, `data/eraStore.ts`, Lore-paneeli, Hall of Fame |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | PROG-004 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A4; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Lore-aikakaudet vaihtuvat ilman valintaa. Humankindin kulttuurivalinta jokaisella aikakaudella rakentaa identiteettiä.

## 🟢 GREEN

- [ ] Kun valtakunta saavuttaa uuden Lore-aikakauden, valitaan yksi kolmesta luonteesta (oletus: Kauppiaat +gold, Vartijat +strength, Näkijät +wisdom/mana) — pysyvä pieni bonus
- [ ] Valinta kerran per aikakausi, lukittu; Hall of Fame -merkintä kantaa luonteiden ketjun ("Kauppiaat → Näkijät")
- [ ] Bonus tulee YIELD-001-mallin kautta omana rivinään
- [ ] Puhtaat säännöt + testit; tallennus uusi avain
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Luonteiden visuaalinen identiteetti kartalla.
