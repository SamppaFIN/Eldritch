# BRDC-CLAN-003 — Klaanihallinta: perustajan token, uudelleennimeäminen, poisto

| | |
|---|---|
| **Alue** | `apps/worker/src/index.ts`, `apps/game/src/features/clan/` |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | S–M |
| **Riippuvuudet** | `BRDC-CLAN-001` (`founderToken` syntyy siellä) |
| **Status** | luonnos — käydään läpi ennen toteutusta |

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

- [ ] `founderToken` (luotu `BRDC-CLAN-001`in `POST /clan`issa) on ainoa avain
      hallintatoimiin — **sama periaate kuin `BRDC-IDENTITY-001`in palautuskoodi**:
      satunnainen, jaettu vain kerran, säilytetty vain perustajan omalla laitteella.
      Ei salasanaa, ei tiliä, ei ulkoista auth-palvelua — yksi bearer-secret KV:ssä,
      verrattuna palvelimella
- [ ] Worker: `POST /clan/<id>/rename {founderToken, name}` — vertaa
      `founderToken`ia tallennettuun, päivittää `clan:<id>`in nimen
- [ ] Worker: `POST /clan/<id>/kick {founderToken, playerId}` — lisää `playerId`in
      `clan:<id>.kicked: string[]`-listaan. **Ei poista ketään pelaajan omasta
      tiedostosta** — `playerId` voi yhä väittää kuuluvansa klaaniin omassa
      julkaisussaan, mutta `rebuild()` (`BRDC-CLAN-002`) jättää `kicked`-listalla
      olevat pois klaanin jäsenlaskennasta riippumatta heidän omasta ilmoituksestaan.
      Potkulista voittaa jäsenen oman väitteen — sama periaate kuin monessa muussakin
      pelissä, ei vaadi mitään uutta luottamusprimitiiviä
- [ ] Worker: `POST /submit`in vastaukseen `kicked: boolean` jos pyynnön mukana tullut
      `clanId` on sellainen josta lähettäjä on potkittu. Asiakas tyhjentää paikallisen
      klaanitilansa tämän nähdessään (ei enää näytä "jäsen klaanissa X" -tilaa)
- [ ] Asiakas: klaanin oma "Hallinta"-näkymä, näkyy vain jos laitteella on tallennettu
      `founderToken` juuri tälle klaanille — nimikentän muokkaus, jäsenlista +
      "Poista"-nappi per jäsen (jäsenlista tulee `BRDC-CLAN-002`in klaani-Codexin
      mukana kulkevasta rosterista)
- [ ] Rehellisyys UI:ssa: hallintanäkymä sanoo suoraan että `founderToken` on
      ainoa avain — jos laite katoaa/nollataan (`Delete progress`, `Retire Kingdom`),
      hallintaoikeus katoaa mukana, eikä sitä voi palauttaa erikseen
- [ ] Portti: `lint:lines`, `tsc -b`, vitest, `pnpm build`. Workerin reitit käsin
      todennettu `wrangler dev`illä

## Todennus

Suunnitelmavaihe. Toteutusvaiheessa: väärä `founderToken` → `403`, ei muutosta;
oikea token → nimi/potkulista päivittyy; potkittu pelaaja saa `kicked: true` seuraavassa
`/submit`issaan ja paikallinen tila tyhjenee; potkitun oma yritys julkaista sama
`clanId` uudelleen ei palauta jäsenyyttä (potkulista pysyvä, ei vain kertaluontoinen
lippu).

## Ei tässä

- **Useampi ylläpitäjä.** Vain perustajan token toimii — ei roolijärjestelmää
  (upseeri, jäsen, jne.). Jos kentältä pyydetään, oma tikettinsä
- **Kicked-listan purku.** Kerran potkittu pysyy potkittuna kunnes klaani puretaan
  tai (myöhempi tiketti) perustaja erikseen sallii uudelleenliittymisen
- **Klaanin poistaminen kokonaan.** MVP:ssä klaani ei koskaan häviä KV:stä — vanhentuu
  hiljaa jos kukaan ei enää julkaise sillä `clanId`:llä (sama 30 vrk TTL -logiikka kuin
  yksittäisillä pelaajilla)
