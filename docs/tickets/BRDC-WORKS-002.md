# BRDC-WORKS-002 — Rakennuksen tutkimuspuu: tyypitetty malli ja säännöt

| | |
|---|---|
| **Alue** | `packages/core/src/rules/worksTree.ts` (uusi), `rules/worksEffects.ts` (uusi), `data/worksStore.ts` (uusi), `types/GameRepository.ts`, `data/MockRepository.ts`, `data/world.ts` (additiivinen kenttä) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `[~]` osittain valmis 2026-09-24 (v0.6.63) — malli, säännöt, tila ja 8 efektilajia ajettu; rivaalin puu `world.json`issa siirtyi |
| **Riippuvuudet** | — (WORKS-001 ja -003 riippuvat tästä) |
| **Lähde** | Design system -PDF:n handoff-laatikko `interface BuildingDef` + neljä periaatetta |

## 🔴 RED

Rakennuksella on tänään vain `cost`, `produces` ja muutama portti (`rules/build.ts`).
Rakennuksella ei ole tasoa, ei tutkimusta eikä tallennettua tilaa sen jälkeen, kun se on
rakennettu. Ainoa "päivitys" on ketju (`requires`: sawmill → lumbermill), joka korvaa
rakennuksen toisella. Designin puu tarvitsee tilan per rakennus ja säännöt, jotka ovat
puhtaita funktioita `packages/core`issa (§6 sääntö 3).

## Malli (PDF:n handoffista, sovitettu koodiin)

```ts
type WorksKind = BuildingId | 'keep' | 'temple';          // P1, WORKS-001

interface BuildingDef {
  kind: WorksKind;
  sprite: string;                    // buildingSprites.ts:n avain
  hue: string;                       // 'oklch(L C H)', vain taustahehku
  name: string; nameFi: string; rule: string;   // "Sawmill", "Saha", "Built on forest"
  lore: { text: string; source: string };
  produces: Partial<ResourcePool>;   // perustuotto tasolla 0
  stat: { label: string; of: StatSource };      // keskimmäinen laatta
  reach: { label: string; rings: number; maxRings: number } | null;  // null = "THIS CELL ONLY"
  tree: { name: string; tiers: readonly Tier[] };
}

interface Tier { tier: 1 | 2 | 3 | 4 | 5; choice: boolean; nodes: readonly Node[] }

interface Node {
  id: string;                        // 'farm.rotation', globaalisti uniikki
  name: string;
  effect: Effect;                    // tyypitetty, EI proosaa
  text: string;                      // lause, jossa {effect} korvataan korostetulla osalla
  lore: string;
  cost: Partial<ResourcePool>;
}
```

`requires` jätetään pois handoffin mallista: **edeltäjä on aina edellinen taso.** PDF:n
jokainen "Needs X" on täsmälleen edellinen taso, joten erillinen kenttä olisi vain
mahdollisuus olla ristiriidassa.

### Effect — tyypitetty unioni

Jaettu kahteen ryhmään sen mukaan, onko mekaniikka jo olemassa. §6 sääntö 6: sisältö ei
tuo omaa järjestelmäänsä mukanaan.

**Ryhmä A — kytkeytyy olemassa olevaan mekaniikkaan (tehdään tässä tiketissä):**

