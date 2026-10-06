# BRDC-EUREKA-001 — Eurekat: kävely vie tutkimusta

| | |
|---|---|
| **Alue** | `rules/eureka.ts`, `data/loreStore.ts`, `data/stepStore.ts` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | PROG-004 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A1; Infinite hyväksyi kaikki |
| **Status** | `done` — 2026-10-06 (haara `season-3`) |

## 🔴 RED

Lore tutkitaan vain maksamalla wisdomia. Civ VI:n paras keksintö — *tee asia, niin opit sen puoleen hintaan* — puuttuu, vaikka kävelypeli on sille luonteva: pelaaja liikkuu joka tapauksessa.

## 🟢 GREEN

- [x] Jokaisella 16 Lorella yksi eureka-ehto luettuna tilasta (pidetty maasto, Work pystyssä, löydetyt temppelit, paljastetut heksat, valmis anomalia) — puhdas `eurekaFor(id, state)` (`rules/eureka.ts`) + `eureka.test.ts`
- [x] Täyttynyt eureka laskee hinnan 50 % (oletus, `EUREKA_DISCOUNT`) näkymässä ja maksussa (`canStudy` saa hinnan); Lore-rivillä "Eureka · Hold 3 forest hexes · 2/3" tai kullalla "✦ Eureka · … — half price"; täyttyessä kortti (`EurekaMoment`, pinoutuva) kerran (`K.eurekaSeen`) — `eureka.repo.test.ts`, e2e `eureka.spec.ts`
- [x] Eureka koskee vain tutkimatonta Lorea; ehto luetaan valtakunnan nykytilasta, joten mitään ei lasketa taaksepäin (ei laskuria, jota pitäisi alustaa)
- [x] Kävelyyn sidottu osa tulee pidetystä maasta (askel valtaa heksan) — ei toista laskuria; "askelia N" -tyyppisiä ehtoja ei tehty, koska solu ei muista kävelyhistoriaa
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Eurekat vanhalle `tech.ts`-puulle (poistumassa).
