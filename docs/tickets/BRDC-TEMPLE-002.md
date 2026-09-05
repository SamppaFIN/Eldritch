# BRDC-TEMPLE-002 — Temppeli on tutkimusrakennus: koulukunnat ja per-temppeli riitit

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L–XL (mekaniikan uudelleensijoitus: tutkimus Keepistä temppeliin) |
| **Riippuvuudet** | BRDC-TEMPLE-001 (valmis), BRDC-TECH-001, BRDC-SPELL-001, BRDC-KEEP-002 |
| **Status** | `done` (2026-09-05) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 — *"temppeli = tutkimusrakennus"* |

## 🔴 RED

Infinite: *"temppelimuutosten tarkoitus on, että käyttäjällä ei ole nyt mitään paikkaa
mistä oppia rituaaleja tai teknologioita. Nytkin Keep-valikon alla on 'rakenna temppeliä',
mutta mä haluan oppia riitit ja teknologiankin jostain."*
Ja: *"vihit temppelin, valitset koulukunnan (tuli/vesi/maa/ilma/luonto/henki), ja siitä
temppelistä opit sen koulukunnan riitit/taiat."*

Nyt tutkimus (`TECHS`, `researchTech`) tapahtuu **Keepissä** — abstraktilla "wisdom"-
resurssilla, ilman paikkaa. `BRDC-TEMPLE-001` teki temppelistä *saatavan* (vihittävän
resursseilla), mutta se on yhä pelkkä manalähde. Temppelillä ei ole roolia, ei
koulukuntaa, eikä mitään opita siitä. Loitsujen `SpellSchool` on tällä hetkellä
toiminnallinen (`research | protection | block | dominion`), ei elementaalinen.

`BRDC-TEMPLE-001`:n `consecrateAt` **ei lukitse temppelin roolia** — se kirjoittaa vain
`K.dwell`-arvon. Koulukunta voidaan siis lisätä päälle ilman uudelleenrakennusta.

## 🟢 GREEN

- [x] **Koulukunta valitaan — vihkimisen jälkeen, omassa paneelissaan.** `consecrateAt` ei
      muuttunut: `assignSchool(store, h3, school, owned, now)` (`data/templeStore.ts`)
      kirjoittaa `K.templeSchool: Record<h3, TempleSchool>`, kertavalinta (`already-chosen`),
      `not-yours` / `not-a-temple` -guardit. Sama polku uusille ja vanhoille temppeleille —
      `null` kunnes valittu. `TempleSchool = 'fire'|'water'|'earth'|'air'|'nature'|'spirit'`
      (`rules/tech.ts`, `TEMPLE_SCHOOLS`).
- [x] **Riitit ja loitsut saavat koulukunnan.** `Tech.school?` asetettu `fortification`
      (earth) · `guild-craft` (air) · `astronomy` (spirit) — vain riitin avaavat 3/10.
      `rules/spell.ts#SpellSchool` = `TempleSchool` (alias, ei kolmatta akselia); `SPELLS`
      päivitetty: insight→spirit, bulwark→earth, snare→earth, dominion→air.
- [x] **Tutkimus siirtyy temppeliin.** `researchTech(id, owned, home, now)` torjuu
      `needs-a-temple` ennen pouchia, jos koulukunnan temppeli ei ole hereillä
      (`awakeSchools`, sama `DORMANT_AFTER_MS`). Keepin Research-välilehti näyttää
      `researchableSchoolless`, temppelin `TempleSchoolPanel` (`CellPanel`) `researchableFor`.
      Jaettu `TechRow` — Keep ja temppeli eivät voi visuaalisesti erkaantua.
- [x] **Per-temppeli, ei per-pelaaja.** `awakeSchools` on `Set<TempleSchool>` — olemassaolo,
      ei laskuri. Testi `templeSchool.repo.test.ts`: "a second temple of the same school
      does not change the outcome".
- [x] **Wisdom-talous.** Wisdom pysyy valuuttana; temppeli on portti, ei uusi resurssi
      (`ResourcePool` on kiinteä 9). Altar-kanavointi ennallaan.
- [x] **UI.** `TempleSchoolPanel.tsx` — kuusi `RitualButton`ia, yksi monokromi-glyfi per
      elementti (△ ≈ ▦ ◇ ❋ ✦), ei alasvetoa. Valittuaan: "{Elementti} temple" + opittavat
      rivit tai "Nothing yet — its rites are still unwritten". `docs/backlog`-lore ei
      laskeudu vielä (erikseen, kun kehys on todettu — `golden rule #6`).
- [x] **Persistointi + testit.** `K.templeSchool` (`keys.ts`), `resetAll` = `store.clear()`
      siivoaa. Ei `SCHEMA_VERSION`-nostoa (puuttuva avain = `{}`). Testit ajettu:
      `templeSchool.repo.test.ts` (8) · `tech.test.ts` (`researchableFor` /
      `researchableSchoolless`) · `spell.test.ts` (jokainen loitsu koulukunta = teknologian
      koulukunta) · `describe.test.ts` (loki-rivi). `pnpm test` 948 vihreää.

## Toteutuksen huomiot (2026-09-05)

- **Koulukunta ei ole `consecrateAt`-parametri.** RED ehdotti valintaa "vihkimisen
  yhteydessä", mutta vihkiminen tapahtuu joko dwellillä tai resursseilla — valinta istuu
  paremmin erillisessä `TempleSchoolPanel`-osiossa, joka kattaa myös TEMPLE-001-polun
  vanhat temppelit ilman erikoiskoodia. `assignSchool` on `wardWith`-muotoinen
  puhdas-sääntö + ohut store-verbi.
- **e2e supistettu.** `apps/game/e2e/temple.spec.ts` todentaa Keepin puolen
  (`researchableSchoolless` — astronomy ei näy Keepissä vaikka esiehdot täyttyvät).
  Koko klikkiläpi (valitse koulukunta → tutki riitti temppelistä) vaatii pelaajan
  seisomaan dwelatussa, omistetussa heksassa reloadin yli, mitä kartta/GPS-kerros ei tee
  toistettavaksi skriptissä (n. 75 % läpäisy, GPS-latch reloadin jälkeen). Logiikka on
  `templeSchool.repo.test.ts`:ssä; komponentti on suora prop-JSX.

## Ei tässä

- Uudet riitit tai loitsut itsessään — tämä sijoittaa olemassa olevat koulukuntiin.
      Sisältö tulee `docs/backlog/`:sta erillisinä lisäyksinä kun kehys on paikallaan.
- Manan `manaRate`-tasapaino ja wisdom-kurssit.
- Temppelin visuaalinen tyyli kartalla (Place-markkeri on jo).
- Koulukuntien väliset suhteet / vastakkainasettelut — oma tikettinsä jos tulee.
