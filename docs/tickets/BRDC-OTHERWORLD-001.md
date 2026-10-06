# BRDC-OTHERWORLD-001 — Porttien läpi: Toinen maailma

| | |
|---|---|
| **Alue** | `rules/otherWorld.ts`, gate-store, oma pakka |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M–L |
| **Riippuvuudet** | DOOM-002, DOOM-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B3; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Portit suljetaan, mutta niihin ei mennä. Arkham Horrorin toinen maailma on sen mieleenpainuvin osa.

## 🟢 GREEN

- [ ] Avoimen portin heksalla vaihtoehto "Astu sisään": 2–3 vaiheen kohtaaminen omasta pakastaan (Unimaa, Kaukainen Pyhäjärvi, Ulkoilma) samalla noppapoolilla
- [ ] Onnistuminen sulkee portin ja antaa palkinnon; epäonnistuminen palauttaa tilan kanssa (CONDITION-001) ja portti jää auki
- [ ] Kesken jäänyt matka säilyy tallennuksessa (pending kuten portin heitto)
- [ ] Puhtaat säännöt + testit; 9 korttia alkuun (3 per maailma)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Toisessa maailmassa liikkuminen kartalla.
