# BRDC-OTHERWORLD-001 — Porttien läpi: Toinen maailma

| | |
|---|---|
| **Alue** | `rules/otherWorld.ts`, gate-store, oma pakka |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M–L |
| **Riippuvuudet** | DOOM-002, DOOM-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B3; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-09, haara `season-3`) |

## 🔴 RED

Portit suljetaan, mutta niihin ei mennä. Arkham Horrorin toinen maailma on sen mieleenpainuvin osa.

## 🟢 GREEN

- [x] Avoimen portin heksalla vaihtoehto "Astu sisään": 2–3 vaiheen kohtaaminen omasta pakastaan (Unimaa, Kaukainen Pyhäjärvi, Ulkoilma) samalla noppapoolilla — `rules/otherWorld.ts`: The Dreamlands / Far Pyhäjärvi / The Outer Air; portti avautuu aina samaan maailmaan (hash), matka = 2 kohtaamista; "Step through" portin kortissa (`OtherWorldJourney`), maksaa 1 healthin kuten koe
- [x] Onnistuminen sulkee portin ja antaa palkinnon; epäonnistuminen palauttaa tilan kanssa (CONDITION-001) ja portti jää auki — läpäisy sulkee portin sisältä gates-storen kautta (Doom kuulee, outbox −1) + 2 vihjettä; epäonnistuminen: sanity + kortin tila (paranoia, debt, cursed, dark-pact, amnesia)
- [x] Kesken jäänyt matka säilyy tallennuksessa (pending kuten portin heitto) — `K.otherWorld` { gateId, stage }, testattu
- [x] Puhtaat säännöt + testit; 9 korttia alkuun (3 per maailma) — `otherWorld.repo.test.ts`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — e2e `other-world.spec.ts` 360 px 3/3 (ensimmäinen gate-e2e ylipäätään)

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Toisessa maailmassa liikkuminen kartalla.
