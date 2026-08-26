# BRDC-SETUP-003 — `GameRepository`-rajapinta ja tyypit

| | |
|---|---|
| **Vaihe** | 0 — Perustus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-SETUP-001 |
| **Status** | `done` — 2026-08-26 |
| **Valmius** | 100 % |

## 🔴 RED

Datalle ei ole rajapintaa. Jos komponentit alkavat lukea tilaa suoraan, Supabasen
lisääminen Vaiheessa 3 vaatii koko sovelluksen läpikäynnin — ja offline-tila jää
tekemättä, kuten v2:ssa kävi.

## 🟢 GREEN

- [x] `packages/core/types/GameRepository.ts` määrittelee **kaiken** datan luvun ja kirjoituksen
- [x] `packages/core/types/domain.ts` määrittelee jaetut tyypit: `TrailPoint`, `Cell`,
      `Run`, `Claim`, `PlayerProfile`, `H3Index`
- [x] Yksikään komponentti, hookki tai store ei importtaa mitään tallennusteknologiaa suoraan
- [x] `pnpm typecheck` vihreä

## Toteutus

```ts
// packages/core/types/GameRepository.ts
export interface GameRepository {
  // Profiili
  getProfile(): Promise<PlayerProfile>;

  // Runit ja jälki
  startRun(): Promise<RunId>;
  submitTrail(runId: RunId, points: TrailPoint[]): Promise<TrailResult>;
  getActiveRun(): Promise<Run | null>;
  endRun(runId: RunId): Promise<void>;

  // Alue
  closeLoop(runId: RunId): Promise<ClaimResult>;
  getCells(bbox: BBox): Promise<Cell[]>;
  getOwnedCells(): Promise<Cell[]>;

  // Aika — rappeutuminen ajetaan lukuhetkellä, ei ajastimella
  runDecay(now: number): Promise<DecayResult>;
}
```

**Sääntö:** jos jokin komponentti tarvitsee dataa, jota rajapinnassa ei ole, **rajapintaan
lisätään metodi** — ei ohiteta sitä. (`files/CLAUDE.md` §Data layer.)

**Aika parametrina:** `runDecay(now)` ottaa ajan argumenttina, ei lue `Date.now()`ta.
Ilman tätä rappeutumista ei voi testata odottamatta 20 vuorokautta.

## Testit

Tyyppitason testi: `MockRepository` ja myöhempi `SupabaseRepository` toteuttavat saman
rajapinnan. Tässä tiketissä riittää, että rajapinta kääntyy.

## Ei kuulu tähän tikettiin

Toteutukset. `MockRepository` on BRDC-MOCK-001, `SupabaseRepository` on Vaihe 3.

## Lähde

`PROMPTS.md` Vaihe 0 · `files/CLAUDE.md` §Data layer — mock first · `MASTERPLAN.md` §3.2
