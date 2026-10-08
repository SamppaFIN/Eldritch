# BRDC-CHOIR-001 — Pyhäjärven Hukkunut Kuoro

| | |
|---|---|
| **Alue** | deck, Reckoning, terrain |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | DOOM-003, DOOM-004 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C1; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Järvi on pelin keskeisin maisema, mutta sillä ei ole omaa uhkaa. Syvyyksien kansa (Innsmouth-analogi, omilla nimillä) antaa sille.

## 🟢 GREEN

- [x] Oma huhupakka järvi- ja rannikkoheksoille (6 korttia) ja tehtäväketju (3 vaihetta) Kuorosta — `rules/choir.ts`: 6 korttia jaetaan noin joka neljänteen järvihuhuun omalla hashillaan; ketju Tavernan taululla vaihe kerrallaan (`after`). Vaiheet eivät voi epäonnistua (kävele / tutki / valvo temppelissä), joten tulvan voi aina lopettaa
- [x] Reckoningissa järvi/rannikkoheksat "tulvivat": tuotto puolittuu kunnes ketju on ratkaistu — hex-kortin rivi "Flooded" (−½ kaikesta, myös maan omasta), settle lukee saman rivin; vaihe luetaan `K.mythos.phase`:sta, jonka `mythos.remember` nyt tallentaa
- [x] Lore Fuming Laken äänellä, Pyhäjärven paikannimillä — Viinikanlahti, Pispala, Pyynikki, Pyhäjärven lautturi
- [x] Testit: pakka valitaan maastosta, tulva vain Reckoningissa — `choir.test.ts` (myös kortti = settle -summa); Tavernan laskut päivitetty (+1 Kuoron ensimmäinen vaihe) yksikkö- ja e2e-testissä
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2128/2128, e2e `task-board.spec.ts` 360 px 2/2. Sivulöydös: täysikuun mana-rivi laski myös maan oman manan, jota settle ei kerro — korjattu samassa

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kuoron jäsenet NPC:inä kartalla.
