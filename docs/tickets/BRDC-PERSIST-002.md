# BRDC-PERSIST-002 — IndexedDB:llä ei ole skeemaversiota

| | |
|---|---|
| **Vaihe** | läpileikkaava |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-PERSIST-001, BRDC-MOCK-001 |
| **Status** | `done` — 2026-08-31 |
| **Valmius** | 95 % (selainpuolen manuaalinen tarkistus ja e2e ajamatta — automaattikattavuus alla) |
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

- [x] `KeyValueStore`-pohjaisella tilalla on **oma skeemaversionsa** (`SCHEMA_KEY =
      'schema:version'`, `SCHEMA_VERSION = 1`), tallennettuna kannan sisään, tarkistettuna
      kerran ennen ensimmäistä storen käyttöä (`schema.ts` → `versioned()`)
- [x] Tuntematon tai vanha versio **resetoi ja kertoo sen**: `versioned().schema()`
      palauttaa `'reset'` → `MockRepository.schemaOutcome()` → `RepositoryHandle.reset` →
      `MapView` näyttää saman lore-viestin kuin `loadWith`in `'stale'`. Ei migraatioyritystä
- [x] `BRDC-ECON-001`:n väliaikainen paikkaus `pouch.ts#isCurrentShape` **poistettu**;
      `read()` luottaa nyt storeen suoraan, koska skeemaportti on tyhjentänyt tunnistamattoman
- [x] Testattu (`schema.test.ts`, 8 testiä + `resources.test.ts`:n integraatiotapaus):
      vanhanmuotoinen data missä tahansa avaimessa → `'reset'`, ei `NaN`:ia, ei kaatumista.
      `boot.test.ts` (100× determinismi) ja `claiming.test.ts` yhä vihreitä
- [x] Dokumentoitu `schema.ts`:n moduulikommentissa: tämä ja `SAVE_VERSION` ovat eri
      numerot eri datalle eri storessa, kuten `CHALLENGE_VERSION`kin on

## Toteutus — mitä tehtiin

Luonnoksen bare-funktion sijaan **kääre** `versioned(store): KeyValueStore &
{ schema() }` (`packages/core/src/data/schema.ts`). Syy: tarkistuksen on ajauduttava
ennen *mitä tahansa* storen käyttöä, ei vain ennen ensimmäistä nimettyä metodia, ja
kääre keskittää sen yhteen paikkaan `await this.ready()` -rivien sijaan joka metodissa.
Portti on muistettu promise (`gate ??= …`), joten rinnakkaiset kutsut jakavat yhden ajon —
sama ominaisuus jonka `boot.test.ts` tarkistaa siemennykselle.

- **`MockRepository`-rakentaja** kääri storensa: `this.store = versioned(opts.store ?? …)`.
  Yksi kääre-piste; `createRepository` antaa raa'an storen. `schemaOutcome()`-metodi
  (ei `GameRepository`-rajapinnassa, konkreettisen luokan lisä kuten `toOwnershipCell`)
  paljastaa tuloksen `createRepository`:lle → `RepositoryHandle.reset` → `MapView`-banneri.
- **Tyhjä store + puuttuva versioavain → `'ok'`**, ei `'reset'` (vain leimaa). Poikkeaa
  luonnoksesta tarkoituksella: `loadWith` palauttaa puuttuvalle avaimelle `'empty'` eikä
  `'stale'` — muuten joka ensikäynnistys näyttäisi resetointiviestin. `'reset'` vain kun
  versio on väärä **tai** dataa on ilman versioavainta.
- **Käärretty `clear()` leimaa version uudelleen**, jottei pelaajan oma `resetAll()`
  näyttäisi seuraavassa avauksessa vanhentuneelta.
- `claiming.test.ts` esisiementää rivaalisoluja raakaan storeen — sen `beforeEach` leimaa
  nyt `SCHEMA_KEY`:n, koska se kuvaa nykyversion tallennusta, ei vanhentunutta.

`'reset'`-paluuarvo antaa sovelluskerroksen näyttää saman rehellisen viestin kuin
`loadWith`in `'stale'` tänään — sama teksti `MapView`:n bannerissa kuin `App.tsx`:n
`'stale'`-polulla.

## Ei tässä

- Osittainen migraatio (vanhan datan kääntäminen uuteen muotoon kenttä kerrallaan).
  `claude.md` §17:n oma esimerkki ja `BRDC-ECON-001`:n oma päätös (*"vain water→food
  vaihtuu, ja se on ainoa kohta jossa vanha data ei käänny — siksi versio nousee eikä
  migraatiota kirjoiteta"*) pätevät tässäkin: resetoi, älä arvaa
- `save.ts`:n ja tämän mekanismin yhdistäminen yhdeksi järjestelmäksi. Ne suojaavat eri
  dataa eri syistä eivätkä hyödy jaetusta numerosta
