# BRDC-SEED-005 — A rebuild does not get to keep a reveal it already broke

| | |
|---|---|
| **Alue** | `data/hexSeedStore.ts`, `data/revealStore.ts`, `data/createRepository.ts`, `features/map/useBoot.ts`, `features/hud/notices.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[x]` valmis 2026-09-16 |
| **Riippuvuudet** | `BRDC-SEED-003`/`-004` (siemen), `BRDC-CLAIM-009` (`revealAt`) |
| **Lähde** | Infinite 2026-09-16: *"kun kartta on muuttunut, niin päivitetään localstoragesta kaikki vanhentuneet karttapisteet.. nämä tulee your lansiin uudelleen reveal.. tämä sen takia, että pelaaja menetti resurssia ja local storagessa on heksalle väärä tieto"* |

## 🔴 RED — mitattu, ei arvattu

Tämä istunto teki jo kolme erillistä muutosta Härmälänrannan siemendataan (`BRDC-SEED-003`,
`-004`, `BRDC-RES-001`). `terrainForCell`/`bountyOn` lukevat siemenen aina **elävänä** —
maasto ja löytö näkyvät kortilla aina ajantasaisina. **Bugia ei ollut siinä, vaan
`revealed[h3]`in omassa muodossa:**

- `revealed` (`revealStore.ts`, `K.revealed`) on `Record<H3Index, number>` — **pelkkä
  aikaleima**, ei tallennettu kuvaus siitä mitä silloin löytyi
- `revealAt` (`revealStore.ts:28`) kieltäytyy pysyvästi `'already-revealed'`illa heti kun
  `revealed[h3]` on olemassa — **ei koskaan uudelleen**, vaikka siemen olisi sittemmin
  muuttunut
- Seuraus: pelaaja joka paljasti heksan ennen jotain näistä kolmesta muutoksesta sai
  maksun **silloisen** datan mukaan eikä voi koskaan enää paljastaa samaa heksaa
  saadakseen sen mitä siellä **nyt** oikeasti on. Täsmälleen se mitä Infinite raportoi

## 🟢 GREEN

- [x] **Siemenen oma aikaleima, ei arvattu versio.** `harmala.json`in juuritaso oli jo
      `{builtAt, area, hexes}` — `HexSeedDoc` (`hexSeedStore.ts`) lukee nyt `builtAt`in,
      ja uusi `harmalaBuiltAt()` palauttaa sen (tyhjä merkkijono kun Worldseed-luku on
      pois päältä, sama sopimus kuin `hexSeedOf`illa)
- [x] **`staleReveals(revealed, currentBuiltAt, lastSeenBuiltAt)`** (`revealStore.ts`,
      puhdas, testattu): hiljaa jos build on sama tai `currentBuiltAt` on tyhjä; muuten
      jokainen `revealed`in heksa joka on siemenalueen sisällä (`rules/terrainSeed.ts`in
      `inBox`, vietiin julkiseksi tätä varten). Vain siemenalue on koskaan epäilyttävä —
      hajautukseen perustuva maasto ei ole koskaan muuttunut eikä muutu
- [x] **`reconcileSeedReveals(store)`**: lukee `revealed`in ja viimeksi nähdyn build-ajan
      (`K.seedBuiltAt`, uusi avain), poistaa vanhentuneet `revealed`ista, kirjoittaa
      nykyisen build-ajan talteen. Ei kirjoita mitään kun mikään ei muuttunut
- [x] **Kytketty käynnistykseen**, ei erillistä nappia: `createRepository()`in uusi
      `staleReveals`-kenttä (sama kuvio kuin `takeRazed`), `MockRepository`in uusi
      `reconcileSeedReveals`-metodi `GameRepository`in rajapinnassa
- [x] **Ilmoitus, sama kohtelu kuin rakennusmigraation `razed`illa:** uusi
      `staleRevealsLine(count)` (`notices.ts`), `NoticeConditions.staleReveals`,
      tahmea (`sticky`) ilmoitus sekä kartalla (`MapNotices`) että aloitusruudun
      Wager-polulla (`App.tsx`) — sama kaksi paikkaa joissa `razed`kin jo raportoidaan
- [x] **Pelaaja ei menetä mitään:** `revealed[h3]` oli aina vain aikaleima, ei koskaan
      palkinto — sen poistaminen ei ota mitään pois, se vain avaa oven oikealle
      paljastukselle uudelleen `Your Lands`ista
- [x] Testit: `revealStore.test.ts` (8 uutta — hiljaisuus samalla buildilla ja pois
      päältä, nimeäminen buildin vaihtuessa, ensimmäinen sovitus laitteella jolla ei ole
      koskaan sovitettu, siemenalueen ulkopuolinen heksa koskematon). Portti: 1584
      testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Miksi ensimmäinen käynnistys tyhjentää kaikki siemenalueen paljastukset

Laite jolla ei ole koskaan sovitettu (`K.seedBuiltAt` puuttuu) kohdellaan **jälkeen jääneenä**,
ei "buildina jota ei koskaan ollut" — täsmälleen Infiniten oma tilanne, jonka paljastukset
ovat kertyneet useamman tämän istunnon aikaisen siemenmuutoksen yli. Tämä on
tarkoituksellista: se korjaa retroaktiivisesti jokaisen jo tapahtuneen muutoksen kerralla,
ei vain tulevat.

## Ei tässä

- Per-heksa-sormenjälki (mikä tarkalleen muuttui) — build-tason aikaleima riittää, koska
  uudelleenpaljastus maksaa pelaajalle vain napautuksen
