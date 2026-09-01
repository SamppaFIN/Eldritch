# BRDC-TRAIL-003 — Kävellyt ley-linet jäävät jäljiksi ja kuluvat tieksi

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-TRAIL-001, BRDC-TRAIL-002, BRDC-CLAIM-001 |
| **Status** | `done` — 2026-09-01 (renderöinti selaimessa todentamatta; `world.json`-osuus siirretty) |
| **Valmius** | 90 % |
| **Lähde** | Infinite 2026-09-01, selaintesti: *"sulkeutuva luuppi poistaa lay linen.. ne oli kiva jättää jäljiksi ja jos niitä kulkee pitkään, päivittää värin, että tulee polku→tie→väylä→rautatie"* |

## 🔴 RED

Lenkin sulkeminen **poistaa jäljen** (`closeLoop` leikkaa kulutetut pisteet, `K.trail(runId)`).
Jälki on ajokohtainen: reloadin tai uuden ajon jälkeen edelliset reitit ovat poissa.
Kartalla ei näy mitään siitä, **missä pelaaja tavallisesti kävelee** — ja juuri se on
pelin ydin (kävele suljettu lenkki, omista sisäpuoli).

Eikä toistuvasti kävelty reitti eroa kertaalleen kuljetusta. Oikea polku vahvistuu
kartaksi; peli kohtelee molempia samana ohuena viivana.

## 🟢 GREEN

- [x] **Kävelty reitti säilyy** ajojen yli, omassa tallennuksessaan (`K.paths`, ei
      `K.trail(runId)`:n alla) — lenkin sulkeminen ei poista sitä
- [x] Reitti pilkotaan **segmentteihin** (res-12 -soluparit, avain `"<a>:<b>"`,
      `a <= b` → suunnaton), ja jokainen segmentti kantaa `{ visits, lastAt }` —
      `trailEdges` deterministinen, ei kelloa
- [x] Käyntimäärä → **kulumistaso**: `path → track → road → avenue → rail`, kynnykset
      `PATH_TIER_VISITS = [1, 4, 10, 20, 40]` `constants.ts`:ssä, `tierOf` katettu
      (monotoninen, `tierOf(10 000) = 'rail'`)
- [x] Taso näkyy renderöinnissä: `PathLayer.ts`, `line-width`/`line-color` `match`-
      lauseke `tier`istä (violetista kohti kultaa kuluessa). Oma taso, piirretään
      ley-linen **alle**. `[~]` selaimessa todentamatta
- [x] Tallennuksen koko **rajattu ja testattu** — `MAX_PATH_SEGMENTS = 6000`,
      `prunePaths` säilyttää eniten käydyt, tasapeli tuoreimman hyväksi; testi:
      "ei pudota segmenttiä jonka yli on pidetty vähemmän käyty"
- [x] Puhtaat funktiot testattu (`geo/paths.test.ts`, 12): segmentointi deterministinen
      ja suunnaton, taso monotoninen, karsinta ei pudota eniten käytyjä
- [~] Jäljet `world.json`issa → **siirretty omaksi tiketikseen** (`BRDC-TRAIL-004`),
      tiketti sallii sen ("voi siirtää jatkoon jos liian iso")

## Toteutettu 2026-09-01

- `geo/paths.ts` (puhdas): `trailEdges(points)` — peräkkäiset erilliset res-12 solut
  pareiksi, `latLngToCell(res 12)`; `tierOf(visits)` — kynnystaulu kuten `eraOf`;
  `bankEdges(map, edges, now)` — +1 käynti per segmentti, ei mutatointia;
  `prunePaths(map, cap)` — lajittele `visits` desc, tasapeli `lastAt` desc, leikkaa;
  `walkedEdges(map)` — `cellCentre` päihin + `tier`.
- `data/pathStore.ts`: `readPaths`, `recordPaths(store, points, now)` — sauma kuten
  `techStore`/`templeStore`.
