# BRDC-CLAIM-004 — Rappeutuminen ja vapautuminen (`decay`)

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-003 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Kerran vallattu alue jäisi ikuisesti. Kahdella pelaajalla kartta jähmettyisi parissa
viikossa: kaikki mihin on kerran kävelty on omaa, eikä mitään ole enää tehtävissä.

## 🟢 GREEN

- [ ] `packages/core/rules/decay.ts` — **puhdas funktio, "nyt" annetaan parametrina**
- [ ] 0–48 h viimeisestä käynnistä → ei rappeutumista (armonaika)
- [ ] 2–14 vrk → **−10 / vrk**
- [ ] yli 14 vrk → **−25 / vrk**
- [ ] `strength ≤ 0` → **solu vapautuu**, omistaja `null` — ei jää minimiarvoon
- [ ] Vapautumisesta syntyy historiarivi ja lore-sävyinen tapahtuma:
      **"The Void reclaims"**
- [ ] Rappeutuminen ajetaan **lukuhetkellä**, ei taustajastimella

## Toteutus

**Vakiot:**

```ts
DECAY_GRACE_HOURS     = 48
DECAY_PER_DAY         = 10
DECAY_PER_DAY_LATE    = 25
DECAY_LATE_AFTER_DAYS = 14
```

**Kestoajat** (`MASTERPLAN.md` §2.1):

| Solun strength | Kestää koskemattomana |
|---:|---|
| 500 (maksimi) | ~33 vrk |
| 100 (juuri vallattu) | ~12 vrk |

Tämä on se luku, joka pitää kartan elävänä pienellä pelaajamäärällä. Hylätty alue
katoaa itsestään; kukaan ei joudu odottamaan, että joku muu tulisi valtaamaan sen.

**Lukuhetkellä, ei ajastimella.** Ajastin vaatisi taustaprosessin, joka staattisessa
sivussa ei ole olemassa, ja Vaiheessa 3 se olisi `pg_cron`. Sen sijaan `getCells()`
laskee rappeutumisen `lastVisitedAt`-aikaleimasta. Sama laskenta toimii molemmissa
toteutuksissa identtisesti — tämä on golden fixture -testien (Vaihe 3) edellytys.

```ts
export function applyDecay(cell: Cell, now: number): Cell | null {
  const hours = (now - cell.lastVisitedAt) / 3_600_000;
  if (hours <= DECAY_GRACE_HOURS) return cell;
  const days = (hours - DECAY_GRACE_HOURS) / 24;
  const late = Math.max(0, days - DECAY_LATE_AFTER_DAYS);
  const early = days - late;
  const lost = early * DECAY_PER_DAY + late * DECAY_PER_DAY_LATE;
  const strength = cell.strength - lost;
  return strength <= 0 ? null : { ...cell, strength };
}
```

`null` = vapautunut. Kutsuja kirjaa historiarivin ja tapahtuman.

## Testit

- [ ] 47 h → strength ennallaan
- [ ] 49 h → hieman rapistunut
- [ ] 10 vrk, alkuperäinen 500 → 500 − 8×10 = 420
- [ ] 20 vrk → sisältää sekä −10/vrk- että −25/vrk-jakson oikeassa suhteessa
- [ ] Strength 100, 12 vrk → **vapautuu** (`null`)
- [ ] Strength 500, 33 vrk → vapautuu; 32 vrk → ei vielä
- [ ] Käynti nollaa `lastVisitedAt`, rappeutuminen alkaa alusta
- [ ] Aikakelaus testissä ei vaadi oikeaa odottamista

## Ei kuulu tähän tikettiin

NPC-korruptio joka syö 30 vrk koskemattomia soluja (Vaihe 6, kohta G).
`pg_cron`-ajastin (Vaihe 3).

## Lähde

`MASTERPLAN.md` §2.1 · `files/CLAUDE.md` §Constants · `PROMPTS.md` Vaihe 2 kohta 4
