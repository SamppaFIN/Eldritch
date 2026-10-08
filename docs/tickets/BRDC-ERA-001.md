# BRDC-ERA-001 — Aikakauden luonne (Humankind)

| | |
|---|---|
| **Alue** | `rules/era.ts`, `data/eraStore.ts`, Lore-paneeli, Hall of Fame |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | PROG-004 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A4; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Lore-aikakaudet vaihtuvat ilman valintaa. Humankindin kulttuurivalinta jokaisella aikakaudella rakentaa identiteettiä.

## 🟢 GREEN

- [x] Kun valtakunta saavuttaa uuden Lore-aikakauden, valitaan yksi kolmesta luonteesta (oletus: Kauppiaat +gold, Vartijat +strength, Näkijät +wisdom/mana) — pysyvä pieni bonus — Merchants +2 gold/h, Wardens +1 stone +1 timber/h, Seers +1 wisdom +1 mana/h. **Poikkeama oletuksesta:** Vartijat maksavat kiveä ja puuta, ei strengthiä, koska strength ei ole tuotto ja bonuksen piti kulkea YIELD-001:n kautta
- [x] Valinta kerran per aikakausi, lukittu; Hall of Fame -merkintä kantaa luonteiden ketjun ("Kauppiaat → Näkijät") — `pendingEra`, `eraApi.choose` → `none-pending`; `HallOfFameEntry.eras`, näkyy Hallissa
- [x] Bonus tulee YIELD-001-mallin kautta omana rivinään — `realmOnlyYield` "Age: Merchants", `realmBonus` sama summa (testattu); pouch tilitetään vanhalla tahdilla ennen valintaa
- [x] Puhtaat säännöt + testit; tallennus uusi avain — `rules/era.ts`, `K.eras`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2058/2058, e2e `era.spec.ts` 360 px vihreä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Luonteiden visuaalinen identiteetti kartalla.
