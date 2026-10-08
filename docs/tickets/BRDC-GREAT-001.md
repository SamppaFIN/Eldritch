# BRDC-GREAT-001 — Suurhenkilöt

| | |
|---|---|
| **Alue** | `rules/greatPeople.ts`, `data/greatStore.ts`, `wonderActs` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | WORKS-002, ALLY-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A6; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Civin suurhenkilöt antavat nimetyn hahmon ja kertaluonteisen suuren teon. Meillä NPC:t ovat vain tekstiä.

## 🟢 GREEN

- [x] Tietyt Works keräävät pisteitä tunnissa (Library → Scholar, Market → Merchant, Temple Grove → Mystic) — puhdas kertymä + testit — `greatRate`: 1 p/h per Work valveilla olevalla maalla, Season 2:ssa vain miehitetty
- [x] 100 pisteellä (oletus) syntyy nimetty hahmo (Fuming Laken ja Tampereen omista nimistä), jolla on yksi kertakyky: sulje lähin portti / paljasta 3 rengasta / kaksinkertainen sato 24 h — seuraava samaa lajia +50 p; Scholar: 3 rengasta Hearthin ympäriltä nähdyksi, Merchant: päivän tuotanto kerralla (= tuplasato), Mystic: lähin portti kauempaa
- [x] Kyky käytetään kerran ja hahmo siirtyy Hall of Fameen; kyvyt käyttävät `wonderActs`-mallia — tekodata `GREAT[kind].deed` + store-switch kuten `wonderActStore`; `HallOfFameEntry.greats`. Storen operaatiot sarjallistettu (rinnakkainen luku pyyhki käytetyn teon — e2e löysi)
- [x] Kortti kun hahmo syntyy (pinoutuu, ei ajastinta) — `GreatBirth` reunakortti; Keepissä `KeepGreat` (kaksi napautusta)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2100/2100; e2e `great.spec.ts` 360 px 5/5 vihreä viimeisen korjauksen jälkeen (aiemmin 1/5 punainen: rinnakkaiset luvut + Keepin uudelleenmountti — korjattu sarjallistuksella ja pysyvällä "done"-rivillä)

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Suurhenkilöiden kilpailu muiden pelaajien kanssa.
