# BRDC-CLAIM-003 — Valtaus ja piiritysmalli (`capture`)

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-CLAIM-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Solujen omistajuudelle ei ole sääntöjä. Ilman piiritysmallia kaverin kotikorttelin
voisi varastaa yhdellä lenkillä — ja yksi väärennetty reitti riittäisi mihin tahansa.

## 🟢 GREEN

- [ ] `packages/core/rules/capture.ts` — puhtaat funktiot, aika parametrina
- [ ] **Vapaa solu** → valtaus, `strength = BASE_STRENGTH`
- [ ] **Oma solu** → `registerVisit`: kerran per kalenteripäivä, streak jos eilenkin
- [ ] **Vieras solu** → `strength -= attackPower`; **omistaja vaihtuu vasta nollassa**
- [ ] Omistajan vaihtuessa `strength` resetoituu arvoon `BASE_STRENGTH`
- [ ] Jokaisesta omistajuuden muutoksesta syntyy historiarivi
- [ ] Vitest-testit kaikille kolmelle haaralle

## Toteutus

**Vakiot** (`files/CLAUDE.md` §Constants):

```ts
BASE_STRENGTH        = 100
MAX_STRENGTH         = 500
DAY_VISIT_BONUS      = 25    // ensimmäinen käynti uutena kalenteripäivänä
STREAK_VISIT_BONUS   = 50    // ...ja olit siellä myös eilen
NEIGHBOUR_BONUS      = 15    // per omistettu naapuri, katto 90
ANCHOR_BONUS         = 200   // Vaihe 6
LEVEL_STRENGTH_BONUS = 5
```

```ts
attackPower = BASE_STRENGTH
            + level * LEVEL_STRENGTH_BONUS
            + min(ownedNeighbours * NEIGHBOUR_BONUS, 90)
            + anchorBonus
```

**Vahvistuminen on päiväkohtaista, ei käyntikohtaista.** Sama solu viisi kertaa tänään
ei tee ensimmäisen jälkeen mitään. Peräkkäiset päivät maksavat tuplasti. Peli palkitsee
rutiinia, ei grindaamista. Työmatkareitti saavuttaa katon ~2 viikossa; kerran kuussa
käyty metsälenkki ei koskaan.

**Piiritysmalli, ei kertaflippiä** (`MASTERPLAN.md` §2.2). Maksimipuolustus on 500,
maksimihyökkäysvoima ilman ankkuria noin 290. Kaverin vakiintuneen kotikorttelin
valtaaminen vaatii **kaksi tai kolme erillistä lenkkiä eri päivinä**.

> **Tätä ei saa "yksinkertaistaa" takaisin yhdeksi vertailuksi.**
> Se on lukittu päätös 1 ja samalla huijauksenesto: yksi väärennetty lenkki ei riitä mihinkään.

**Aika parametrina.** `registerVisit(cell, playerId, now)` ei lue `Date.now()`ta.
Ilman tätä päivävahvistusta ja streakia ei voi testata odottamatta oikeita vuorokausia.

**Kalenteripäivä:** UTC-päivä, ei paikallinen. Yksiselitteinen ja sama SQL:ssä
(Vaihe 3, golden fixture -testit vertaavat solu solulta).

## Testit

- [ ] Vapaa solu → omistaja asetetaan, strength 100
- [ ] Oma solu, ensimmäinen käynti tänään → +25
- [ ] Oma solu, toinen käynti **samana päivänä** → +0
- [ ] Oma solu, käynti myös eilen → +50 (streak)
- [ ] Strength ei ylitä 500:aa
- [ ] Vieras solu strength 300, attackPower 150 → strength 150, **omistaja ei vaihdu**
- [ ] Vieras solu strength 100, attackPower 150 → omistaja vaihtuu, strength 100
- [ ] Naapuribonus: 8 omistettua naapuria → bonus 90 (katto), ei 120
- [ ] Historiarivi syntyy vain omistajuuden vaihtuessa, ei jokaisesta käynnistä

## Ei kuulu tähän tikettiin

Rappeutuminen (BRDC-CLAIM-004). Anchor Stone -bonus — kenttä varataan nyt, mekaniikka
on Vaihe 6. SQL-toteutus ja golden fixture -testit (Vaihe 3).

## Lähde

`MASTERPLAN.md` §2.1–2.2, lukittu päätös 1 · `files/CLAUDE.md` §Constants ·
`PROMPTS.md` Vaihe 2 kohta 3
