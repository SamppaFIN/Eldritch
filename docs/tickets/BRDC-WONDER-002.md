# BRDC-WONDER-002 — Härmälän yhdeksän ihmettä, lovecraftilaisin nimin

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `scripts/build-hexseed.mjs` (sijoitus), siemen (`HexSeed.structure`) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `[~]` osittain valmis 2026-09-16 — perusta ja sijoitus tehty, yhdeksän vaikutusta auki |
| **Riippuvuudet** | `BRDC-SEED-003`, `BRDC-TERRAIN-005`, `BRDC-LANDMARK-001` |
| **Lähde** | `worldseed.ts` (`WONDERS`), `seed.harmala.json` (`wonders`), Worldseed §06 *The Nine Wonders* |

## 🔴 RED

**Nyt:** 12 lovecraftilaista ihmettä (`rules/wonder.ts`), sijoitettu provinssin hajautuksella.
Jokaisella on yksinkertainen `{bonus: ResourcePool, aura: {kind, radius}}` -vaikutus.

**Löydös toteutuksessa:** yhdenkään yhdeksästä uudesta ihmeestä vaikutus ei mahdu tähän
muotoon. Jokainen on **oma, uusi pelimekaniikkansa** — tuoton kertoja (ei lisäys), koko
realmin laajuinen vakiobonus, rappiosäännön muutos, riitin manahinnan alennus, taisteluun
vaikuttava vahvuuslisä, ehdollinen vierekkäisyyskertoja, tietoisuuden kokemuskerroin. Yhtään
näistä ei voi kytkeä päälle ilman että se koskettaa jotain jo olemassa olevaa, tarkkaan
viritettyä sääntöä (`decay.ts`, `capture.ts`, `mana.ts`, `dwell.ts`). Tiketin oma GREEN
sanoi jo tämän: *"mitataan sim/issä ennen käyttöönottoa."* Yhdeksän mittaamatonta
sääntömuutosta kerralla olisi juuri se minkä lause on tarkoitettu estämään.

## 🟢 GREEN

- [x] 9 ihmemäärittelyä yllä olevilla nimillä (`rules/harmalaWonder.ts`): nimi, lore,
      vaikutuskuvaus (teksti, ei vielä koodia), maastovaatimus, lippuvaatimus,
      jäljitettävä `worldseedId`
- [x] **Sijoitus, mitattu:** `scripts/build-hexseed.mjs` tarkistaa jokaisen ihmeen
      `harmalaHint`-koordinaatin (dokumentin oma, käännetty) hakuosuman heksalle
      **ja sen kuudelle naapurille** (~50 m), `require`-maasto ja -liput kovana esteenä.
      Alun perin vain tarkka heksa tarkistettiin: 2/9 sijoittui. Naapurirengas mitattiin
      tarpeelliseksi täsmälleen samasta syystä kuin `BRDC-LANDMARK-001`in patsashavainto —
      hint-koordinaatti voi olla muutaman metrin väärässä solussa. Naapurirenkaan kanssa:
      **5/9 sijoittui** — Y'ha-nthlei's Bell, The Dagon Spire, The Dunwich Grove,
      The Carcosa Foundry, He Who Waits at the Shore
- [x] **4/9 jää sijoittamatta, syyt mitattu ja kirjattu** — ei arvattu:
  - *The Drowned Eye* (vaatii `island`-lipun; vain yksi vyöhyke koko datassa kantaa sitä)
  - *The Ancient Löyly* (vaatii `shoreline` + settlement/forest; hint-alue on `coast`)
  - *The Yuggoth Lens* (vaatii `leyCrossing` — **ei koskaan sijoitu tällä datalla**:
    lippu vaatisi dokumentin omien `leyLines[]`-viivojen leikkauspisteen laskennan,
    jota `BRDC-SEED-003`in luokittelu ei tee. Uusi, rajattu jatkotyö)
  - *The Thousand Masks Road* (vaatii `hill` — `BRDC-SEED-000` D9:n tunnettu aukko, ei DEM:iä)
- [ ] Ihmeen lunastus — **ei tehty samalla mekaniikalla kuin dokumentti kuvaa.**
      Worldseed kuvaa ihmeet ostettaviksi (`cost`); peli löytää ihmeensä paljastamalla
      (`wonderStore.ts`in `findWonderAt`, ei maksua). Yhdeksän uutta ei muuta tätä — ne
      seuraavat pelin omaa mekaniikkaa, eivät dokumentin. **Löytö-integraatio itsessään
      auki**, oma pieni jatkotyö
- [ ] **Yhdeksän vaikutusta — ei yhtään tehty.** Jokainen oma tikettinsä tästä eteenpäin,
      halvimmasta kalleimpaan mitattuna. Ei kytketty päälle mihinkään sääntöön
- [ ] The Drowned Eye avautuu vasta tehtävän solmusta 5 — odottaa sijoitusta ja löytöä
- [ ] Ihme maamerkin päällä: halo — `BRDC-RES-002`
- [x] Testit: 8 `harmalaWonder.test.ts`issa (nimet, jäljitettävyys, `harmalaWonderFits`)
- [x] Portti: 1536 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Ei versionostoa

`HexSeed.structure` on nyt datassa (5 heksaa), mutta mikään pelin koodi ei vielä lue sitä —
ei löytöä, ei vaikutusta, ei karttamerkkiä. Ei havaittavaa muutosta pelaajalle.

## Jatkotyöt, numeroimatta

- Löytö-integraatio: 9 ihmettä `wonderStore.ts`in `findWonderAt`-tyyppiseen polkuun
- `leyCrossing`-lippu: leikkauspistelaskenta dokumentin `leyLines[]`-datasta
- Yhdeksän erillistä vaikutussääntöä, kukin oma tikettinsä ja `sim/`-mittauksensa

## Ei tässä

- Ihmeiden kuvat — `BRDC-RES-002`
- Mäkivyöhykkeiden koordinaatit — `BRDC-SEED-003`:n syöte
