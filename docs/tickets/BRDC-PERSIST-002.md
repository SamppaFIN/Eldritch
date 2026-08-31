# BRDC-PERSIST-002 — IndexedDB:llä ei ole skeemaversiota

| | |
|---|---|
| **Vaihe** | läpileikkaava |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-PERSIST-001, BRDC-MOCK-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Löytyi `BRDC-ECON-001`:n resurssipoolin muotoa vaihdettaessa, 2026-08-31 |

## 🔴 RED

`BRDC-PERSIST-001` lupaa: *"One localStorage namespace: `es3:*`. One `save()` function.
One `SAVE_VERSION` integer. Unknown or older versions are rejected and reset
deliberately."* Se on totta — mutta vain `localStorage`:lle.

**Suurin osa pelin tilasta ei asu `localStorage`:ssa.** Solut, resurssipooli, kotipesä,
linna, puolustus — kaikki tämä kulkee `KeyValueStore`-rajapinnan läpi IndexedDB:hen
(`IdbStore.ts`), eikä sillä polulla ole **yhtään** version tarkistusta. `save.ts`:n
`SAVE_VERSION` ei koske sitä ollenkaan; se on täysin eri mekanismi eri tiedolle.

Tämä ei ollut hypoteettinen riski. `BRDC-ECON-001` vaihtoi `ResourcePool`in muodon
(`{water,wood,gold}` → yhdeksän kenttää), ja ilman erillistä tarkistusta palaava
pelaaja olisi lukenut vanhan poolinsa **luotettuna uudeksi muodoksi**: puuttuvat kentät
`undefined`ina, ja ensimmäinen `canAfford`/`spend`/`settleResources`-kutsu olisi
laskenut `undefined + number`illa — pooli olisi hiljaa alkanut täyttyä `NaN`:lla.

Se on täsmälleen v2:n taso-118-bugin muoto: versioimaton tila, hiljainen korruptio,
huomataan vasta kun joku ihmettelee miksi mikään ei toimi.

## 🟢 GREEN

- [ ] `KeyValueStore`-pohjaisella tilalla on **oma skeemaversionsa**, tallennettuna
      kannan sisään (esim. avain `schema:version`), tarkistettuna kerran bootissa
- [ ] Tuntematon tai vanha versio **resetoi ja kertoo sen**, samalla periaatteella kuin
      `save.ts`:n `loadWith` — ei hiljaista migraatioyritystä
- [ ] `BRDC-ECON-001`:n väliaikainen paikkaus (`pouch.ts#isCurrentShape`, joka tunnistaa
      vanhan poolin rakenteesta eikä versionumerosta) **korvataan** yleisellä
      mekanismilla tämän tiketin valmistuttua
- [ ] Testattu: vanhanmuotoinen data missä tahansa `KeyValueStore`-avaimessa johtaa
      hallittuun resetiin, ei `NaN`:iin eikä kaatumiseen
- [ ] Dokumentoitu selvästi mihin tämä versio kattaa ja mihin ei — `save.ts`:n oma versio
      ja tämä ovat edelleen kaksi eri numeroa eri syistä, kuten `CHALLENGE_VERSION`kin on

## Toteutus

Sama malli kuin `save.ts`:ssä, siirrettynä asynkroniseen `KeyValueStore`-maailmaan:

```ts
const SCHEMA_KEY = 'schema:version';
const SCHEMA_VERSION = 1;

async function checkSchema(store: KeyValueStore): Promise<'ok' | 'reset'> {
  const stored = await store.get<number>(SCHEMA_KEY);
  if (stored === SCHEMA_VERSION) return 'ok';
  await store.clear();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  return 'reset';
}
```

Kutsutaan kerran `MockRepository`:n rakentajassa tai ensimmäisessä metodikutsussa —
tarkka koukutuskohta ratkaistaan toteutusvaiheessa. `'reset'`-paluuarvo antaa
sovelluskerroksen näyttää saman rehellisen viestin kuin `loadWith`in `'stale'` tänään.

## Ei tässä

- Osittainen migraatio (vanhan datan kääntäminen uuteen muotoon kenttä kerrallaan).
  `claude.md` §17:n oma esimerkki ja `BRDC-ECON-001`:n oma päätös (*"vain water→food
  vaihtuu, ja se on ainoa kohta jossa vanha data ei käänny — siksi versio nousee eikä
  migraatiota kirjoiteta"*) pätevät tässäkin: resetoi, älä arvaa
- `save.ts`:n ja tämän mekanismin yhdistäminen yhdeksi järjestelmäksi. Ne suojaavat eri
  dataa eri syistä eivätkä hyödy jaetusta numerosta
