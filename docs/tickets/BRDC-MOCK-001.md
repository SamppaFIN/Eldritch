# BRDC-MOCK-001 — `MockRepository`: IndexedDB ja siemendata

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SETUP-003, BRDC-PERSIST-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

`GameRepository`-rajapinnalla ei ole toteutusta. Ilman sitä Vaiheet 1–2 eivät etene
ilman Supabasea — ja koko mock-first-päätöksen (lukittu päätös 4) tarkoitus on, että
peli on pelattava ennen kuin kantaa on olemassa.

## 🟢 GREEN

- [ ] `MockRepository` toteuttaa `GameRepository`-rajapinnan kokonaan
- [ ] Tallennus IndexedDB:hen: `runs`, `trail_points`, `cells`, `profile`
- [ ] **Peli toimii lentokonetilassa.** Ei verkkopyyntöjä, ei kirjautumista
- [ ] Siemendata: **3 kuvitteellista naapuripelaajaa** omine alueineen, jotta kartta
      ei ole tyhjä ensimmäisellä käynnistyksellä
- [ ] Naapureiden alueet generoidaan pelaajan **ensimmäisen sijainnin ympärille** —
      ei kovakoodattuihin koordinaatteihin
- [ ] Repository valitaan yhdestä paikasta (`createRepository()`), ei komponenteissa
- [ ] Sääntölogiikka **ei ole** täällä — `MockRepository` kutsuu `packages/core/rules`in
      puhtaita funktioita

## Toteutus

```ts
// apps/game/src/data/createRepository.ts
export function createRepository(): GameRepository {
  // Vaiheet 0-2: aina mock. Vaiheessa 3 tähän tulee ympäristömuuttuja
  // ja mock jää offline-fallbackiksi.
  return new MockRepository();
}
```

**Miksi mock ei ole väliaikainen viritys** (`MASTERPLAN.md` §3.2):

1. Vaiheet 1–2 valmistuvat ilman verkkoa, tilejä tai migraatioita
2. Kaikki testit ajavat mockia vasten — nopeita ja deterministisiä
3. **Offline-tila tulee ilmaiseksi.** v1:ssä se oli, v2:sta se katosi

**Siemennaapurit:** kolme pelaajaa nimillä ja väreillä, kullakin 15–40 solua
1–2 km päässä pelaajan aloitussijainnista. Yksi heistä on tarkoituksella **pelaajan
naapurissa**, jotta piiritysmekaniikkaa (BRDC-CLAIM-003) pääsee kokeilemaan heti.

**IndexedDB, ei localStorage:** jälkipisteitä kertyy tuhansia per kävely. localStorage
on 5 MB ja synkroninen — se olisi sama virhe kuin v2:n `eldritch_stepMarkers`.

## Testit

- [ ] `startRun` → `submitTrail` → `getActiveRun` palauttaa pisteet oikeassa järjestyksessä
- [ ] Sivun uudelleenlataus säilyttää aktiivisen runin ja jäljen
- [ ] Ensimmäinen käynnistys luo siemennaapurit; toinen käynnistys **ei luo niitä uudelleen**
- [ ] `MockRepository` täyttää `GameRepository`-tyypin (käännösaikainen tarkistus)
- [ ] Testi ajetaan `fake-indexeddb`illä, ei oikeassa selaimessa

## Ei kuulu tähän tikettiin

`closeLoop` ja `getCells` (BRDC-CLAIM-005). `SupabaseRepository` (Vaihe 3).
Golden fixture -testit mock ≡ SQL (Vaihe 3).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 1 · `files/CLAUDE.md` §Data layer · `MASTERPLAN.md` §3.2,
lukittu päätös 4
