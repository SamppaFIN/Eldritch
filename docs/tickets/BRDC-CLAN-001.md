# BRDC-CLAN-001 — Perusta: klaanin luonti, liittyminen, `clanId` julkaisussa

| | |
|---|---|
| **Alue** | `packages/core/src/data/world.ts`, `apps/worker/src/index.ts`, `apps/game/src/features/clan/` (uusi) |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-SHARE-003` (Worker) |
| **Status** | `done` — 2026-09-17 (v0.6.44). `founderToken` syntyy tässä, `BRDC-CLAN-003` käyttää sitä myöhemmin — riippuvuus on siihen suuntaan, korjattu tänne alkuperäisestä luonnoksesta |

## 🔴 RED

Infinite 2026-09-17: *"voidaanko me luoda käyttäjien itsensä sopimat klaanit ja kaveri
piirit joko haasteen tai yhteistyön merkeissä.. laitetaan kanssa klaanit vs keskenään..
mennään siis multiplayer puolelle... ilman tietokantaa."*

Peli tuntee jo yhden pelaajan (satunnainen UUID, ei mitään omistuksen todistusta,
`profileStore.ts`) ja yhden jaetun Workerin joka kokoaa jokaisen pelaajan julkaiseman
`WorldSource`in Codexiksi (`demographics.ts`). Mitään ryhmäkäsitettä ei ole — ei
`BRDC-CLAN-*`, `BRDC-GROUP-*` tai `BRDC-FRIEND-*` tikettiä ole koskaan kirjoitettu.
`BRDC-DIPLO-001`in kaupunkivaltio on ainoa "ryhmä"-käsite pelissä, ja se on NPC, ei
pelaajien oma.

**Tärkeä arkkitehtuurihuomio: klaanit eivät tarvitse kirjautumista.** Jokainen laite
toimii kuten nytkin omalla paikallisella id:llään — klaani on vain yksi kenttä lisää
siihen mitä jo julkaistaan. Kirjautuminen (identiteetin säilyminen laitteen vaihdon yli)
on oma, erillinen ongelmansa: `BRDC-IDENTITY-001`.

## 🟢 GREEN

- [x] `WorldSource`/`WorldPlayer`/`WorldSubmission`/`WorldIdentity`iin
      (`packages/core/src/data/world.ts`) uusi valinnainen `clanId?: string`. Kulkee
      samaa reittiä kuin `nation`/`banner` jo kulkevat — `buildSubmission`,
      `parseSubmission` ja `worldSourceFrom` kaikki päivitetty, ei uutta validointia
      enempää kuin niillä on tänään
- [x] Worker: `POST /clan` — luo klaanin. Pyyntö `{name, founderId}`, vastaa
      `{id, founderToken}`. `id` on kuusi merkkiä `crypto.getRandomValues`illa,
      aakkosto ilman sekoitettavia merkkejä (0/O/1/I/L). `founderToken` on
      `crypto.randomUUID()`, palautetaan **kerran**, tallennetaan `clan:<id>`
      KV-tietueeseen — käytetään `BRDC-CLAN-003`in hallintatoiminnoissa
- [x] Worker: `GET /clan/<id>` — **lisätty alkuperäisen RED:in ulkopuolelta.**
      Liittymisnäkymä tarvitsi tavan varmistaa että koodi on oikeasti olemassa ennen
      kuin laite sitoutuu siihen paikallisesti — muuten typo koodissa "liittäisi"
      klaaniin jota ei ole. Palauttaa `{id, name}`, ei koskaan `founderToken`ia
- [x] Worker: `POST /submit` hyväksyy `clanId`:n mukana pelaajan `WorldSource`issa.
      **Ei ylimääräistä todennusta** — täsmälleen sama luottamusmalli kuin koko
      jaetulla maailmalla jo on (`index.ts:11`in oma kuvaus: *"cannot tell a liar from
      an honest player"*)
- [x] Asiakas: `apps/game/src/features/clan/clan.ts` — paikallinen tila samalla
      kuviolla kuin `nation.ts` (yksi localStorage-tietue: `{clanId, clanName,
      founderToken}`), plus `useClan.ts` (`useSyncExternalStore`-hook, sama kuvio kuin
      `useNation.ts` — CLAN-002:n liigapaneeli tarvitsee saman reaktiivisen luvun)
- [x] UI: ☰-valikon "Go to" -ruudukkoon uusi kohde "Clan". `ClanPanel.tsx`: ei
      klaania → Create/Join-vaihtoehdot; klaanissa → nimi, koodi (jaettavaksi),
      "Leave clan"
- [x] Ei kattoa jäsenmäärälle (Infiniten päätös 2026-09-17)
- [x] Portti: `lint:lines`, `tsc -b`, **1612** vitest (+16: `world.test.ts` +4,
      `clanSource.test.ts` +8, muut olemassa olevat koskemattomina), `pnpm build`,
      `e2e/clan.spec.ts` (uusi, 3/3, mobile-360)

**Skoopin korjaus kesken toteutuksen:** RED:in oma GREEN-listaus lupasi "klaanissa:
klaanin nimi + **jäsenmäärä** + Jätä klaani" — jäsenmäärä vaatii kuitenkin
`BRDC-CLAN-002`in Worker-aggregoinnin (roster ei ole olemassa ennen sitä). Poistettu
tämän tiketin näkymästä, lisätty `BRDC-CLAN-002`in omaan GREENiin sen sijaan. Tämä on
tarkka esimerkki siitä miksi tiketti kirjoitetaan uudelleen todeksi eikä jätetä
alkuperäistä luonnosta seisomaan: en huomannut riippuvuutta ennen kuin koodasin sen.

## Todennus

`world.test.ts`: `clanId` kulkee `buildSubmission`→`parseSubmission`-kierroksen läpi
rikkomatta checksumia; puuttuu läpimenosta kun sitä ei asetettu; `worldSourceFrom`
kantaa sen identiteetistä. `clanSource.test.ts`: `createClan`/`findClan` POSTaavat/GETaavat
oikean URL:n ja rungon, palauttavat nimetyn `ok:false`-syyn verkko- tai
palvelinvirheessä, eivät koskaan heitä. `e2e/clan.spec.ts` (mobile-360, oikea selain):
klaanin luonti näyttää koodin ja säilyy uudelleenavauksen yli (localStorage, ei
palvelinistuntoa); liittyminen tarkistaa koodin ensin eikä hyväksy tuntematonta;
`clanId` kulkee mukana oikeassa `/submit`-pyynnössä.

**Sivulöydös reitillä:** `e2e/share.spec.ts`in oma "Raise your banner" -testi oli jo
rikki ennen tätä tikettiä — se odotti kytkimen vanhaa, jo poistunutta tekstiä ("Share
the world — see nearby realms...") kun oikea teksti on "Share your realm". Löytyi kun
kopioin saman assertion oman testini pohjaksi ja se ei toiminutkaan. Korjattu molemmat
tiedostot samalla kertaa — yhden rivin virhe, ei syytä pitää sitä auki omana tikettinään.

## Ei tässä

- **Klaani-Codex (klaanit keskenään), jäsenmäärä mukaan lukien.** `BRDC-CLAN-002`
- **Perustajan hallintaoikeudet** (uudelleennimeäminen, jäsenen poisto) — `BRDC-CLAN-003`
- **Identiteetin säilyminen laitteen vaihdon yli** — `BRDC-IDENTITY-001`, täysin
  erillinen ongelma
- **Klaanin sisäinen viestintä.** Pelaajat jo nyt jakavat Wager-haasteensa "millä
  tahansa sovelluksella" (`WagerDialog.tsx`); sama pätisi klaanin koordinointiin —
  ei tarvitse rakentaa pelin sisään
