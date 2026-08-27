# BRDC-CLAIM-004 — Rappeutuminen ja vapautuminen (`decay`)

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-003 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 100 % |

## 🔴 RED

Kerran vallattu alue jäisi ikuisesti. Kahdella pelaajalla kartta jähmettyisi parissa
viikossa: kaikki mihin on kerran kävelty on omaa, eikä mitään ole enää tehtävissä.

## 🟢 GREEN

- [x] `packages/core/rules/decay.ts` — **puhdas funktio, "nyt" annetaan parametrina**
- [x] 0–48 h viimeisestä käynnistä → ei rappeutumista (armonaika)
- [x] 2–14 vrk → **−10 / vrk**
- [x] yli 14 vrk → **−25 / vrk**
- [x] `strength ≤ 0` → **solu vapautuu**, omistaja `null` — ei jää minimiarvoon
- [x] Vapautumisesta syntyy historiarivi ja lore-sävyinen tapahtuma:
      **"The Void reclaims"**
- [x] Rappeutuminen ajetaan **lukuhetkellä**, ei taustajastimella

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

- [x] 47 h → strength ennallaan
- [x] 49 h → hieman rapistunut
- [x] 10 vrk, alkuperäinen 500 → 500 − 8×10 = 420
- [x] 20 vrk → sisältää sekä −10/vrk- että −25/vrk-jakson oikeassa suhteessa
- [x] Strength 100, 12 vrk → **vapautuu** (`null`)
- [x] Strength 500, 33 vrk → vapautuu; 32 vrk → ei vielä
- [x] Käynti nollaa `lastVisitedAt`, rappeutuminen alkaa alusta
- [x] Aikakelaus testissä ei vaadi oikeaa odottamista

> **Nimetty uudelleen: `applyDecay` → `projectCell`.**
>
> Testi jonka kirjoitin väitti että rappeutumisen soveltaminen kahdesti antaa saman
> tuloksen. Se ei anna — ja se **ei ole bugi vaan suunnittelun ydin**, joka olisi ollut
> helppo "korjata" väärin:
>
> - Jos `lastVisitedAt` päivitettäisiin projektiossa, jokainen luku antaisi solulle
>   uuden 48 h armonajan. Riittävän usein katsottu solu ei rappeutuisi koskaan.
> - Jos projektio tallennetaan takaisin, samat päivät veloitetaan uudelleen.
>
> Tallennettu tila muuttuu **täsmälleen kahdesta tapahtumasta**: käynti (asettaa
> voiman ja aikaleiman) ja vapautuminen (poistaa solun). Kaikki siltä väliltä on
> lukuhetken aritmetiikkaa. Nimi kertoo sen, jotta "sovella ja tallenna" ei näytä
> ilmeiseltä. Väärinkäyttö on nyt oma testinsä, ei kommentti.
>
> `hoursUntilReleased` lisättiin HUDin varoitusta varten: pelaaja joka saa tietää
> menetyksestä vasta jälkikäteen ei palaa; se joka kuulee torstaina että lauantain
> reitti hiipuu, lähtee kävelylle.

## Ei kuulu tähän tikettiin

NPC-korruptio joka syö 30 vrk koskemattomia soluja (Vaihe 6, kohta G).
`pg_cron`-ajastin (Vaihe 3).

## Lähde

`MASTERPLAN.md` §2.1 · `files/CLAUDE.md` §Constants · `PROMPTS.md` Vaihe 2 kohta 4
