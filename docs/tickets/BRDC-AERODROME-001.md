# BRDC-AERODROME-001 — Härmälän lentokenttä: Ulkoilman kiitorata

| | |
|---|---|
| **Alue** | Fuming Lake -seikkailu, gates |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | QUEST-008, DOOM-002 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C5; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Fuming Lake päättyy palvelukseen; potkuripojan potkurilla ei ole jatkoa. Härmälän vanha lentokenttä on luonteva seuraava näyttämö.

## 🟢 GREEN

- [x] Fuming Laken jälkeen avautuu jatko-osa: taivasportit lentokentän yllä, potkuri on avain — "The Skyward Runway" (`after: fuming-lake`): ei hyllyssä eikä aloitettavissa (`locked`) ennen Fuming Laken loppua
- [x] 4–5 vaiheen seikkailu (adventures.json-muoto), sijainnit lentokentän alueella — 5 vaihetta: hangar → tower → windsock → runway → sky-gate (+ radiosilmukka). **Paikat oletuksia** patsaalta mitattuna (200–850 m lounaaseen), Infinite tarkistaa oikeaa kenttää vasten. Seikkailujärjestelmä yleistetty usealle tarinalle: `ADVENTURE_PATH`, `visibleAdventureSites`, `questCellInfo(h3, tales…)`, aloitus kunkin tarinan ensimmäiseltä pysäkiltä — sama pohja palvelee QUEST-006:n toista tarinaa
- [x] Lopussa pelaaja saa kertakyvyn sulkea taivasportin kaukaa — `grants: 'gate-seal'` → `K.propeller`; Keepin porttiosiossa "The propeller" (kaksi napautusta, säilyy jos portteja ei ole auki). Keep-nappi testattu vain yksikkötasolla
- [x] QUEST-008:n lopputulos tallentuu — sama `QuestOutcome`, testattu `aerodrome.repo.test.ts`:ssä
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2132/2132, e2e `aerodrome.spec.ts` + `adventure.spec.ts` + `quest-outcome.spec.ts` 360 px 2×3/3

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Lentäminen kartalla.
