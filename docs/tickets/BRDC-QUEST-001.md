# BRDC-QUEST-001 — Seikkailut: järvenpuhdistus ja graafinen dialogi

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-EVENT-001, BRDC-ART-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (S1–S2) |

## 🔴 RED

Pelillä ei ole ääntä. Mikään ei puhu pelaajalle, mikään ei pyydä häneltä mitään,
eikä mikään pääty. Lääni kasvaa ja kuluu, ja se on koko kaari.

v2:n paras aineisto — Fuming Lake, kohtaamiset, hahmot — on `docs/backlog/`issa
odottamassa mekaniikkaa, johon se voidaan asettaa. Golden rule 6 pitää sen siellä
kunnes runko kestää sen. `BRDC-EVENT-001` on se runko.

## 🟢 GREEN

- [x] **Seikkailu on JSON-tiedosto**: vaiheet, ehdot, valinnat, palkinnot
      → `packages/core/src/data/adventures.json`, skeema `rules/adventure.ts`
- [x] Ensimmäinen seikkailu on **järvenpuhdistus** — se sitoo maaston (`terrain: 'lake'`),
      resurssit (`gold`/`iron`/`wisdom` peikon kolmella reitillä) ja kävelyn
      (`holdsSite` — patsas, viisauden kivi, sauva, hely) yhteen tarinaan
- [x] **Graafinen dialogi**: puhuja, muotokuva, valinnat
      → `apps/game/src/features/quest/AdventureDialog.tsx` + `portraits.tsx`
      (SVG-sigili per ääni, stroke, ei täyttöä; pyörivä risti patsaalle)
- [x] Dialogi on **luettavissa liikkeessä**: ei modaali, ESC ja "Later" sulkevat,
      valintateksti lyhyt; kertova teksti on lore-sisältöä (§14, vapautettu)
- [x] Seikkailu **ei estä peliä**: avataan Hearthista, "Later" sulkee, "Abandon" jättää
- [x] Edistyminen säilyy reloadin ja resetin yli — `K.adventures` versioidussa storessa;
      `resetAll` → `store.clear()`; testattu (`adventure.repo.test.ts`)
- [x] Seikkailun kulku on puhdas funktio tilasta ja valinnasta; testattu haaroineen
      → `adventure.test.ts` (17 t): kolme peikkoreittiä, portit, graafin saavutettavuus

## Toteutus

**JSON, koska sisältöä tulee lisää eikä sen kirjoittaminen saa vaatia kääntämistä.**
Tämä on suoraan suunnitelman ehdotus (*"JSON-pohjaiset tarinat"*) ja se on oikea:
v2:n virhe ei ollut sisällön määrä vaan se, että sisältö oli koodissa.

Skeema validoidaan **latausaikana ja testissä**, ei ajonaikaisella `any`-kikalla.
Rikkinäinen tarina on sisältövirhe, joka pitää löytyä ennen julkaisua.

## Ei tässä

- Taistelu osana seikkailua. `BRDC-WAGER-BATTLE-001` on PvP:tä; PvE-taistelu on oma
  päätöksensä, eikä sitä ole pyydetty
- Ääninäyttely ja TTS. `docs/backlog/`, Vaihe 6

## Jatkoon

- **Kartan tavoitemarkkerit** — kymmenen `QUEST_SITES`-koordinaattia kultaisina
  sigileinä kartalla, kun Fuming Lake on auki. Vaatii oman karttatason; `MapCanvas` on
  rivikatossa. Dialogi nimeää paikat sanoin siihen asti.
- HUD:n XP/pouch päivittyy seikkailuvalinnan jälkeen vasta minuuttipollilla — dialogi
  itse kertoo palkinnon heti. Kun `useAdventure` siirtyy MapView'hun, kytke sama
  `afterSpend`-virkistys kuin muillakin kulutuksilla.
