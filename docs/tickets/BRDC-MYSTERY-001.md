# BRDC-MYSTERY-001 — Kauden kolme mysteeriä

| | |
|---|---|
| **Alue** | Worker, Reckoning, anomaliaketjut |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | L |
| **Riippuvuudet** | DOOM-004, TERROR-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B5; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-09, haara `season-3`) — vaatii Workerin deployn kauden 3 avautuessa |

## 🔴 RED

Reckoning tulee, ja yhteisö häviää tai voittaa vain Muinaisen osumapisteillä. Eldritch Horrorin mysteerit antavat yhteisen tarinan ja tavan heikentää Muinaista.

## 🟢 GREEN

- [x] Kaudella on kolmen mysteerin ketju; kukin ratkeaa kun yhteisö kerää yhteensä N vihjettä (oletus 30) tai sulkee M porttia — `rules/mystery.ts`: 30 vihjettä tai 5 porttia per mysteeri, vahvempi tie ratkaisee; vihjeet = tutkijan kauden `cluesGathered` (laskee `addClues`, käytetyt ja katon yli menneet mukaan)
- [x] Worker laskee yhteiset edistymät; ratkaistu mysteeri −20 % Muinaisen maxHP Reckoningissa (oletus) — Worker: `sealedGates` portti-viesteistä, `POST /season/clues` per valtakunta (vain ylöspäin, katto 60/valtakunta), summa `cluesGathered`; `toReckoning` leikkaa `mysteryHp`
- [x] Jokaisella mysteerillä luku tarinaa, joka avautuu kaikille ratkaisun hetkellä — Keepin "The town's mysteries"
- [x] Offline-pelaaja näkee viimeisimmän tunnetun tilan — `mythos.remember` tallentaa luvut, `mythos.known()` lukee ne, Keep kertoo "As last heard"
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2146/2146, e2e `mysteries.spec.ts` 360 px 2/2

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Mysteerien yksinpeliversio.