| `kind` | Kentät | Mihin kytkeytyy | Käyttäjät (WORKS-003) |
|---|---|---|---|
| `produce` | `resource, amount` (voi olla negatiivinen) | trickle / `forecast` | lähes jokainen taso I |
| `reach` | `rings` | rakennuksen oma `reach.rings` | Log Flume, Bell of Tides, High Seat… |
| `storageCap` | `resource, amount` | pussin katto (`storageCapBonus`in yleistys) | Granary Loft, Deep Cellar, Counting House |
| `cellStrength` | `amount, scope: 'cell' \| 'provinceWorks'` | oman solun / provinssin rakennussolujen vahvuus | Warded Walls, Mason's Guild |
| `claimStrength` | `amount, scope: 'reach' \| 'rival'` | `attackPower` / uuden valtauksen alkuvahvuus | Mustering Yard, Tempered Edge |
| `decayFloor` | `floor, scope: 'cell' \| 'border'` | `decay.ts` — ei koskaan alle `floor` | The Unquenched (∞), Unbroken Line (200) |
| `costDiscount` | `resource, pct, target: 'build' \| 'rite'` | rakennus- / riitti-hinta | Cut Stone, Choir of Stillness |
| `convert` | `from, to, fromAmount, toAmount` per tunti | trickle | Mill Wheel |
| `depositBonus` | `deposit, resource, amount \| mult` | bonusresurssi renkaan sisällä (RES-001) | Bloomery, Old-Growth Pact |
| `reveal` | `rings` | paljastus renkaan soluille (`revealStore`) | Lookout, Eye of the Dreamer |
| `producePer` | `resource, amount, per: 'province' \| 'cellInReach'` | trickle × `provinceCount` / renkaan solut | Council of Whispers, Caravan Road |
| `worksMult` | `target: WorksKind, resource, pct` | toisen rakennuksen tuotto | Charcoal Pits (Forge +20 % iron) |
| `produceFrom` | `from, resource, ratio` | tuotto toisen tuoton mukaan, ei kuluta | Star-Metal (1 mana / iron) |
| `decayMult` | `pct, scope: 'reach'` | `decay.ts`in päiväkohtainen vähennys | Night Watch (50 %) |

**Ryhmä B — mekaniikkaa ei ole, tai se on pysäköity:** `siegeImmune`, `siegeAlert`,
`seeRivalResearch`, `rivalDecayInReach`, `unlockRite`, `unlockWonder`, `questSlot`,
`wagerBonus` (Wager on pysäköity, CLAIM-017), `periodic` (täysikuu), `tradeAnything`,
`streakWater`, `restoreFading`, `adjacentMult`.
Tyyppi on olemassa, jotta sisältö voidaan kirjoittaa kokonaan. Solmun tila on kuitenkin
`○ NOT YET AWAKE` ja sitä ei voi tutkia, ennen kuin oma tiketti kytkee mekaniikan (päätös P5).

## Säännöt (puhtaita, jokaisella Vitest)

```ts
nodeState(def, learned, pool, owner): Map<nodeId, 'learned'|'available'|'locked'|'closed'|'dormant'>
canResearch(def, learned, nodeId, pool, isMine): { ok: true } | { ok: false; refused: WorksRefusal }
research(def, learned, nodeId, pool): { learned, pool }     // vähentää hinnan
worksLevel(def, learned): 0..5                              // opittujen TASOJEN määrä
activeEffects(def, learned): Effect[]
reachRings(def, learned): number                            // rings + Σ reach-efektit, ≤ maxRings
```

`WorksRefusal`: `'not-yours' | 'already' | 'locked' | 'closed' | 'dormant' | 'short'`.
Jokaisella kieltäytymisellä on sanallinen muoto UI:ssa (§14: virhe kertoo, mitä tehdä).

## Tila

- `K.worksTree` IndexedDB:ssä: `Record<h3, nodeId[]>`. **Puu kuuluu solulle, ei
  pelaajalle.** Kun solu vaihtaa omistajaa, opittu puu siirtyy uudelle omistajalle.
  Designin mukaan: *"Take the market and the route becomes yours"*, ja *"a temple you lose
  takes its learned rites with it"*.
- Rakennuksen purku tai migraatio (vrt. BUILD-014) tyhjentää solun puun.
- `SAVE_VERSION` / `SCHEMA_VERSION` nousee vain, jos vanha tallennus tarvitsee
  migraation. Uusi avain ilman vanhaa dataa ei tarvitse (tyhjä = ei opittua).
