# BRDC-WORKS-001 — Rakennuksen oma sivu: "What Stands on the Ground"

| | |
|---|---|
| **Alue** | `apps/game/src/features/works/` (uusi), `packages/ui/src/styles/tokens.css`, `CellPanel` (ovi), `KeepBuildingsPanel` (ovi) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `draft` — speksi kirjoitettu 2026-09-24, ei aloitettu (testitauko) |
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

- [ ] Sivu avautuu kolmesta paikasta: `CellPanel` (oma tai rivaalin solu, jolla on
      rakennus), `KeepBuildingsPanel`in rivi ja kartan rakennusikoni. Sama komponentti
      kaikille, ESC sulkee, fokus palaa avaajaan (§14)
- [ ] Yläpuoli kohdat 1–8 renderöityvät `BuildingDef`istä (WORKS-002), eikä yhtään
      rakennuskohtaista haaraa JSX:ssä. Uusi rakennus = uusi data, ei uusi komponentti
- [ ] Ulottuvuuskaavio piirtää `rings` yhtenäisenä ja `maxRings - rings` katkoviivana;
      testi `reachRings.test.ts` (renkaat → solumäärä: 1 → 6, 2 → 18, 3 → 36)
- [ ] Puu: viisi tasoa, valintatasot kehystettynä, tilat laskettu
      `nodeState(def, learned)`-funktiolla (WORKS-002), ei komponentissa
- [ ] Vaikutuslauseen korostettu osa tulee tyypitetystä `Effect`istä (WORKS-002),
      ympäröivä lause on copyä. Väri seuraa efektin resurssia automaattisesti
- [ ] Solmun napautus valitsee sen CTA:han. CTA on disabloitu ja kertoo syyn sanoin,
      kun rahat eivät riitä ("Short 20 stone") — sama kuvio kuin Ward-napissa
- [ ] **Rivaalin rakennus on vain luku, ei piilotettu:** koko puu ja rivaalin opitut solmut
      näkyvät, ainoa ero on CTA. Omistajasiru `HELD BY …`, lukulaatta `YOUR ATTACK`
- [ ] Lore voidaan piilottaa (asetus tai kehittäjäkytkin). Sivu on luettava ilman sitä,
      ja e2e tarkistaa sen
- [ ] 360 px ensin: ei vaakavieritystä 200 % zoomilla, CTA ≥ 44 px, peukalolla
      tavoitettava (§14, §19)
- [ ] Rivibudjetti: sivu jaetaan `WorksPage` · `WorksHeader` · `WorksReach` ·
      `WorksTree` · `WorksNode`, jokainen alle 400 rivin. CSS menee `tokens.css`iin
      (`.es-works*`), ei uutta CSS-tiedostoa, jos UI-001:n linja on silloin voimassa
- [ ] e2e `works.spec.ts`: avaa oma Farmstead → näkyy `LEVEL`, puu, AVAILABLE-solmu;
      tutki solmu → tila `✓`, taso nousee, pussi pienenee; avaa rivaalin rakennus →
      ei tutkimusnappia
- [ ] Portti: `pnpm test && pnpm typecheck && pnpm lint:lines && pnpm build`

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
