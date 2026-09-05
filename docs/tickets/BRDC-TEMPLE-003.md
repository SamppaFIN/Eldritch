# BRDC-TEMPLE-003 — Jokainen koulukunta opettaa, koko ketju temppelistä, ja kaikki kertoo mitä antaa

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-TEMPLE-002, BRDC-KEEP-006, BRDC-KEEP-007, BRDC-SPELL-001 |
| **Status** | `done` (2026-09-05) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-05: *"temppeleillä ei voi opetella riittejä"* + *"sen lisäksi haluan, että joka teknologia, riitti ja rakennus myös kertoo mitä ne hyödyttää.. kuvaus ja plussat mitä antaa"* |

## 🔴 RED

`TEMPLE-002` antoi temppelille koulukunnan ja siirsi kolme riittiteknologiaa
(`fortification`/earth, `guild-craft`/air, `astronomy`/spirit) Keepistä temppeliin.
`KEEP-006` lisäsi opasteen *"research X first — in the Keep"* ja `KEEP-007` teki
Researchista oman dialoginsa. Kolme asiaa jäi silti rikki, kenttä vahvisti:

1. **Fire, water ja nature eivät opeta mitään.** `SPELLS`-taulussa on vain neljä
   loitsua (insight, bulwark, snare, dominion) → kolmella koulukunnalla ei ole
   riittiä. `nextResearchStep` palauttaa niille `null`, ja `TempleSchoolPanel`
   putoaa tekstiin *"Nothing yet — its rites are still unwritten."* Koulukunnan
   valinta on lopullinen (`already-chosen`), joten fire-temppelin valinta on
   umpikuja josta ei pääse pois.
2. **Esiehtoja ei voi tutkia temppelistä.** Toimivakin temppeli (earth/air/spirit)
   sanoo *"research Masonry first — in the Keep"*: pelaaja pomppii temppelin ja
   Research-dialogin väliä. Infinite: *"Kyllä — koko ketju temppelistä"* — koko
   esiehtoketju juurista riittiin, tutkittavissa siinä samassa paneelissa.
3. **Mikään ei kerro mitä se antaa.** Tekniikkarivi näyttää nimen ja hinnan;
   rakennusrivi nimen, hinnan ja maaston; riittinappi nimen ja manan. Ei kuvausta,
   ei konkreettista hyötyä ("+5 puuta/h"). Pelaaja tutkii ja rakentaa sokkona.

## 🟢 GREEN

### Kaikille kuudelle koulukunnalle riitti

- [x] **Kolme uutta koulukunnallista teknologiaa** `rules/tech.ts` `TECHS`:iin, kaikki
      `era: 'medieval'`:
      - `smithing` — `school: 'fire'`, `cost: 150`, `requires: ['mining']`
      - `tide-lore` — `school: 'water'`, `cost: 140`, `requires: ['seafaring']`
      - `wildcraft` — `school: 'nature'`, `cost: 120`, `requires: ['forestry']`
      `TechId`-unioniin kolme jäsentä. DAG-testi (`tech.test.ts`) kattaa ne
      automaattisesti — kaikki esiehdot ovat aiempaa aikakautta.
- [x] **Kolme uutta riittiä** `rules/spell.ts` `SPELLS`:iin, kaikki
      `via: 'home'`, `scope: 'domain'` — sama `domainBonusPerH`-malli kuin `insight`,
      ei uutta efektikoodia:
      - `forgeheart` — fire, `tech: 'smithing'`, `{ iron: 4 }`/h, 18 h, 50 manaa
      - `wellspring` — water, `tech: 'tide-lore'`, `{ food: 5 }`/h, 16 h, 45 manaa
      - `greenwake` — nature, `tech: 'wildcraft'`, `{ wood: 6 }`/h, 16 h, 40 manaa
      `SpellId`-unioniin kolme jäsentä. `SPELL_NAME` (`names.ts`) saa kolme nimeä.
- [x] `spell.test.ts` — taulutesti *"every spell has a real unlocking tech, in the
      same school"* menee läpi kolmella uudella; `domainSpellBonus` poimii ne.
      `SpellPanel.test.ts` `HOME_SPELLS` = `bulwark · forgeheart · greenwake ·
      insight · wellspring`.

### Koko ketju temppelistä

- [x] **`riteChain(researched, school)`** (`rules/tech.ts`, uusi, korvaa
      `nextResearchStep`in): koulukunnan riittiteknologia ja *kaikki* sen esiehdot,
      juuret ensin, jo tutkitut pudotettuina. `[]` kun riitti on jo tiedossa.
      Post-order DFS. Testit: juuret ensin · tutkitut pois · `[]` kun opittu ·
      toimii kaikille kuudelle koulukunnalle.
- [x] **`nextResearchStep` poistuu** — sillä ei ole enää kutsujaa. Funktio, sen
      barrel-export (`rules/index.ts`) ja `tech.test.ts`:n `nextResearchStep`-describe
      poistuvat. `tech.test.ts` rivi 83: `researchableFor(researched, 'water')` ei ole
      enää `[]` vaan `['tide-lore']`.
