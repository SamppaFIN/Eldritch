# BRDC-PROG-006 — Masterworkit: monesta tulee yksi

| | |
|---|---|
| **Alue** | `packages/core/src/rules/masterwork.ts, apps/game features, designSprites.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | PROG-005, PROG-007 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P3, "What Many Ordinary Works Become", LAW III)` |
| **Status** | `todo` |

## 🔴 RED

Fortress on tänään BUILD-013:n erillinen rakennus/taika. Dokumentti: viisi masterworkia (Fortress, Manor, Foundry, Exchange, Sunken Cathedral), jokainen = määrä tavallisia + yksi tasolla + yksi tekniikka, nostetaan yhden ainesosan päälle, lepää jos määrä putoaa.

**Päätös Infiniteltä:** "Rivals cannot claim inside ring 1" vs CLAIM-017 (viimeinen kävijä omistaa). Fortress-poikkeus on jo olemassa; ehdotus: laajennetaan ring 1:een.

## 🟢 GREEN

- [ ] `MASTERWORKS` + `canRaise(realm, id)` needs-listana (P3: n / m MET)
- [ ] Dormant-sääntö: ei tuottoa, vahvuus säilyy
- [ ] Viiden efektit (Fortress +200 strength 2 ringissä, Manor housing +3, Foundry +50 %, Exchange 3:1, Cathedral tier V + mana +50 %)
- [ ] 5 uutta iso-spriteä ART-006-tavalla
- [ ] BUILD-013 Fortress sovitettu tähän
- [ ] Vitest + e2e: yksi masterwork nostettu
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e + kuvakaappaus vs P3.

## Ei tässä

Exchangen reitti rivaalin markkinaan (trade routet poistettiin 0.6.66 — päätetään tässä).
