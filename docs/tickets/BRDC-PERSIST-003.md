# BRDC-PERSIST-003 — Migraatiorekisteri (rakenne, ei vielä migraatioita)

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-PERSIST-002 |
| **Status** | `done` — 2026-09-01 |
| **Valmius** | 100 % |

## 🔴 RED

`SCHEMA_VERSION`in nosto on aina tarkoittanut koko IndexedDB-storen tyhjennystä
(`schema.ts` `versioned()`). Iteratiivisessa kenttätestauksessa se tarkoittaa, että
jokainen skeemamuutos vie pelaajan koko kartan — usein muutoksesta joka olisi
mekaanisesti muunnettavissa. Tarvitaan protokolla: jos vanha versio löytyy, muunna
uuden pohjalle.

## 🟢 GREEN

- [x] `MIGRATIONS: Partial<Record<from, (store) => Promise<void>>>` — avain lähtöversio,
      askel kerrallaan `from → from + 1`
- [x] Vanha versio jolle **jokainen** askel `stored … SCHEMA_VERSION-1` on rekisteröity:
      ajetaan järjestyksessä, leimataan, `SchemaOutcome` = `'migrated'`
- [x] Muuten wipe kuten ennen: tuntematon numero, koodia uudempi data, aukko polussa,
      data ilman versioavainta → `'reset'`
- [x] `MIGRATIONS` on tyhjä — mikään storessa ei ole vaihtanut muotoa. Käytös
      identtinen nykyiseen kunnes ensimmäinen oikea nosto rekisteröi muunnoksen
- [x] `'migrated'` ei laukaise "returned to the Void" -varoitusta (`createRepository`
      katsoo `=== 'reset'`)

## Toteutus

`versioned()`:n `check()`iin yksi haara ennen `clear()`ä: jos `typeof stored ===
'number' && 0 < stored < SCHEMA_VERSION && canMigrateFrom(stored)`, silmukka
`for (v = stored; v < SCHEMA_VERSION; v++) await MIGRATIONS[v]!(inner)`, `stamp()`,
`'migrated'`. `canMigrateFrom` tarkistaa että joka askel on `function`.

Ei uutta migraatiota — se olisi spekulatiivista koodia versiolle jota ei ole (§4.2).
Ensimmäinen oikea `SCHEMA_VERSION`-nosto kirjoittaa oman muunnoksensa `MIGRATIONS`iin.

## Testit

- [x] Synteettinen `(SCHEMA_VERSION-1) → SCHEMA_VERSION` -migraatio ajetaan, vanha
      kenttä katoaa, muu data säilyy, versio leimautuu → `'migrated'`
- [x] Ilman rekisteröityä migraatiota sama vanha versio → `'reset'`, data pyyhitään
- [x] Kaikki BRDC-PERSIST-002:n olemassa olevat testit vihreä (tuleva versio → reset,
      versioavaimeton data → reset, kerta-ajo)
- [x] 677 testiä, `tsc -b`, `lint:lines` — puhtaat

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `schema.ts` §BRDC-PERSIST-002
