# BRDC-WORKS-001 — Rakennuksen oma sivu: "What Stands on the Ground"

| | |
|---|---|
| **Alue** | `apps/game/src/features/works/` (uusi), `packages/ui/src/styles/tokens.css`, `CellPanel` (ovi), `KeepBuildingsPanel` (ovi) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `[~]` osittain valmis 2026-09-28 (v0.6.63) — sivu, puu ja tutkimus ajettu ja todennettu; kaksi ovea ja rivaalin opitut solmut siirtyivät |
| **Riippuvuudet** | `BRDC-WORKS-002` (puumoottori), `BRDC-WORKS-003` (sisältö), `BRDC-DETAIL-003` (toimintorivi), `BRDC-UI-001` (jaettu arkki, jos valmis) |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-pelin uusi design systeemi.pdf` — "Eldritch · Works Codex", 9 rakennussivua |

## 🔴 RED

Rakennuksella ei ole omaa sivua. Rakennus näkyy tänään rivinä `CellPanel`issa ja
`KeepBuildingsPanel`issa (hinta, tuotto) eikä mitään muuta: ei tasoa, ei tutkimusta, ei
ulottuvuutta, ei loren riviä. Designin lupaus on, että **jokainen rakennus on paikka jonne
kannattaa kävellä takaisin**, ja tänään rakennuksen rakentamisen jälkeen ei ole mitään
mitä sillä tehdä.

Rivaalin rakennusta ei voi avata lainkaan, joten ei myöskään voi nähdä, mitä sen
valtaamalla voittaisi.

## Sivun anatomia (PDF:n mukaan, ylhäältä alas)

Sama muoto kaikille yhdeksälle. Muoto opitaan kerran, jonka jälkeen minkä tahansa sivun
lukee yhdellä silmäyksellä.

**Yläpuoli: mikä tämä on, kenen se on, mitä se antaa**

1. **Yläpalkki:** `‹ WORKS` (takaisin) vasemmalla, `LEVEL n / 5` oikealla.
   Taso = opittujen tasojen (tier) määrä, ei solmujen määrä.
1b. **Heksan toimintorivi** (`CellActions`, BRDC-DETAIL-003) heti yläpalkin alla: kaikki
   tämän heksan omat toiminnot (Ward, Reveal, Demolish…) yhdessä rivissä. Rakennuksen
   Research-CTA ei kuulu tähän, se pysyy alareunassa (kohta 12).
2. **Kuva:** rakennuksen sprite (`buildingSprites.ts`) isona, rakennuksen oma
   sävy (`hue`, OKLCH) taustahehkuna. Eksplisiittinen `width`/`height` (§14 CLS).
3. **Nimi** (Cinzel, `--text-h2`), **alaotsikko**: suomenkielinen nimi · rakentamissääntö
   ("Maatila · Built on plains", "Koivujen temppeli · Revealed, not built").
4. **Omistajarivi** siruna: `YOURS · <kansakunnan nimi>` tai `HELD BY <rivaali/klaani>`.
   Toinen siru: `<MAASTO> · <bonusresurssi tai paikan nimi>` ("PLAIN · WHEAT DEPOSIT").
5. **Lore-lainaus:** Cinzel italic, lainausmerkit, lähde alla pienellä kirjasimella, jossa on
   harvennus ("— Foreman's log, Rantaperkiö mill, 1922").
6. **Kolme lukulaattaa:** aina `STRENGTH` ensin ja `UPKEEP` viimeisenä. Keskimmäinen
   on rakennuskohtainen (PROVINCES, RITES, STORES, STACKED, DEPTH, HEAT, TRADES, SIGHT,
   QUESTS), rivaalin sivulla `YOUR ATTACK`.
7. **"THE <X> GIVES" -lohko:** tuottosirut (`+4 FOOD/H`) resurssin värissä
   (`RESOURCE_COLOUR`), alla yksi–kaksi lausetta siitä, miksi rakennus on tärkeä.
8. **Ulottuvuus (reach):** otsikko `<NIMI> n RING · m CELLS`, pieni heksarengaskaavio
   (inline SVG, stroke, ei fill §12). **Yhtenäiset renkaat = nyt, katkoviiva = mitä
   tutkimus voi vielä ostaa.** Alle lause, joka nimeää sen solmun, joka laajentaa renkaan.

**Alapuoli: rakennuksen oma tutkimuspuu**

9. **Puun otsikko:** puun nimi (Cinzel, "The Hungry Furrow") + `n / m LEARNED`.
10. **Pystyselkä** I–V vasemmalla, solmukortit oikealla. Tason III (ja joillain V)
    kaksi korttia on kehystetty otsikolla `CHOOSE ONE · THE OTHER CLOSES`, ja niiden välissä
    on `OR`.
11. **Solmukortti:** nimi + tilamerkki (`✓ LEARNED` / `◆ AVAILABLE` / `○ LOCKED` /
    `RIVAL` / suljettu valinta), **vaikutuslause, jossa tyypitetty osa korostettu
    resurssin värissä**, sen alla lore (Cinzel italic, *aina vaikutuksen alla, ei
    koskaan yllä*: sääntö ensin, kauhu toisena), alimpana hintasirut + `Needs <taso>`.
12. **Kiinteä CTA alareunassa:** omalla sivulla `RESEARCH · <valittu solmu>` + hinta.
    Rivaalin sivulla `BESIEGE THIS WORK` + ohjerivi (ks. päätös P2).

**Tilat ja niiden merkitys (legenda PDF:n yläosassa)**

| Merkki | Tila | Näkyvyys |
|---|---|---|
| ✓ | LEARNED | täysi väri, reunaviiva kulta |
| ◆ | AVAILABLE NOW | korostettu reuna (cyan), napautettavissa |
| ○ | LOCKED | himmennetty, nimeää edeltäjänsä ("Needs III") |
| — | CHOOSE ONE · THE OTHER CLOSES | kehys kahden kortin ympärillä |
| suljettu | valittiin toinen | yliviivattu tai himmeä, "Closed by choice" |
| RIVAL | rivaalin puu | vain luku |

Väri ei koskaan kanna tilaa yksin (§14): jokaisella tilalla on myös merkki ja sana.

## 🟢 GREEN

- [~] Sivu avautuu kortin toimintorivistä ("Open The Keep", "Open Farmstead"…), kaikille
      yhdeksälle. Kartan rakennusikonin napautus valitsee solun, joten sivu on yhden napautuksen
      päässä. **`KeepBuildingsPanel`in rivi ei vielä avaa sivua (siirtyi).** Sivu on native
      `<dialog>` (`Modal`): ESC sulkee sivun muttei korttia, fokus palaa avaajaan (e2e)
- [x] Yläpuoli renderöityy `BuildingDef`istä ilman rakennuskohtaisia haaroja JSX:ssä
      (`features/works/WorksPage.tsx`)
- [x] Ulottuvuuskaavio: `rings` yhtenäisenä, loput katkoviivana; nukkuvalla renkaalla
      "not yet awake". Solumäärät `cellsInRings` (testi `works/tree.test.ts`: 0, 6, 18, 36)
- [x] Puu: viisi tasoa, valintataso kehystettynä ("Choose one · the other closes", "or"),
      tilat `nodeState`ista (`WorksTree.tsx`)
- [x] Korostettu osa (`hl`) tulee datasta, väri efektin resurssista (`effectResource`, testi)
- [x] Solmun napautus valitsee sen CTA:han; ensimmäinen opittavissa oleva on valmiiksi
      valittu. Puute sanotaan sanoin ("Short 20 stone.", `shortLine`, testi)
- [~] Rivaalin rakennus: vain luku, ei tutkimusnappia, CTA sanoo "Held by another. Step onto
      it to take it" (P2 ratkaistu CLAIM-017:n mukaan). **Rivaalin opitut solmut eivät näy**,
      koska `world.json` ei kanna puuta vielä (WORKS-002)
- [x] Lore piilotettavissa sivun "Lore"-kytkimestä (muistetaan `localStorage`ssa, try/catch);
      e2e todentaa, että sääntö näkyy ilman lorea
- [x] 360 px ensin: `works.spec.ts` ajettu mobile-360:ssa ja desktopissa
- [x] Rivibudjetti: `WorksPage` 174 · `WorksTree` 91 · `WorksReach` 40 · `worksCopy` 69 ·
      `useWorksPage` 61. CSS on `works.css` (UI-001:n yhteinen arkki ei ole vielä olemassa)
- [x] e2e `works.spec.ts`: Keep avautuu kortista → Level 0/5, puu, "◆ Available" ja "○ Not
      yet awake" → Research · Warded Walls → "✓ Learned", Level 1/5 → lore pois, sääntö
      jää → ESC sulkee sivun, kortti jää. Keep valittiin Farmsteadin sijaan, koska sen voi
      tutkia aloituskivillä ilman rakentamista
- [x] Portti: `pnpm test`, `pnpm typecheck`, `pnpm lint:lines`, `pnpm build`; e2e
      `works` + `cell-actions` + `opening` 20/20 (yksi worker)

**Löydös matkalla:** pussin laskenta luki puut omalla IndexedDB-haullaan, ja mobiilin
aloituspussi alkoi myöhästyä (`opening.spec.ts:22` 2/3 punaisena, vertailukopiossa 3/3
vihreänä). Korjaus: `perHourBonus` lukee nyt kaikki kahdeksan avaintaan yhdellä
`getMany`-kutsulla seitsemän erillisen sijaan. Pussi näkyy nyt 6,5–8,9 sekunnissa, kun
vertailukopiossa aika oli 8–9 s.

## Päätös Infiniteltä

- **P1 — Keep ja Temple eivät ole `BuildingId`itä.** Keep on Hearth-solu, Temple on
  paljastettu paikka (`templeStore.ts`). Design kohtelee niitä rakennuksina, joilla on puu.
  Ehdotus: sivu ottaa `BuildingDef`in avaimeksi `StructureKind`in (`'keep' | 'temple' |
  BuildingId`), jolloin Keep ja Temple saavat sivun muuttumatta rakennuksiksi.
- **P2 — "Besiege" ja CLAIM-017.** PDF:n rivaalin CTA sanoo *"Walk the cell on separate
  days · strength 420"*. Se on vanha piiritysmalli, jonka CLAIM-017 kumosi askelvaltaukselta:
  nykyään rivaalin heksa vaihtaa omistajaa heti, kun sille astuu. Vain Hearth ja Fortress
  kaatuvat yhä kulutustaistelulla. Joko CTA sanoo *"Step onto it to take it"*, tai
  rakennuksen sisältävä heksa suojataan kuten Fortress (uusi sääntö).
- **P3 — Watchtower puuttuu yhä** (BUILD-013 siirsi sen, koska kaksi mekaniikkaa
  puuttuu). Sivu ja puu voidaan tehdä, mutta rakennusta ei voi rakentaa ennen sitä.
- **P4 — Ylläpito (UPKEEP, `-1 food/h`) on uusi mekaniikka.** Tänään rakennus ei maksa
  mitään. Näytetäänkö laatta vasta, kun ylläpito oikeasti vähenee pussista?

## Ei tässä

- Puun säännöt ja tila (WORKS-002), sisältö (WORKS-003)
- Uudet rakennukset (Watchtower) — BUILD-013
- Kartan renkaiden piirto rakennuksen ympärille — PDF sanoo "on the page **and on the
  map**". Kartan osa on oma tikettinsä, kun sivu on todennettu.