- `data/walkWriter.ts`: `recordWalk` kutsuu `recordPaths(store, accepted, lastT)` —
  sama batch, sama transaktio kuin solut ja dwell.
- `closeLoop` **ei muutu**: segmentit ovat jo `K.paths`issa `submitTrail`-vaiheessa,
  joten `K.trail`in leikkaus ei kosketa niitä. RED korjattu ilman että elävän ley-linen
  leikkaus poistuu.
- `GameRepository.getWalkedPaths()` + `MockRepository` (yksirivinen).
- UI: `PathLayer.ts` (peili `TrailLayer`:lle), `MapCanvas` piirtää sen territoryn ja
  ley-linen väliin, `useTrail` lukee `walkedPaths`in resumessa ja joka flushissa,
  `MapView` välittää sen (pysyi 400:ssa yhdellä tyhjän rivin poistolla).
- Testit: `geo/paths.test.ts` +12, `data/paths.repo.test.ts` +3. **585 vihreää.**

## Segmentin tarkkuus — ratkaistu

Res 12 (~9 m). 140 m lenkki tuottaa muutamia kymmeniä segmenttejä; 12 päivän
päivittäinen lenkki nostaa ne `road`-tasolle. `MAX_PATH_SEGMENTS = 6000` kestää
kuukausia kaupunkikävelyä. Karsintasääntö: `visits` desc, sitten `lastAt` desc —
vanha JA vähän käyty putoaa ensin, ei uusi reitti jota vasta aloitetaan kuluttamaan.

## Toteutus

**Erillinen `walkedPaths`-tallennus**, ei `K.trail`. Segmentti on avain (`seg:${a}:${b}`
tai `seg:${gridId}`), arvo on `{ visits: number, lastAt: number }`. `recordWalk`
(`walkWriter.ts`) kirjaa segmentit siinä missä se jo kirjaa solut ja dwellin —
sama batch, sama transaktio.

`closeLoop` **ei enää leikkaa** jälkeä jälkiä varten; ajon `K.trail` voi yhä nollautua
"tämä lenkki on käytetty" -logiikalle, mutta kävellyt segmentit ovat jo omassa
tallennuksessaan eivätkä katoa sen mukana.

Kulumistaso on `tierOf(visits): Tier` — sama kuvio kuin `eraOf`/`levelForXp`: kynnystaulu,
johdettu, katettu. Ei erillistä laskuria segmentissä, vain `visits`.

Renderöinti: `cellsToGeoJson`-tyylinen `pathsToGeoJson(segments)` joka liittää `tier`in
`properties`iin, ja MapLibre-tason `line-width`/`line-color` on `tier`-riippuvainen
lauseke (data-driven styling, ei per-feature). `BRDC-SCALE-001`:n rajattu lukupolku
koskee tätäkin: lue vain viewportin segmentit.

## 🔴 Ratkaistava

- **Segmentin tarkkuus.** H3 res 13 on ~6 m — liian tiheä, tallennus räjähtää.
  Res 11 on ~25 m — polku on 1–2 solua leveä, kulmat pyöristyvät. Res 12 (~9 m) tai
  kiinteä 15 m ruudukko. Mitattava: montako segmenttiä 30 min kävely tuottaa.
- **Karsinnan sääntö.** Vähiten käyty ensin on ilmeinen mutta poistaa juuri ne uudet
  reitit joita pelaaja on aloittamassa. Vaihtoehto: karsi `lastAt` + `visits` yhdistelmä
  (vanha JA vähän käyty).
- **`world.json`-osuus** voi olla oma tikettinsä jos tämä venyy.

## Ei tässä

- Reittiehdotukset ("kävele tästä"). Tämä näyttää missä on kuljettu, ei ohjaa.
- Segmenttien omistajuus tai valtaus. Polku on visuaalinen jälki, ei aluetta.
- Korkeuserot, pinnanmuoto. Viiva kartalla, ei maastomalli.
