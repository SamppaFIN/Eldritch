# BRDC-TRAIL-003 — Kävellyt ley-linet jäävät jäljiksi ja kuluvat tieksi

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-TRAIL-001, BRDC-TRAIL-002, BRDC-CLAIM-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-01, selaintesti: *"sulkeutuva luuppi poistaa lay linen.. ne oli kiva jättää jäljiksi ja jos niitä kulkee pitkään, päivittää värin, että tulee polku→tie→väylä→rautatie"* |

## 🔴 RED

Lenkin sulkeminen **poistaa jäljen** (`closeLoop` leikkaa kulutetut pisteet, `K.trail(runId)`).
Jälki on ajokohtainen: reloadin tai uuden ajon jälkeen edelliset reitit ovat poissa.
Kartalla ei näy mitään siitä, **missä pelaaja tavallisesti kävelee** — ja juuri se on
pelin ydin (kävele suljettu lenkki, omista sisäpuoli).

Eikä toistuvasti kävelty reitti eroa kertaalleen kuljetusta. Oikea polku vahvistuu
kartaksi; peli kohtelee molempia samana ohuena viivana.

## 🟢 GREEN

- [ ] **Kävelty reitti säilyy** ajojen yli, omassa tallennuksessaan (ei `K.trail(runId)`:n
      alla) — lenkin sulkeminen ei poista sitä
- [ ] Reitti pilkotaan **segmentteihin** (esim. H3 res 12/13 -solupari tai kiinteä
      ~15 m ruudukko), ja jokainen segmentti kantaa **käyntimäärän** — deterministinen,
      ei kelloa ilman `now`ia
- [ ] Käyntimäärä → **kulumistaso**: `path → track → road → avenue → rail` (5 tasoa),
      kynnykset vakioina `constants.ts`:ssä, katettu (viimeinen taso on viimeinen)
- [ ] Taso näkyy renderöinnissä: leveys ja väri per taso (`BRDC-TRAIL-002`:n hehku
      säilyy). Uusi karttataso, ei nykyisen ley-linen päälle
- [ ] Tallennuksen koko on **rajattu ja testattu** — kaupungin verran kävelyä ei saa
      kasvattaa IndexedDB:tä ilman kattoa (vanhin/vähiten käyty karsitaan, tai res-alue
      per lohko kuten `BRDC-SCALE-001`:ssä)
- [ ] Puhtaat funktiot testattu: segmentointi deterministinen, taso monotoninen
      käyntimäärän suhteen, karsinta ei pudota eniten käytyjä
- [ ] Jäljet kulkevat `world.json`issa mukana rajattuna (`BRDC-SHARE-001`) — muiden
      pelaajien polut näkyvät himmeämpinä *(voi siirtää jatkoon jos liian iso)*

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
