# BRDC-ECON-005 — Resurssit kertovat totuuden

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S |
| **Riippuvuudet** | BRDC-ECON-002, BRDC-ECON-003, BRDC-STATS-001 |
| **Status** | `done` (2026-09-06, v0.5.40) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-06: *"nollataan resurssit ja pidetään huoli, että resurssit päivittyvät oikein"* |

## 🔴 RED

Pelaaja ei voi luottaa yhteenkään pussin numeroon, eikä siihen ole tarvinnut arvailla
syytä — se on luettavissa koodista:

`apps/game/src/data/createRepository.ts:53`

```ts
const stale = load<string | null>(GIFT_KEY, null) !== APP_VERSION;
if (stale || empty) await grantVersionGift(...);
```

`grantVersionGift` nostaa **jokaisen** resurssin lattiaan (100; mana ja wisdom 30)
**jokaisella versionnostolla**. 2026-09-05 versio nousi kolmesti (0.5.37 → 0.5.38 →
0.5.39), eli pussi täytettiin kolme kertaa saman illan aikana. Tuotanto toimii koko ajan
oikein; lahja vain peittää sen alleen. Kentältä se näyttää siltä että numerot hyppivät
itsekseen eikä kävelyllä ole vaikutusta — juuri se havainto joka tuli.

Lisäksi: **ei ole yhtään testiä joka väittäisi, että pussi kasvaa sen mitä ennuste
lupaa.** `forecastRates` on dokumentoitu niin että se *on* settle eikä siksi voi olla
settlen kanssa eri mieltä (`data/pouch.ts`), mutta mikään ei tarkista väitettä.

Eikä pussia voi nollata mistään. `Delete progress` vie kaiken muunkin.

## 🟢 GREEN

- [x] **Versiolahja kerran per peli, ei per versio.** Sääntö irrotettiin puhtaaksi
      funktioksi `giftIsOwed(granted, started, pouchEmpty)` (`createRepository.ts`), jotta
      se on testattavissa: `granted === null || (started && pouchEmpty)`. Lahja annetaan
      kun `GIFT_KEY` puuttuu kokonaan — uusi peli, tai `Delete progress` joka pyyhkii
      `clearAll()`illa myös sen. Tyhjän pussin turvaverkko **jäi**.
- [x] **`resetResources(now)` `GameRepository`iin**, toteutus `MockRepository`ssa
      yhtenä rivinä (398/400 → 399), verbi `resetPouch` `data/pouch.ts`:ssä. Nollaa
      pussin ja siirtää `since`/`sinceDay` nykyhetkeen.
- [x] **"Empty the pouch" -rivi valikkoon.** `PouchResetDialog` (`Sanctum.tsx`),
      avaustila `SettingsMenu`n omana — sama kuvio kuin `ChangelogPanel`/`BugReport`,
      joten `MapView` kasvoi yhdellä rivillä (ja yksi kommentti trimmattiin).
      `onResetPouch` päivittää pussin heti, ei odota 60 s pollausta.
- [x] **Auditointitesti** (`data/pouch.test.ts`): tunti ja vuorokausi, resurssi
      kerrallaan, kalasolulla joka tuottaa sekä tunnissa että päivässä.
- [x] **Testi lahjan portille** (`createRepository.test.ts`, 4 tapausta).
- [x] `pnpm test` (974) `&& typecheck && lint:lines && build` vihreät; e2e
      `dialogs.spec.ts` + `research.spec.ts` 20/20 molemmilla projekteilla.

### Bonus: auditointitesti löysi toisen bugin heti ensimmäisellä ajolla

- [x] **Kirjoittamattomalla pussilla ei ollut kelloa lainkaan.** `read()` sijaistaa
      `since: now` kun mitään ei ole tallessa, ja nollan mittainen settlaus palauttaa
      saman olion viitteenä (`terrain.ts:275`) — joten vanha `if (settled !== stored)`
      ohitti kirjoituksen, ja *seuraava* luku sijaisti `since`n taas omalla `now`llaan.
      Trickle ei siis kertynyt koskaan. Bootti sattui peittämään tämän kirjoittamalla
      pussin aloituslahjan yhteydessä. Korjaus: `settlePouch` kirjoittaa aina.

## Vaikutus

- Kentällä pussi lakkaa hyppimästä deployssä. Se tarkoittaa myös, että **tuotanto näyttää
  hitaalta** — koska se on sitä, eikä lahja enää peitä sitä. Jos numerot tuntuvat sen
  jälkeen liian pieniltä, se on talouden viritystä (oma tikettinsä), ei tämä bugi.
- `MapView.tsx` (399/400) ja `MockRepository.ts` (398/400) ovat rivirajalla. Molemmissa
  trimmataan kommenttia sen verran kuin tämä vaatii; jos ei riitä, tiedosto jaetaan.

## Ei tässä

- Talouden numeroiden viritys (trickle-määrät, rakennusten tuotto, varastokatto).
- Lahjan poistaminen kokonaan. Testivaiheessa uusi pelaaja saa yhä aloituspussin — kerran.
- Tyhjän pussin turvaverkon purkaminen.
