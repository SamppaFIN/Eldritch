# BRDC-CLAN-003 — Klaanihallinta: perustajan token, uudelleennimeäminen, poisto

| | |
|---|---|
| **Alue** | `apps/worker/src/index.ts`, `apps/game/src/features/clan/` |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | S–M |
| **Riippuvuudet** | `BRDC-CLAN-001` (`founderToken` syntyy siellä) |
| **Status** | `done` — 2026-09-22 (v0.6.47) |

## 🔴 RED

Infiniten päätös 2026-09-17: perustajalla on hallintaoikeudet **heti** ensimmäisessä
versiossa, ei myöhemmin lisättävänä. Ongelma: peli ei todenna ketään mitenkään —
"kuka tahansa id:n tietävä voi väittää olevansa se pelaaja" pätee jo koko muuhun
peliin (`BRDC-SHARE-003`, Wager-tiketit). Pelkkä `founderId === pyynnön id` -tarkistus
olisi sama heikko malli, mutta hallintatoimille (uudelleennimeäminen, jäsenen poisto)
se on epämukavampi: kuka tahansa arvaamalla tai näkemällä klaanin id:n voisi nimetä
klaanin uudelleen tai potkia jäseniä ulos ilman että kukaan tietää heidän omaa
pelaaja-id:tään suojattavaksi.

## 🟢 GREEN

- [x] `founderToken` on ainoa avain hallintatoimiin — sama periaate kuin
      `BRDC-IDENTITY-001`in palautuskoodi tulisi olemaan. Ei salasanaa, ei tiliä
- [x] Worker: `POST /clan/<id>/rename {founderToken, name}` — `verifiedClan()`-apurilla
      (uusi, jaettu `rename`/`kick`in kesken) vertaa tokenia, päivittää nimen
- [x] Worker: `POST /clan/<id>/kick {founderToken, playerId}` — lisää `kicked:
      string[]`-listaan (`ClanRecord`iin uusi valinnainen kenttä, additiivinen, vanhat
      ilman sitä luetaan tyhjänä). Ei poista mitään pelaajan omasta tiedostosta
- [x] **Skoopin tarkennus:** RED viittasi `rebuild()`in (`BRDC-CLAN-002`) suodattavan
      potkitut pois — mutta `BRDC-CLAN-002` ei ole vielä olemassa, ja `BRDC-CLAN-004`
      (tehty tätä ennen) toi jo `GET /clan/<id>/roster`in. Tämä tiketti päivitti SEN
      suodattamaan `kicked`-listan sijaan — sama työ, oikea paikka
- [x] Worker: `POST /submit`in vastaus kantaa `kicked: true`n kun lähettäjän `clanId`
      on sellainen josta hänet on potkittu (kevyt lisäys olemassa olevaan `/submit`iin)
- [x] Asiakas: `publishSubmission`in paluuarvo `PublishResult`-merkkijonosta
      `PublishOutcome`-olioksi (`{status, kicked}`). `useSharedWorld.ts`in `publish()`
      purkaa `.status`in omaksi paluuarvokseen (ei muutosta `KeepRealm`/`HearthPanel`iin)
      ja kutsuu `leaveClan()`in kun `.kicked` on tosi
- [x] `clan.ts`in `writeClan`/`leaveClan` lähettävät nyt itse `CLAN_CHANGED_EVENT`in
      (uusi, jaettu vakio) — ei enää vain `useClan.ts`in oma `set`/`leave`, joten
      avoinna oleva `ClanPanel` päivittyy myös kun `publish()` potkaisee ulos kesken
      kartan avoinna olon
- [x] Asiakas: uusi `ClanAdmin.tsx` (oma tiedosto, ei ahdettu `ClanPanel.tsx`ään) —
      nimikentän muokkaus, jäsenlista rosterista, "Remove"-nappi per jäsen paitsi
      omalle rivilleen (itsensä potkiminen lukitsisi hallinnan pois seuraavalla
      julkaisulla)
- [x] Rehellisyys UI:ssa: `ClanAdmin` sanoo suoraan *"the admin key lives here, not on
      an account. Losing this device loses it too, for good."*
- [x] Portti: `lint:lines`, `tsc -b`, **1625** vitest (+7: `clanSource.test.ts` rename/
      kick, `worldSource.test.ts` `PublishOutcome`), `pnpm build`, `e2e/clan-admin.spec.ts`
      (uusi, 2/2) + `e2e/clan.spec.ts` (3/3, ei regressiota). Workerin `/rename` ja
      `/kick` todennettu käsin `wrangler dev`illä: väärä token → 403 ei muutosta; oikea
      token → nimi/roster muuttuu; klaanin jäsen joka potkitaan **ennen ensimmäistä
      julkaisuaan** näkyy `kicked: true`na jo omassa ensimmäisessä `/submit`-vastauksessaan

## Todennus

`clanSource.test.ts`: `renameClan`/`kickMember` POSTaavat oikean rungon oikeaan
polkuun, palauttavat `'forbidden'`in 403:sta erillään `'failed'`istä, eivät koskaan
heitä. `worldSource.test.ts`: `publishSubmission` palauttaa `{status, kicked}`in,
`kicked: true` vain kun Worker sanoo niin. `e2e/clan-admin.spec.ts`: perustaja nimeää
klaanin uudelleen ja näkee sen otsikossa; perustaja poistaa jäsenen ja roster tyhjenee
oikein tyhjän-tilan tekstiin asti (ei jää haamurivi näkyviin).

**Käsin, oikeaa Workeria vasten:** klaani luotu, väärä token 403, oikea token muuttaa
nimen ja näkyy `GET /clan/<id>`issa; jäsen julkaisee, potkaistaan, roster tyhjenee
välittömästi; jäsen joka potkitaan ENNEN ensimmäistä julkaisuaan näkee `kicked:true`n
jo siinä ensimmäisessä vastauksessaan — potkulista ei vaadi että potkittu on koskaan
edes julkaissut mitään.

## Ei tässä

- **Useampi ylläpitäjä.** Vain perustajan token toimii — ei roolijärjestelmää
  (upseeri, jäsen, jne.). Jos kentältä pyydetään, oma tikettinsä
- **Kicked-listan purku.** Kerran potkittu pysyy potkittuna kunnes klaani puretaan
  tai (myöhempi tiketti) perustaja erikseen sallii uudelleenliittymisen
- **Klaanin poistaminen kokonaan.** MVP:ssä klaani ei koskaan häviä KV:stä — vanhentuu
  hiljaa jos kukaan ei enää julkaise sillä `clanId`:llä (sama 30 vrk TTL -logiikka kuin
  yksittäisillä pelaajilla)
