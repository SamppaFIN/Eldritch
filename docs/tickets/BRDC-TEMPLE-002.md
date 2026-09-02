# BRDC-TEMPLE-002 — Temppeli on tutkimusrakennus: koulukunnat ja per-temppeli riitit

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L–XL (mekaniikan uudelleensijoitus: tutkimus Keepistä temppeliin) |
| **Riippuvuudet** | BRDC-TEMPLE-001 (valmis), BRDC-TECH-001, BRDC-SPELL-001, BRDC-KEEP-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 — *"temppeli = tutkimusrakennus"* |

## 🔴 RED

Infinite: *"temppelimuutosten tarkoitus on, että käyttäjällä ei ole nyt mitään paikkaa
mistä oppia rituaaleja tai teknologioita. Nytkin Keep-valikon alla on 'rakenna temppeliä',
mutta mä haluan oppia riitit ja teknologiankin jostain."*
Ja: *"vihit temppelin, valitset koulukunnan (tuli/vesi/maa/ilma/luonto/henki), ja siitä
temppelistä opit sen koulukunnan riitit/taiat."*

Nyt tutkimus (`TECHS`, `researchTech`) tapahtuu **Keepissä** — abstraktilla "wisdom"-
resurssilla, ilman paikkaa. `BRDC-TEMPLE-001` teki temppelistä *saatavan* (vihittävän
resursseilla), mutta se on yhä pelkkä manalähde. Temppelillä ei ole roolia, ei
koulukuntaa, eikä mitään opita siitä. Loitsujen `SpellSchool` on tällä hetkellä
toiminnallinen (`research | protection | block | dominion`), ei elementaalinen.

`BRDC-TEMPLE-001`:n `consecrateAt` **ei lukitse temppelin roolia** — se kirjoittaa vain
`K.dwell`-arvon. Koulukunta voidaan siis lisätä päälle ilman uudelleenrakennusta.

## 🟢 GREEN

- [ ] **Koulukunta valitaan vihkimisen yhteydessä.** `consecrateAt` (tai heti perään)
      ottaa `school: TempleSchool` ja kirjoittaa `K.templeSchool: Record<h3, TempleSchool>`.
      `TempleSchool = 'fire' | 'water' | 'earth' | 'air' | 'nature' | 'spirit'`
      (`packages/core/rules`). Vihitty ilman valintaa (TEMPLE-001-polku) = `null`, ja
      paneeli pyytää valinnan ennkuin temppelistä voi opiskella — vanha tallennus ei
      hajoa.
- [ ] **Riitit ja loitsut saavat koulukunnan.** Jokainen `TECHS`-rivi ja `SPELLS`-rivi
      merkitään yhteen `TempleSchool`iin (osa voi olla koulukunnaton = Keepistä yhä).
      Elementaali-`SpellSchool` korvaa tai täydentää nykyisen toiminnallisen kentän —
      päätä kumpi `SPELL`-taulua muokatessa, älä lisää kolmatta akselia.
- [ ] **Tutkimus siirtyy temppeliin.** `researchTech` gettaa: pelaajalla on vihitty
      temppeli jonka koulukunta kattaa tämän riitin, ja temppeli on hereillä (sama
      `DORMANT_AFTER_MS`-kello kuin manalla). Keepin Rites-välilehti joko poistuu tai
      näyttää vain koulukunnattomat riitit. `CellPanel` saa temppelille tutkimusosion.
- [ ] **Per-temppeli, ei per-pelaaja.** Kaksi tulitemppeliä eivät tuplaa mitään, mutta
      jokainen koulukunta vaatii oman temppelinsä. Kuudennen koulukunnan avaaminen =
      kuusi vihittyä temppeliä = kuusi paikkaa jonne on käyty.
- [ ] **Wisdom-talous.** Päätä: opitaanko riitit yhä `wisdom`illa (temppeli vain portti)
      vai temppelikohtaisella resurssilla (esim. koulukunnan mana). `BRDC-KEEP-002`:n
      Altar-kanavointi (`channelMana` → wisdom) pitää sopia tähän.
- [ ] **UI:** koulukunnan valinta on kertavalinta, painava — `RitualButton`-rivi kuutta
      koulukuntaa, ei alasvetovalikko, sacred-geometry per koulukunta (`claude.md` §12).
      Vihityn temppelin `CellPanel` näyttää koulukunnan, opittavat riitit, ja mitä on jo
      opittu. `docs/backlog/`:n loitsu- ja koulukuntalore laskeutuu tähän — vasta nyt on
      mekaniikka johon se osuu (`golden rule #6`).
- [ ] **Persistointi + testit.** `K.templeSchool`, `resetAll` siivoaa. `SCHEMA_VERSION`
      vain jos vanhaa ei voi lukea (todennäköisesti voi — uusi avain, puuttuva = `null`).
      Testit: koulukunta tallessa · riitin oppiminen vaatii oikean koulukunnan hereillä
      olevan temppelin · kaksi samaa koulukuntaa ei tuplaa · koulukunnaton riitti yhä
      Keepistä · golden-polku consecrate→valitse→opi.

## Ei tässä

- Uudet riitit tai loitsut itsessään — tämä sijoittaa olemassa olevat koulukuntiin.
      Sisältö tulee `docs/backlog/`:sta erillisinä lisäyksinä kun kehys on paikallaan.
- Manan `manaRate`-tasapaino ja wisdom-kurssit.
- Temppelin visuaalinen tyyli kartalla (Place-markkeri on jo).
- Koulukuntien väliset suhteet / vastakkainasettelut — oma tikettinsä jos tulee.