- **Rivaalin puu:** `WorldSource`iin additiivinen `works?: Record<h3, nodeId[]>`
  (sama kuvio kuin `leyM`: vanha lähetys ei kanna sitä, ja silloin rivaalin puu näkyy
  tyhjänä, ei virheenä).

## 🟢 GREEN

- [x] Tyypit (`rules/works/types.ts`: `BuildingDef`, `WorksTier`, `WorksNode`, `Effect`) +
      `WORKS_DEFS`. Solmulla on `effects: Effect[]` (ei yksi), koska useampi solmu tekee kahta
      asiaa (Pale Timber, Unquenched, Deep Cellar)
- [x] Rakennetesti kaikille määritelmille (`works/tree.test.ts`)
- [x] `nodeState`: taso I available; valinta sulkee sisarensa; taso odottaa lähintä
      *opittavissa olevaa* tasoa yllään (nukkuva taso ei estä, muuten puu pysähtyisi
      ensimmäiseen puuttuvaan mekaniikkaan); ryhmä B → `dormant`
- [x] `canResearch`/`researchNode`: jokainen kieltäytyminen testattu; hinta vähenee
      täsmälleen; toinen kutsu → `already`
- [x] `worksLevel`: tasot, ei solmut
- [~] **Kytketty ja testattu (8 lajia):** `produce` (myös negatiivinen, pussi ei mene alle
      nollan), `producePer` (provinssi ja renkaan heksat maastolla), `reach` (vain kun jokin
      lukee rengasta), `storageCap` (pussin katto nyt resurssikohtainen), `convert`,
      `produceFrom`, `worksMult`, `cellStrength` (vain oma solu, kertaluonteinen
      tutkimushetkellä). **Ei kytketty, solmut nukkuvat:** `claimStrength`, `decayFloor`,
      `decayMult`, `costDiscount`, `depositBonus`, `reveal`, `cellStrength` provinssille ja
      kaikki `special`it. Jokainen on oma pieni tikettinsä, kun niitä tarvitaan
- [x] Repositorio: `repository.works.viewAt(h3)` ja `repository.works.research(h3, nodeId)`
      (`data/worksStore.ts`). Oma rajapintansa, koska `GameRepository` ja `MockRepository`
      ovat molemmat 399 rivissä
- [x] Puu on solun (`K.worksTree`), joten se säilyy omistajan vaihtuessa; purku tyhjentää
      sen (`forgetTree` `demolishOn`issa, repo-testi)
- [ ] `world.ts`: `works`-kenttä jaettuun maailmaan. **Siirtyi.** Rivaalin sivu näyttää nyt
      puun ilman opittuja solmuja (`viewAt` palauttaa rivaalille `learned: []`)
- [x] Portti: `pnpm test` (1789), `pnpm typecheck`, `pnpm lint:lines`, `pnpm build`

## Päätös Infiniteltä

- **P5 — Ryhmä B:n solmut.** (a) näkyvät `NOT YET AWAKE`, eikä niitä voi tutkia (ehdotus: puun
  muoto säilyy ja lupaa tulevaa), (b) piilotetaan, kunnes kytketty, tai (c) korvataan
  ryhmä A:n efektillä. Valinta (a) tarkoittaa, että osassa puita taso V on
  tutkimattomissa kuukausia.
- **P6 — Vanha ketjupäivitys** (sawmill → lumbermill, `requires`) ja uusi puu tekevät
  saman asian eri tavalla. Ehdotus: ketju poistuu, kun puu on valmis. Lumbermill-rakennus
  tarkoittaa silloin Sawmillia, jolla on Iron Teeth + Log Flume.

## Ei tässä

- Sivu (WORKS-001), sisältö (WORKS-003)
- Ryhmä B:n mekaniikat — kukin omana tikettinään, kun P5 on päätetty
- Ylläpito (`UPKEEP`) — WORKS-001 P4
