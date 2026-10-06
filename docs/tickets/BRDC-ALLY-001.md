# BRDC-ALLY-001 — Liittolaiset

| | |
|---|---|
| **Alue** | investigator (`voice`-malli), tehtävät |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | QUEST-009, INVEST-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B6; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

NPC:t (Cornelius, Grug, Merchant) ovat vain tekstiä. Arkham Horrorin liittolaiset tekevät niistä apua.

## 🟢 GREEN

- [ ] Tietyt tehtävät antavat liittolaisen: Cornelius +1 Lore-noppa, Grug +1 Vigor-noppa, Merchant −10 % Workien hinta (oletus)
- [ ] Yksi liittolainen kerrallaan; uusi korvaa vanhan valinnalla
- [ ] Liittolainen näkyy tutkijan kohdalla Keepissä muotokuvan vieressä
- [ ] Puhtaat säännöt + testit; noppavaikutus käyttää olemassa olevaa lisänoppamallia
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Liittolaisen menettäminen.
