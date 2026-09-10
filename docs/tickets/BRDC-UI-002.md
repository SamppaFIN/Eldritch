# BRDC-UI-002 — Harmaa nappi ilman syytä on rikkinäinen nappi

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-ECON-009 (sama oire, eri syy) |
| **Status** | `done` — 2026-09-10 (v0.5.62) |
| **Valmius** | 100 % — portti vihreä, desktop e2e 23/23 |
| **Lähde** | Infinite 2026-09-10: *"mä koitan rakentaa tai concentrate temple, niin napista ei tapahdu mitään"* ja *"sama ward napista"* |

## 🔴 RED

**Kolme nappia oli disabloitu kertomatta miksi.** Kosketusnäytöllä ei ole hoveria joka
selittäisi, joten harmaa nappi ja rikkinäinen nappi ovat sama asia.

| Nappi | Portti | Mitä pelaaja näki |
|---|---|---|
| **Ward** | `mine && strength < 500 && wood >= 25` | harmaa, ei syytä |
| **Consecrate** | `canAfford(resources, cost)` | harmaa, ei syytä |
| **Expand temple** | `canAfford(resources, nextCost)` | harmaa, ei syytä |

`ConsecratePanel`in oma docstring myönsi sen ääneen:

> *"The button is only shown when consecration would succeed, so there is no refusal line
> — **the disabled state carries "cannot afford"**."*

Disabloitu tila ei kanna mitään. Se on juuri se oletus jonka tämä tiketti kumoaa.

**Wardin tapaus on pahin.** `strength >= MAX_STRENGTH` disabloi napin — ja Infinitellä on
soluja jotka on kävelty viikkoja, eli **täydessä 500 vahvuudessa**. Ne ovat parhaita
soluja koko valtakunnassa, ja peli vastasi niiden kohdalla vaikenemalla. "Tämä maa ei voisi
olla turvallisempi" luettiin "nappi ei toimi".

Sivuseikka joka teki tästä pahemman: `canPay` ja `canExpand` vaativat `resources !== null`,
joten **pussin latautuessa kaikki kolme olivat harmaita ilman syytä.** BRDC-ECON-009:n
silmukka piti pussia tyhjänä sekuntikausia, ja nämä napit vaikenivat koko sen ajan.

## 🟢 GREEN

- [x] **`shortOf(pool, cost)`** (`rules/afford.ts`, puhdas): mitä pussista puuttuu ja
      kuinka paljon. Erillään `canAfford`ista joka vastaa kyllä/ei. **Lukematon pussi on
      vajaa koko kustannuksen verran** — *"tarvitset 120 kiveä"* luvun latautuessa on
      parempi kuin harmaa nappi, ja se korjaa itsensä hetken päästä.
- [x] **`gateNote.ts`** (app, puhdas): `missingPhrase` ja `shortNote`. Käyttää pelin omia
      sanoja (`RESOURCE_WORD`) — pussi sanoo *timber*, joten vajekin sanoo *timber*.
- [x] **Ward kertoo kumman portin takana se on:** *"Already at full strength — a ward would
      add nothing."* tai *"Short 25 timber."*
- [x] **Consecrate kertoo vajeen ja toisen tavan maksaa se:** *"Short 120 stone and 80 gold.
      Walking here longer also pays it down."* — dwell maksaa hintaa alas, ja se oli tieto
      jota ei kerrottu missään napin lähellä.
- [x] **Expand kertoo vajeensa.**
- [x] Malli on talon oma: Riitit ovat aina sanoneet *"Locked — study Astronomy at its
      temple"* sen sijaan että harmaantuisivat hiljaa. Nyt muutkin tekevät niin.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1113**) + `pnpm build` vihreä.
- [x] `afford.test.ts` +4: ei sano mitään kun on varaa · nimeää vain puuttuvan ·
      **lukematon pussi on vajaa koko kustannuksen** · ei mainitse resurssia jota
      kustannus ei nimeä.
- [x] `gateNote.test.ts` (5): yksi vaje · kaksi "and":llä ja kolme pilkuilla ·
      **pelin oma sana eikä kentän nimi** · tyhjä on tyhjä · lause tai null.
- [x] e2e `opening.spec.ts` +2 desktopilla: Consecrate on disabloitu **ja** kortti kertoo
      vajeen ja kävelyn vaihtoehtona; ja **täyteen vahvuuteen asetettu heksa** sanoo
      *"Already at full strength"* — tasan se tilanne josta Infinite raportoi.
- [x] Desktop `opening` + `dialogs` + `step-claim` **23/23**.
- [ ] Kenttä: paina Wardia täydessä solussa ja katso että se kertoo miksi. *(Infinite ajaa.)*

## Miksi tämä oli kaksi eri vikaa samalla oireella

`BRDC-ECON-009` oli renderisilmukka joka piti pussin tyhjänä, jolloin napit olivat
**oikeasti** varattomia. Tämä tiketti on se että ne eivät sanoneet sitä. Ensimmäinen
korjattiin ja oire jäi, koska toinen oli edelleen voimassa — ja juuri siksi kannatti
lopettaa arvailu ja lukea jokaisen napin portti koodista.

## Ei tässä

- **`AnomalyPanel`, `ManaPanel` (Light the Altar) ja `KeepTemples`** disabloivat samalla
  tavalla. `shortNote` on niitä varten valmis ja muutos on niissä yksi rivi kussakin,
  mutta Infinite nimesi kolme nappia ja nämä ovat eri ruuduilla. Oma tikettinsä, sama malli.
- **Disabloinnin poistaminen kokonaan** (nappi aina painettavissa, torjunta viestinä).
  Puolustettavissa, mutta se veisi katseelta tiedon siitä mikä on ulottuvilla — ja
  torjunta klikkauksen jälkeen on hitaampi vastaus kuin syy joka on jo ruudulla.
