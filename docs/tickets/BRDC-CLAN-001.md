# BRDC-CLAN-001 — Perusta: klaanin luonti, liittyminen, `clanId` julkaisussa

| | |
|---|---|
| **Alue** | `packages/core/src/data/world.ts`, `apps/worker/src/index.ts`, `apps/game/src/features/clan/` (uusi) |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-SHARE-003` (Worker), `BRDC-CLAN-003` (perustajan token syntyy tässä, käytetään siellä) |
| **Status** | luonnos — käydään läpi ennen toteutusta |

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

- [ ] `WorldSource`iin (`packages/core/src/data/world.ts`) uusi valinnainen `clanId?: string`.
      Kulkee samaa reittiä kuin `nation`/`banner` jo kulkevat — ei uutta validointia
      enempää kuin niillä on tänään
- [ ] Worker: `POST /clan` — luo klaanin. Pyyntö `{name, founderId}`, vastaa
      `{id, founderToken}`. `id` on lyhyt, ihmisen kirjoitettavissa oleva koodi (esim.
      6 merkkiä, ei sekoitettavia kirjaimia/numeroita). `founderToken` on satunnainen
      merkkijono, palautetaan **kerran**, tallennetaan `clan:<id>` KV-tietueeseen
      (`{id, name, founderId, founderToken, createdAt}`) — käytetään `BRDC-CLAN-003`in
      hallintatoiminnoissa
- [ ] Worker: `POST /submit` hyväksyy `clanId`:n mukana pelaajan `WorldSource`issa.
      **Ei ylimääräistä todennusta** — täsmälleen sama luottamusmalli kuin koko
      jaetulla maailmalla jo on (`index.ts:11`in oma kuvaus: *"cannot tell a liar from
      an honest player"*). Tämä ei ole regressio; se on sama rehellinen raja joka on
      dokumentoitu joka ikisessä olemassa olevassa multiplayer-tiketissä
- [ ] Asiakas: `apps/game/src/features/clan/clan.ts` — paikallinen tila samalla
      kuviolla kuin `nation.ts` (yksi localStorage-tietue: `{clanId, clanName,
      founderToken?}`). `founderToken` talletetaan vain perustajan omalle laitteelle
- [ ] UI: ☰-valikkoon uusi kohde "Klaani" — jos ei klaania: nimikenttä (luo) TAI
      koodikenttä (liity); jos klaanissa: klaanin nimi + jäsenmäärä + "Jätä klaani"
- [ ] Ei kattoa jäsenmäärälle (Infiniten päätös 2026-09-17)
- [ ] Portti: `lint:lines`, `tsc -b`, vitest (uudet `clan.ts`-testit), `pnpm build`.
      Workerin oma `/clan`-reitti todennetaan `wrangler dev`illä käsin ennen deployta —
      ei automaattitestiä palvelimen omalle KV-kirjoitukselle tässä kierroksessa

## Todennus

Suunnitelmavaihe — ei vielä ajettu. Toteutusvaiheessa: `clan.ts`in
lue/kirjoita-pyöristys (localStorage-envelope, sama kuvio kuin `avatarIds.ts`);
`WorldSource`in `clanId`-kentän läpimeno `buildSubmission`/`parseSubmission`in läpi
ilman että checksum rikkoutuu; käsin ajettu `wrangler dev` -kutsu `/clan`iin ja
`/submit`iin `clanId`:n kanssa.

## Ei tässä

- **Klaani-Codex (klaanit keskenään).** Oma tikettinsä, `BRDC-CLAN-002` — tämä tiketti
  vain kantaa `clanId`:n, ei vielä laske mitään sillä
- **Perustajan hallintaoikeudet** (uudelleennimeäminen, jäsenen poisto) — `BRDC-CLAN-003`
- **Identiteetin säilyminen laitteen vaihdon yli** — `BRDC-IDENTITY-001`, täysin
  erillinen ongelma
- **Klaanin sisäinen viestintä.** Pelaajat jo nyt jakavat Wager-haasteensa "millä
  tahansa sovelluksella" (`WagerDialog.tsx`); sama pätisi klaanin koordinointiin —
  ei tarvitse rakentaa pelin sisään
