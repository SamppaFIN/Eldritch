# BRDC-PERSIST-001 — `es3:*`-nimiavaruus ja `SAVE_VERSION`

| | |
|---|---|
| **Vaihe** | 0 — Perustus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-SETUP-003 |
| **Status** | `done` — 2026-08-26 (3 kohtaa siirretty BRDC-MOCK-001:een) |
| **Valmius** | 85 % |

## 🔴 RED

v2:ssa oli **29 hallitsematonta localStorage-avainta ilman versiokenttää**. Vanha
tallennus ladattiin sellaisenaan, mikä tuotti pelaajan tasolle **118** ja pysäytti
kohtaamiset hiljaa. Kahdelle eri asialle oli päällekkäiset avaimet
(`eldritch_game_state` ja `eldritch_sanctuary_v2_state`).

Todennettu: `ANALYSIS.md` §2.1, §8 kohta 2.

## 🟢 GREEN

- [x] **Yksi nimiavaruus** `es3:*`. Ei muita avaimia
- [x] **Yksi `SAVE_VERSION`-kokonaisluku**
- [x] Tuntematon tai vanhempi versio **hylätään** ja tila nollataan tarkoituksella,
      käyttäjälle näkyvällä lore-sävyisellä viestillä
- [x] **Yksi `save()`-funktio** kaikelle — ei hajautettuja `setItem`-kutsuja
- [x] Tallennus on debounced: enintään 1 kirjoitus / 2 s
- [~] `QuotaExceededError` käsitellään: `saveNow` palauttaa `'quota'` eikä heitä.
      **Historian karsinta jää BRDC-MOCK-001:een** — jälkihistoria elää IndexedDB:ssä, ei täällä
- [~] `clearAll()` tyhjentää `es3:*`-avaimet; `Saver.cancel()` tyhjentää ajastimen.
      **Yhtenäinen `resetAll()` kootaan BRDC-MOCK-001:ssä**, kun on muutakin nollattavaa
- [~] Työnjako päätetty ja dokumentoitu; IndexedDB-toteutus on BRDC-MOCK-001

## Toteutus

```ts
// packages/core/persist/save.ts
export const SAVE_VERSION = 1;
const NS = 'es3:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed.v !== SAVE_VERSION) {
      // Tarkoituksellinen hylkäys — ei hiljaista migraatiota
      localStorage.removeItem(NS + key);
      return fallback;
    }
    return parsed.d as T;
  } catch {
    return fallback;
  }
}
```

**Työnjako:** localStorage = pieni tila (profiili, asetukset, `SAVE_VERSION`).
IndexedDB = kaikki mikä kasvaa (jälkipisteet, solut) — se on `MockRepository`in vastuulla.

## Testit

- [x] `load()` tuntemattomalla versiolla → palauttaa fallbackin, ei kaadu
- [x] `load()` rikkinäisellä JSONilla → palauttaa fallbackin
- [x] `save()` kutsuttuna 10 kertaa sekunnissa → kirjoittaa enintään kerran / 2 s
- [x] Quota-virhe simuloituna → ei heitä ulos
- [x] **v2-muotoinen tallennus** (`eldritch_game_state`) ei kaada peliä
      → ks. BRDC-REGRESSION-000

## Ei kuulu tähän tikettiin

Palvelinpuolen `min_client_version` (Vaihe 5). Migraatio mock-tilasta Supabaseen (Vaihe 3).

## Lähde

`files/CLAUDE.md` §Persistence · `MASTERPLAN.md` §7 · `ANALYSIS.md` §2.1
