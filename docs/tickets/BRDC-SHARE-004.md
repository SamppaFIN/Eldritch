# BRDC-SHARE-004 — Yksi paha solu ei saa kaataa koko jaettua maailmaa

| | |
|---|---|
| **Alue** | `packages/core/src/geo/cells.ts`, `packages/core/src/data/world.ts`, `apps/worker/src/index.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Riippuvuudet** | ei mitään |
| **Status** | `done` — 2026-09-22 (v0.6.50) |

## 🔴 RED

Löydetty vahingossa `BRDC-ATLAS-001`in datakerrosta käsin todentaessa: yksi
käsinkirjoitettu testi-h3-merkkijono osoittautui virheelliseksi, ja `/atlas` kaatui
`h3-js`in `H3LibraryError: Cell arguments had incompatible resolutions`iin. Jäljitetty:

- `parseSubmission` (`world.ts`) tarkistaa JSON-muodon ja tarkistussumman, muttei sitä
  että jokainen `cells[].h3` (tai `castle`) on aidosti kelvollinen res-11-h3-indeksi.
  Mikä tahansa merkkijono kelpaa niin kauan kuin JSON parsii ja checksum täsmää
- `demographics.ts`in `provinces`-mittari (`regionOf(c.h3)`) ja uusi `atlasOf`
  (`nationRegionOf(c.h3)`) kutsuvat molemmat `cellToParent`ia jokaiselle solulle —
  ja `h3-js` **heittää poikkeuksen**, ei palauta virhearvoa, kun solu ei ole aidosti
  sillä resoluutiolla jota se väittää olevansa
- Worker laskee `/demographics`in, `/clan-codex`in ja `/atlas`in **samassa**
  `rebuild()`-kutsussa jokaisella `/submit`illa. Yksi paha solu KENEN TAHANSA
  pelaajan viimeisimmässä tiedostossa kaataa kaikki kolme, kaikilta, joka ikisellä
  julkaisulla — kunnes joku onnistuu julkaisemaan uudelleen ilman virheellistä solua
  ja korvaa KV:n. Käytännössä yksi tahallisesti väärämuotoinen `/submit` lamauttaisi
  koko jaetun maailman kaikilta pelaajilta samaksi ajaksi

Pelin oma pelaaja ei koskaan tuota tällaista — h3-tunnisteet syntyvät aina
`cellAt`/`ringToCells`in kautta. Mutta Worker ei tiedä sitä, eikä sen pitäisi luottaa
siihen: `index.ts`in oma kuvaus sanoo suoraan *"it cannot tell a liar from an honest
player"* — se koskee myös muotoa, ei vain arvoja.

## 🟢 GREEN

- [x] `geo/cells.ts`: uusi `isOwnershipCell(h3: string): boolean` —
      `isValidCell(h3) && getResolution(h3) === H3_RES_OWNERSHIP`. Yksi paikka joka jo
      puhuu `h3-js`lle suoraan; muu koodi käyttää tätä eikä `h3-js`ia itse
- [x] `parseSubmission` (`world.ts`): jokainen `cells[].h3` ja ei-null `castle`
      tarkistetaan `isOwnershipCell`illa ennen checksumin laskentaa. Väärä solu →
      `{ok: false, fault: 'invalid-cell'}`, uusi `WorldFault`-arvo — sama kuvio kuin
      `not-a-shard`/`damaged`/`too-large`illa jo on, nimetty virhe eikä hiljainen kaatuminen
- [x] Worker `rebuild()`: puolustus toisessakin kerroksessa, KV:ssä jo olevaa dataa
      vastaan (esim. ennen tätä korjausta tallennettu rivi). `allFiles()`in jälkeen,
      ennen `demographicsOf`/`atlasOf`/`buildShards`ia, `live` suodatetaan samalla
      `isOwnershipCell`illa — paha rivi pudotetaan, ei kaadeta koko ajoa. Sama filosofia
      kuin `allFiles()`in omalla "rivi joka ei parsi on yksi pelaaja poissa, ei rikki
      maailma" -kommentilla, laajennettuna muotovirheeseen sisällöltään pätevästä JSONista
- [x] Worker: viisi erillistä `mergePlayerFiles(await allFiles(...))`-kutsukohtaa
      (`rebuild`, `/demographics`, `/clan-codex`, `/atlas`, `/roster`) yhdistetty
      yhdeksi `liveSources()`-apurifunktioksi joka soveltaa suodatuksen — sama korjaus
      kaikille viidelle yhdellä kertaa, ei viittä erillistä paikkaa unohtaa
- [x] Portti: `lint:lines`, `tsc -b`, **1648** vitest (+9: `isOwnershipCell` × 5,
      `parseSubmission`in uudet kolme testiä), `pnpm build`

## Todennus

`cells.test.ts`: `isOwnershipCell` hyväksyy `cellAt()`in tuottaman solun, hylkää saman
solun vanhemman (väärä resoluutio) ja täysin mielivaltaisen merkkijonon — ei koskaan
heitä, palauttaa aina booleanin. `world.test.ts`: `parseSubmission` palauttaa
`invalid-cell`in kun jokin `cells[].h3` on virheellinen, sama kun `castle` on
virheellinen (ei-null), hyväksyy edelleen `castle: null`in.

**Käsin, oikeaa Workeria vasten, molemmat puolustuskerrokset erikseen:**
1. Sama tarkalleen se virheellinen h3-merkkijono joka alun perin kaatoi `/atlas`in
   lähetettiin uudelleen `/submit`iin — palautti nyt siististi `{"fault":
   "invalid-cell"}`in, ei kaatunut
2. Virheellinen pelaajatiedosto kirjoitettiin **suoraan KV:hen** ohi `/submit`in
   (`wrangler kv key put --local`), simuloiden riviä joka olisi tallennettu ennen tätä
   korjausta. `/atlas` ja `/demographics` palauttivat molemmat oikean datan muilta
   pelaajilta, pahan rivin hiljaa pudotettuna — ei kaatumista kummassakaan

## Ei tässä

- KV:ssä jo olevan, ennen tätä korjausta tallennetun pahan rivin **siivoaminen pois**.
  `rebuild()`in suodatus jättää sen hiljaa huomiotta joka ajolla — se ei koskaan enää
  kaada mitään, mutta se ei myöskään poistu KV:stä itsestään ennen 30 vrk TTL:ää.
  Ei koettu ongelmaksi: se ei maksa mitään maata levätä siellä käyttämättömänä
- Muiden kenttien (nimi, kansallisuus, klaanikoodi) muotovalidointi — niillä ei ole
  samaa "heittää poikkeuksen väärällä syötteellä" -riskiä kuin h3-indekseillä
