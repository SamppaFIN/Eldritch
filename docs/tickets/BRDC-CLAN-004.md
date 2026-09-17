# BRDC-CLAN-004 — Ally ground: clan members see each other's territory revealed

| | |
|---|---|
| **Alue** | `apps/worker/src/index.ts`, `packages/core/src/data/world.ts`/`worldStore.ts`, `apps/game/src/features/territory/` |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-CLAN-001` (`clanId` julkaisussa) |
| **Status** | `done` — 2026-09-17 (v0.6.45) |

## 🔴 RED

Infinite, heti sen jälkeen kun sai oman klaanikoodinsa toimimaan: *"nyt haluan, että kaikki
klaanilaiset näkee paljastettuna toisten maat."*

Kaksi eri ongelmaa piileskeli yhden lauseen takana:

1. **Näkyvyys.** `useWorld.ts` hakee toisten pelaajien alueet vain sen mukaan mitä
   kartan **näkymä** kattaa (`regionsCoveringBBox(bbox)`). Klaanikaverin alue toisella
   puolella kaupunkia ei koskaan latautuisi, vaikka klaani olisi jo olemassa — kamera ei
   vain koskaan käy siellä
2. **Väri.** Vaikka klaanikaverin alue latautuisikin (esim. seisot vieressä), se
   piirtyisi täsmälleen samalla vihamielisellä punaisella kuin kuka tahansa satunnainen
   rivaali — `cellProperties()`in koko päätös on tänään binäärinen: `mine` vai ei mitään
   muuta erottelua

## 🟢 GREEN

- [x] Worker: `GET /clan/<id>/roster` — jokainen elossa oleva (TTL:n sisällä) klaanin
      jäsen, `{id, name, castle}`. Uudelleenkäyttää `allFiles()`+`mergePlayerFiles()`in,
      joita `/submit` jo ajaa joka kirjoituksella — ei uutta skannauskustannusta
- [x] `worldToCells(shard, mineId, now, allies?)` — uusi valinnainen neljäs parametri.
      Kun `allies.has(player.id)`, solu merkitään `ally: true` `imported: true`in lisäksi
- [x] `Cell.ally?: boolean` (`domain.ts`) — additiivinen, ei migraatiota
- [x] `mergeWorld`/`GameRepository.importWorld`/`MockRepository.importWorld` — sama
      `allies?: ReadonlySet<PlayerId>` kulkee läpi kaikki kolme kutsukohtaa
- [x] `useWorld.ts`: **kaksi riippumatonta hakua.** Näkymän oma haku (ennallaan) JA uusi
      klaanihaku joka ajaa kerran per `clanId` — hakee rosterin, laskee jokaisen jäsenen
      `regionOf(castle)`in, ja hakee ne alueet **riippumatta kamerasta**. Molemmat haut
      käyttävät samaa `allies`-joukkoa, joten vierekkäin seisominen klaanikaverin kanssa
      merkitsee hänet oikein ilman erillistä logiikkaa
- [x] `useSharedWorld.ts`: `useClan()` (reaktiivinen) korvaa yhden paikan jossa
      `readClan()` riitti — klaaniin liittyminen kesken kartan avoinna olon alkaa
      hakemaan sen aluetta ilman uudelleenlatausta
- [x] Neljäs väritaso `cellProperties()`ssa: `mine` → `ally` → `rival` → `seen`.
      `ALLY_FILL`/`ALLY_STROKE` = `--eldritch-blue` ja sen kohotettu versio — **ei**
      `--awareness-green` (tarkoittaa jo "oma ja terve" joka paikassa missä se koskettaa
      karttaa: Keep-merkki, oman vahvuuskaaren väri) eikä `--mystic-cyan` (manan oma
      glyfiväri jo)
- [x] `TerritoryLayer.ts`: klaanikaverin reuna on **kiinteä**, ei katkoviivalla merkitty
      "vihamielinen" — uusi `cells-ally-line`-kerros, ja rivaalin katkoviivakerros
      jättää `ally`-solut nyt huomiotta
- [x] Portti: `lint:lines`, `tsc -b`, **1620** vitest (+13: `world.test.ts` +4,
      `territoryFeatures.test.ts` +3, `clanSource.test.ts` +2), `pnpm build`. Workerin
      `/roster`-reitti todennettu käsin `wrangler dev`illä: kaksi oikeaa allekirjoitettua
      julkaisua eri klaanijäsenille, roster palauttaa molemmat nimillä ja Keepeillä;
      tuntematon klaani palauttaa tyhjän listan (ei virhettä, ei 404:ää — tyhjä klaani ja
      typo näyttävät samalta eikä niitä voi eikä tarvitse erottaa)

## Todennus

`world.test.ts`: `worldToCells` merkitsee vain `allies`-joukossa olevat, ei ketään kun
joukko on tyhjä/puuttuu, ei sekoita jonkun toisen liittolaisia omikseen.
`territoryFeatures.test.ts`: klaanikaverin solu saa `ALLY_FILL`in eikä koskaan
`ENEMY_FILL`/`OWN_FILL`in; oma solu ei koskaan näytä `ally: true`ta vaikka data
väittäisi niin; tavallinen rivaali pysyy `ally: false`na. `clanSource.test.ts`:
`fetchClanRoster` GETtaa oikean polun ja palauttaa jäsenlistan, `null` verkko- tai
palvelinvirheessä, ei koskaan heitä.

**Käsin, oikeaa Workeria vasten** (`wrangler dev --local`, uusi portti jokaisella
kierroksella): kaksi allekirjoitettua `WorldSubmission`ia rakennettu suoraan
`@es3/core`in `buildSubmission`illa (ei käsin kirjoitettu checksum), julkaistu
`/submit`iin, luettu takaisin `/clan/<id>/roster`ista — molemmat nimillä ja
Keep-sijainneilla oikein.

## Ei tässä

- **Ei "lennä klaanikaverin luo" -nappia.** Tutkittu: `cellCentre(h3)` +
  `map.flyTo` ovat jo olemassa (`useHearthTour.ts`), mutta `MapHandle` paljastaa tänään
  vain GPS-keskityksen (`focusHere`), ei mielivaltaista h3:aa. Vaatisi uuden
  imperatiivisen metodin `MapCanvas`iin — oma, pienempi tikettinsä jos pyydetään
- **Ei erillistä opasiteettitasoa allylle.** Sama 0.22 kuin rivaalilla — väri riittää
  erottamaan, eikä ylimääräinen visuaalinen kanava ollut pyydetty
- **Ei eventual-consistency-korjausta.** Jos näkymän oma haku ehtii tuoda klaanikaverin
  solut ennen kuin rosterhaku on valmis, ne piirtyvät hetkeksi rivaalina kunnes
  näkymän avain (bbox-perusteinen) vaihtuu ja hakee uudelleen. Harvinainen, itsekorjautuva,
  ei koettu tikettiä oikeuttavaksi ongelmaksi
