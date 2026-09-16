# BRDC-RES-001 — 38 bonusresurssia: 10 vanhaa ja 28 uutta rinnakkain, alueittain

| | |
|---|---|
| **Alue** | `rules/bounty.ts`, `rules/holdings.ts`, `features/territory/bounty.ts`, `CellOn.tsx`, `RevealControl.tsx`, `LandsPanel.tsx`, `territoryFeatures.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M–L |
| **Status** | `done` — ajettu ja todennettu 2026-09-16 |
| **Riippuvuudet** | `BRDC-TERRAIN-005`, `BRDC-SEED-003` (jako), `BRDC-SEED-004` (siemenluku) |
| **Lähde** | `worldseed.ts` (`BONUS_RESOURCES`, `ZONE`, `depositCount`, `allocate`), Worldseed §03 *One to three per area* |

## 🔴 RED

**Nyt** (`rules/bounty.ts:57-118`): 10 löytöä, yksi resurssi kukin, heksa kerrallaan hajautus.

**Päätös (`BRDC-SEED-000` D2, D3): ei muunnosta — liitos.** Kaikki 10 vanhaa pysyvät. 28 uutta
(`worldseedAllocate.ts`, jo olemassa `BRDC-SEED-003`:sta) lisätään rinnalle.

**Uusi ongelma löytyi toteutuksessa:** kuusi ID:tä (`fish`, `deer`, `wheat`, `granite`, `marble`,
`gems`) on **molemmissa** tauluissa, eri määritelmillä — sama sana, kaksi eri löytöä. Pelkkä
ID ei riitä kertomaan kumpaa taulua lukea. Ratkaisu: `bountyOn` palauttaa nyt
`{ id, pool: 'legacy' | 'worldseed' }`, ei paljasta merkkijonoa — kummankin taulun sama sana
elää siis rinnakkain ilman törmäystä, täsmälleen D2/D3:n hengessä.

## 🟢 GREEN

- [x] Bonusresurssitaulu jo olemassa `worldseedAllocate.ts`:ssä (`BRDC-SEED-003`) — ei
      kaksinkertaistettu tässä
- [x] **Seedatulla alueella** (`hexSeedOf(h3)`, `BRDC-SEED-004`): `bountyOn` **lukee**, ei
      arvo. Solu jolla on siemen mutta ei löytöä palauttaa `null` suoraan — alueen oma
      poissaolo on yhtä auktoritatiivinen kuin läsnäolo, ei arvottava uudelleen hajautuksella
- [x] **Seedatun alueen ulkopuolella:** yksi yhdistetty painotettu arvonta kahdesta
      poolista — vanhat tasapainolla 1, uudet `affinity[maasto] × rarity`:lla, sama kaava
      kuin `allocateArea`. `BOUNTY_SHARE` (0,125) ei muutettu — "sama tiheys kuin ennen"
      tulkittiin vanhan, jo testatun arvon säilyttämiseksi eikä Worldseedin oman ~5 %:n
      tiheyden tuomiseksi tähän kerrokseen (se tiheys on jo `DEPOSIT_DENSITY`, alueiden
      omassa hajautuksessa)
- [x] **Monituotto:** `bountyYield`/`bountyBonus` summaavat kaikki `BonusResourceDef.yields`in
      resurssit, ei vain ensimmäistä. Vanhat 10 pysyvät yksituottoisina, koskematta
- [x] **Vaatimusliput:** alueen ulkopuolella liput ovat aina tyhjät (ei survey-dataa), joten
      mikään `require`illinen (leycrystal, oak, sauna…) ei koskaan arvo hajautuksesta —
      todennettu testillä, ei vain väitetty
- [x] **ID-törmäys ratkaistu:** `BountyPick { id, pool }` -tyyppi jokaisessa kutsupaikassa —
      `holdings.ts`, `CellOn.tsx`, `RevealControl.tsx`, `LandsPanel.tsx`, `territoryFeatures.ts`
      (`bountyInk`, kartan `bounty`/`bountyColor`-ominaisuudet). Uudet nimet/glyfit
      (`features/territory/bounty.ts`in `bountyPickName/Glyph/Line`) resolvoivat kumman
      tahansa poolin; editorin oma `BOUNTY_NAME`/`BOUNTY_GLYPH` (vain vanha 10) koskematta
- [x] Kartalla worldseed-poolin löydöllä ei ole vielä ikonia (`BRDC-RES-002` piirtää sen) —
      matalan zoomin väripiste (`CELL_BOUNTY_BADGE_LAYER`) näyttää silti oikean sävyn,
      lähizoomin ikoni jää puuttumaan väliaikaisesti (kartan jo olemassa oleva
      "ei ikonia → ei mitään" -sietokyky, ei uusi aukko)
- [x] Testit: 17 `bounty.test.ts`issa (5 uutta) — seedatun heksan suora luku, seedatun
      poissaolon ei-uudelleenarvonta, monituoton summa, vaatimuslipun esto, determinismi
      korjattu `toEqual`ksi (uusi olio joka kutsulla). Regressio: kaikki vanhat testit
      (herd/furs/amber/spice mukaan lukien) läpäisevät muuttumattomina
- [x] Portti: 1518 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Ei tässä

- Kuvat 28 uudelle löydölle — `BRDC-RES-002` (yksi jaettu paikkamerkki-glyfi `✦` toistaiseksi)
- Editorin käsinmaalaus laajennettuna 38:aan — jätetty koskematta, ei pyydetty
