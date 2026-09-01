# BRDC-BUILD-003 — Vaikutusalueen rakennukset ja uskollisuus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-HEX-001, BRDC-DWELL-001 |
| **Status** | `in_progress` — 2026-09-01: auravat rakennukset + uskollisuus tehty; Linnoitus, Kauppareitti ja karttaoverlay → BRDC-BUILD-004 |
| **Valmius** | 60 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.3, §2.1, §6 (R3) |

## 🔴 RED

Jokainen rakennus vaikuttaa vain omaan soluunsa. Mikään ei tee alueesta enempää kuin
osiensa summan — paitsi `NEIGHBOUR_BONUS`, joka on **näkymätön kaikkialla muualla**
kuten `BRDC-INSPECT-001` jo huomautti.

Ja **temppelit eivät tee mitään.** `BRDC-DWELL-001` paljastaa ne vietetystä ajasta, ja
suunnittelumuistiinpanot esittivät kysymyksen, johon ei ole vastattu:

> *"Avoin kysymys: mitä Temppelit tekevät pelillisesti pidemmällä tähtäimellä?"*

Suunnitelman Kirjasto ja Temppelilehto ovat vastaus: temppeli on **rakennuspaikka**,
jonka peli antoi sinulle siitä että elit siinä. Sitä ei voi ostaa.

## 🟢 GREEN

- [~] Suunnitelman viisi: **Kirjasto, Temppelilehto, Majakka tehty**; Linnoitus
      (puolustus­aura taistelupolkuun) ja Kauppareitti (kahden solun sidos) → BRDC-BUILD-004
- [x] Vaikutus **säteellä 1–2 heksaa**, säde on `Building.aura.radius`
      (Kirjasto/Lehto r1, Majakka r2)
- [x] Päällekkäiset vaikutukset **kattoon asti**: `AURA_CAP_PER_CELL` per solu per
      resurssi, lukittu vaikutusten kanssa. `resourceAura`-testi todistaa
- [x] Kirjasto ja Temppelilehto vaativat **temppelin viereisyyden**: `needsPlace: 'temple'`,
      `templeAdjacent`-portti `canBuild`:ssa, `needs-a-temple` nimeltä
- [~] Kauppareitti sitoo kaksi solua → BRDC-BUILD-004 (data­malli­muutos: oma avain,
      ei `cell.building`)
- [x] **Uskollisuus**: `loyaltyFactor` — Monumentti + paljastettu paikka viereisessä
      solussa kertoo rappeutumisnopeuden, lattia `1 - LOYALTY_MAX` (0.5). Hidastaa, ei
      pysäytä — testattu `decay.test.ts`:ssä ja `aura.repo.test.ts`:ssä
- [~] Vaikutusalue kartalla valittaessa → BRDC-BUILD-004 (MapLibre-taso)
- [x] Puhtaat funktiot testattu (`rules/aura.test.ts` 9): säteily, katto päällekkäisillä,
      lepotila, uskollisuuden lattia

## Toteutettu 2026-09-01

- `rules/aura.ts` (puhdas): `resourceAura(cells, now, sources?)` — auravat rakennukset
  säteilevät resurssia hallussa oleviin soluihin, per-solu-katto, lepotila lähteestä.
  `loyaltyFactor(h3, sources)` — decay-kerroin viereisistä lähteistä.
  `loyaltySourceCells` — pelaajan Monumentit + paikat.
- `rules/build.ts`: `Building.aura?` + `needsPlace?`, 3 riviä (`library` wisdom r1,
  `temple-grove` mana r1, `lighthouse` food r2). `canBuild` + `templeAdjacent` +
  `needs-a-temple`. `BuildingId` +3 (`types/domain.ts`), `AuraKind` domainiin.
- `rules/decay.ts`: `projectCell(cell, now, loyalty=1)` — `decayAmount(hours) * loyalty`.
  `sweepDecay(cells, now, loyalty?)` resolverilla. Muu decay-polku ennallaan.
- `data/pouch.ts`: `perHourBonus` syöttää `resourceAura`:n `manaBonus`/`buildingBonus`/
  `domainSpellBonus`:n rinnalle.
- `data/MockRepository.ts`: `loyaltyOver(cells)` — rakentaa resolverin viewportin
  soluista (rajattu luku säilyy); `build` laskee `templeAdjacent`in `getPlaces`ista.
- `geo/cells.ts`: `cellsWithin(centre, radius)`.
- Testit: +14 (`aura.test.ts` 9, `aura.repo.test.ts` 3, `build.test.ts` 1,
  `decay.test.ts` 1). **620 vihreää.**

## Majakan rehellisyyskoe

Ratkaistu: Majakka **ei** nosta liikkumisnopeutta (se on pelaajan jalat). Se säteilee
`food` (kalastus) säteellä 2 viereisiin vesi/maasoluihin. Ei lupaa taulukossa mitään,
mitä peli ei tee.

## Toteutus

**Uskollisuus on kerroin rappeutumiseen, ei uusi kello.** `decay.ts` laskee jo
kulumisen `lastVisitedAt`istä; uskollisuus muuttaa nopeutta. Yksi luku, yksi paikka,
ja `BRDC-CLAIM-004`:n testit kertovat heti jos tasapaino kaatuu.

**Yläraja on tässä tärkeämpi kuin muualla.** Aluevaikutukset kertautuvat neliöllisesti:
kymmenen linnoitusta viiden solun alalla antaisi ilman kattoa +20 puolustusta joka
ruudulle. Katto lukitaan yhtä aikaa vaikutusten kanssa, ei jälkikäteen tasapainotuksena.

**Majakka on rehellisyyskoe.** Se antaa *"+1 liikkumisnopeus viereisillä vesialueilla"*,
ja tässä pelissä liikkumisnopeus on **pelaajan omat jalat**. Sitä ei voi nostaa
rakennuksella. Majakka joko tekee jotain muuta (näkyvyys vedelle, kalastusbonus) tai se
jätetään pois — mutta se ei saa jäädä taulukkoon lupaamaan jotain, mitä peli ei tee.

## Ei tässä

- Mana ja loitsut, jotka temppeli myös tuottaa → `BRDC-MANA-001`
- Kaupunkivaltioiden kauppareitit → `BRDC-CITY-001`
