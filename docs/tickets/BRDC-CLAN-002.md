# BRDC-CLAN-002 — Klaani-Codex: klaanit keskenään

| | |
|---|---|
| **Alue** | `packages/core/src/data/demographics.ts`, uusi `clanDemographics.ts`, `apps/worker/src/index.ts`, `apps/game/src/features/clan/` |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-CLAN-001` (`clanId` olemassa julkaisussa) |
| **Status** | luonnos — käydään läpi ennen toteutusta |

## 🔴 RED

Infinite: *"laitetaan kanssa klaanit vs keskenään."* `BRDC-CLAN-001` kantaa `clanId`:n,
mutta mikään ei vielä laske klaaneja yhteen. `demographics.ts`in `demographicsOf` on jo
geneerinen minkä tahansa `Measurable[]`:n yli (jokainen alkio: id, nimi, solut, taso,
leyM) — se EI tiedä ryhmittelystä mitään, se vain mittaa sille annetut rivit. Klaani-liiga
tarvitsee yhden uuden asian: joukon jäsenten yhdistämisen **yhdeksi** synteettiseksi
`Measurable`iksi per klaani, ennen kuin sama, jo testattu funktio ajetaan.

## 🟢 GREEN

- [ ] `packages/core/src/data/clanDemographics.ts` (uusi) — puhdas funktio
      `clanMeasurables(sources: readonly WorldSource[]): Measurable[]`. Ryhmittelee
      `clanId`:n mukaan (sivuuttaa `clanId === undefined`), summaa jäsenten `cells`,
      käyttää klaanin **suurimman jäsenen tasoa** `level`-kenttänä (ei summaa — taso ei
      ole additiivinen suure kenenkään yksittäisen mittarin merkityksessä) ja summaa
      `leyM`. Nimi tulee `clan:<id>`in omasta nimestä (Worker liittää tämän, katso alla)
- [ ] Worker: `rebuild()` kutsuu `clanMeasurables()`in tuloksen läpi olemassa olevan
      `demographicsOf()`in — **ei uutta mittarikoneistoa**, sama `Metric`/`MetricId`
      tyyppi kuin pelaaja-Codexilla. Tulos kirjoitetaan uuteen KV-avaimeen
      `clan-codex` (sama kuvio kuin `CODEX`-avaimella, samassa `rebuild()`-ajossa —
      ei ylimääräistä `kv.list`-kierrosta, `allFiles()` on jo muistissa)
- [ ] Worker: `GET /clan-codex` palauttaa taulukon, sama vastausmuoto kuin
      `/demographics`
- [ ] Asiakas: `ClanCodexPanel` — sama arkkipohja kuin `CodexPanel.tsx` (rivi per
      klaani, sijoitus, Best/Average/Worst), mutta lukee `/clan-codex`ia eikä
      `/demographics`ia. Uudelleenkäyttää `useCodex`in kuviota parametrisoituna
      URL-polulla, ei kopioi koko hookia
- [ ] Oman klaanin rivi korostettu samalla `codex__row--titled`-tyylillä kuin
      Codexin oma johtaja-rivi (`BRDC-CODEX-004`), jos oma klaani johtaa jotain mittaria
- [ ] Portti: `lint:lines`, `tsc -b`, vitest — `clanMeasurables`in testit kokonaan
      `packages/core`issa ilman Workeria (puhdas funktio, helpoin osa testata), `pnpm build`

## Todennus

`clanDemographics.test.ts`: kaksi klaania joilla eri määrä jäseniä ja soluja →
`clanMeasurables`in tulos summaa solut oikein, käyttää suurinta tasoa; pelaaja ilman
`clanId`:tä ei näy kummassakaan klaanissa; tyhjä syöte → tyhjä tulos, ei virhettä.
Kokonaisketju (`clanMeasurables` → `demographicsOf`) tuottaa saman `Metric`-muodon kuin
pelaaja-Codex, joten sama `placementIn`/`formatMetric`-koneisto UI:ssa toimii
muuttamatta.

## Ei tässä

- **Klaanihallinta** — `BRDC-CLAN-003`
- **Klaanin oma sivu jäsenlistalla.** Tämä tiketti näyttää vain klaanien keskinäisen
  sijoituksen (liiga), ei jäsenten omaa listaa klaanin sisällä — se on luonnollinen
  lisäys `BRDC-CLAN-003`in hallintanäkymään, koska sielläkin tarvitaan jäsenlista
- **Historiaseuranta / kausittainen liiga.** Klaani-Codex on aina "nyt"-tilanne, sama
  30 vrk TTL kuin pelaaja-Codexilla (`WORLD_PLAYER_TTL_MS`) — ei kausia, ei arkistoa