- [x] **`TechRow` saa `locked?: boolean`** (`ResearchPanel.tsx`): kun `locked`,
      napin tilalle vaimea *"Locked"* — esiehdot eivät ole vielä täynnä. Keepin
      lista ei välitä `locked`ia (sen `options` on aina frontier) → ei muutosta siihen.
- [x] **`TempleSchoolPanel` renderöi ketjun.** `researchableFor` + `nextResearchStep`
      → `riteChain`. Jokainen ketjun askel on `TechRow`,
      `locked={!canResearch(researched, id)}`. Kun `riteChain` on tyhjä: rivi
      *"Its Rite, {nimi}, is yours. {efekti}"*.

### Kuvaus ja plussat kaikille

- [x] **`catalogue.ts` (uusi, app).** Käsinkirjoitetut yhden lauseen kuvaukset
      (`TECH_BLURB` 13, `SPELL_BLURB` 7, `BUILDING_BLURB` 15) + `SCHOOL_RITE`
      (`Record<TempleSchool, SpellId>`) + puhtaat lasketut apurit:
      - `buildingEffect(id)` — `BUILDINGS[id]`:stä: `produces` → `"+5 wood / h"`,
        `producesPerDay` → `"+1 token / day"`, `storageCapBonus` → `"+250 storage cap"`,
        `buildingCapacity` → `"+3 build slots"`, `aura` → `"+1 wisdom / h within 1"` /
        `"−30 to attacks within 1"`.
      - `spellEffect(id)` — `SPELLS[id]`:stä: `domainBonusPerH` + kesto →
        `"+6 wisdom / h to the domain · 12 h"`; `bulwark` erikseen →
        `"Shelters this cell from decay · 24 h"`.
      - `techUnlocks(id)` — skannaa `BUILDINGS` + `SPELLS` + `TECHS`:
        `{ buildings, rites, techs }` → `"Unlocks Sawmill, Lumbermill"` /
        `"Unlocks the Forgeheart rite"` / (jos ei kumpaakaan) `"Leads to Masonry, Mining"`.
      `catalogue.test.ts`: jokaisella `BuildingId`/`SpellId`/`TechId`:llä on blurb;
      `SCHOOL_RITE`-arvon koulukunta täsmää; `buildingEffect`/`spellEffect`/`techUnlocks`
      muutamalla tunnetulla syötteellä.
- [x] **`TechRow`** näyttää nimen alla `TECH_BLURB[id]` ja `techUnlocks`-rivin —
      näkyy sekä Research-dialogissa että temppelipaneelissa (jaettu komponentti).
- [x] **`SpellPanel`** — paikallinen `WHAT`-map → `SPELL_BLURB` + `spellEffect(id)`.
- [x] **`BuildPanel`** — build-rivi saa `BUILDING_BLURB[id]` + `buildingEffect(id)`.
- [x] **`KeepBuildingsPanel`** — katalogirivi saa blurbin + `buildingEffect`.
- [x] **`ResearchPanel` `REFUSAL['cannot-afford']`** ja muut kosketetut copyt jäävät
      ennalleen ellei tekstissä lue nyt väärin.

### Portti

- [x] `node scripts/check-line-limit.mjs && npx tsc -b --force && npx vitest run &&
      MSYS_NO_PATHCONV=1 VITE_BASE_PATH=/ pnpm build` vihreä.
- [x] `apps/game` e2e `research.spec.ts` (`/1\/13 known/i`) + `temple.spec.ts` +
      `dialogs.spec.ts` molemmilla projekteilla.
- [x] Versio 0.5.37 → 0.5.38 (`APP_VERSION`, molemmat `package.json`, `CLAUDE.md`);
      changelog-lohko; commit `main`iin.

## Vaikutus

- **`BRDC-KEEP-006`** `nextResearchStep`-opaste katoaa temppelistä — koko ketju on nyt
  siinä. Wisdom-lähderivi (`ResearchPanel`, `KEEP-007`:n `ResearchDialog`) jää.
- **`BRDC-SPELL-002`** (Scrying + snare/dominion kotiin) ei muutu — se on eri työ.
  Air-temppelin riitti on yhä `dominion` (`via: 'wager'`); temppeli sanoo *"is yours —
  carried into a Wager"* eikä tarjoa koticastia. Fire/water/nature ovat kotiriittejä.

## Ei tässä

- Uusi efektimalli fire/water/naturelle — ne ovat toistaiseksi "insight toiselle
  resurssille". Jos fire halutaan tekemään jotain hyökkäävää, se on jatkotiketti.
- Koulukunnan vaihtaminen jälkikäteen. Valinta on yhä lopullinen; nyt jokainen valinta
  johtaa riittiin, joten umpikujaa ei ole.
- Temppelin riittitutkimuksen e2e polku (paneeli `CellPanel`issa vaatii pelaajan
  seisomaan dwell-solussa reloadin yli — ei skriptattavissa). Katettu `tech.test.ts` +
  `templeSchool.repo.test.ts` + `catalogue.test.ts`.
- Wisdom-/mana-talouden numeroiden viilaus.
