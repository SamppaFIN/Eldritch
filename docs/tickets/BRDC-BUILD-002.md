# BRDC-BUILD-002 — Aluekohtaiset parannukset ja päivitysketjut

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-TERRAIN-002 |
| **Status** | `done` — 2026-09-01 (UI `[~]` selaimessa todentamatta) |
| **Valmius** | 95 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.2, §6 (R2) |

## 🔴 RED

Perusrakennukset voi pystyttää minne tahansa. Mikään ei vielä palkitse siitä, että
kotikulmilla **sattuu olemaan** metsä, järvi tai kallio — eli siitä ainoasta asiasta,
jota pelaaja ei voi valita ja joka tekee jokaisesta läänistä erilaisen.

## 🟢 GREEN

- [x] Seitsemän parannusta `BUILDINGS`:ssa: `sawmill, lumbermill, mine, quarry, farm,
      fishery, vineyard`
- [x] Jokainen sitoo maaston (`terrain: [...]`), `canBuild` → `wrong-terrain` nimeltä
- [x] **Ketjut datassa**: `lumbermill.requires = ['sawmill']`, `quarry.requires = ['mine']`.
      `canBuild`:n `requires`-sääntö: ketjurakennus on **vain edeltäjän paikallaan-päivitys**
- [x] Päivitys **korvaa** — `buildOn` kirjoittaa `cell.building`in yli, täysi hinta, ei
      hyvitystä; tuotto johdetaan `cell.building`ista → vanha katoaa, ei pinoudu
- [x] **`fishery` +1 token/päivä** — `producesPerDay`, `ResourceState.sinceDay` (oma
      kello), `settleResources` maksaa kokonaisen vuorokauden kerrallaan; sama määrä
      tilitettiin tunneittain tai kerran (`terrain.test.ts`)
- [x] Tuotto kulkee `settleResources`:n läpi — sama katto ja lepotila kuin ECON-001:ssä
- [x] Solupaneeli (`BuildPanel`): 11 rakennusta, **rakennettavat ensin**, muut syineen;
      solussa jo oleva rakennus näyttää päivitysrivin ("Upgrade")

## Toteutettu 2026-09-01

- `rules/build.ts`: 7 riviä + `Building.producesPerDay?`, `buildingDayBonus`
  (`buildingBonus`:n pari `sumOver`-apurilla), `canBuild`:n ketju/päivitys-sääntö
  (päivitys ei törmää rakennuskattoon).
- `rules/terrain.ts`: `ResourceState.sinceDay?` (additiivinen, `?? since`, **ei
  skeemanostoa**), `settleResources` 6. parametri `bonusPerDay` + oma vuorokausikello.
  `MS_PER_DAY` → `constants.ts`.
- `data/pouch.ts`: `settlePouch` syöttää `buildingDayBonus`:n; tyhjä `read()` saa `sinceDay`.
- `data/buildStore.ts`: **ei muutosta** — `buildOn` kirjoitti jo `cell.building`in yli.
  Tiketin hyväksymiskoe ("ei uutta koodia ytimen päälle") melkein läpi: uutta on vain
  paikallaan-päivitys ja vuorokausikello, molemmat GREEN-kohtia.
- Testit: `build.test.ts` +8, `terrain.test.ts` +2, `build.repo.test.ts` +2. **547 vihreää.**

## Toteutus

Nämä ovat pelkkää dataa `BUILDINGS`-taulukossa: `requiredTerrain` ja `requires`.
Jos tämä tiketti tarvitsee uutta koodia `BRDC-BUILD-001`:n päälle, ydin on rakennettu
väärin — se on tämän tiketin oikea hyväksymiskoe.

**Ketjun mielekkyys tulee hinnasta, ei tuotosta.** Sahalaitos maksaa 80 puuta ja
30 rautaa tuottaakseen +8 siinä missä Puusaha tuottaa +5 neljälläkymmenellä. Rauta
tulee vuorelta, jota metsäläänissä ei ole — eli päivitys pakottaa laajentamaan
maastoa, ei vain odottamaan. Se on kävelyä, ja se on oikea suunta.

## Ei tässä

- Kauppareitti kahden heksan välillä. Se on aluevaikutus → `BRDC-BUILD-003`
- Erikoisresurssit ihmeistä → `BRDC-WONDER-001`
