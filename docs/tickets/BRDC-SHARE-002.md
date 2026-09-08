# BRDC-SHARE-002 — Jaettu maailma, kytkettynä päälle

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SHARE-001 (moottori), BRDC-CASTLE-001 |
| **Status** | `done` — 2026-09-08 (v0.5.43); savutesti `[~]` |
| **Valmius** | 90 % — koodi + testit + `share.spec.ts` + sim vihreät; cron-putki käsin ajamatta |
| **Lähde** | Infinite 2026-09-07: *"luodaan nappi keeppiin, send your wager.. tuo triggeröi jobin, mikä pitää koko maailmankartan omistuksen tiedossa"* |

## 🔴 RED

`BRDC-SHARE-001` rakensi moottorin — `world.ts`, `build-world.mjs`, `world.yml` — mutta se
ei ole kytketty käyttöön: `worldSubmissionUrl` on valmis funktio jota mikään ei kutsu,
`useWorld` hakee `world.json`:n aina eikä minkään togglen takaa, ja merge-job lukee vain
avoimet issuet joten pelaaja putoaa kartalta 30 min välein ellei julkaise uudestaan.
Putkea ei ole ajettu kertaakaan.

## 🟢 GREEN

### Core — persistoi viimeisin per pelaaja
- [x] `WORLD_PLAYER_TTL_MS = 30 vrk` (`constants.ts`)
- [x] `world.ts`: `PlayerFile` (= `{ source, submittedAt }` — kevyt, ei allekirjoitettu:
      shardit on jo allekirjoitettu, `players/*.json` on luotettua repo-sisältöä),
      `buildPlayerFile`, `parsePlayerFile`, `encodePlayerFile`, `mergePlayerFiles`
- [x] `world.ts`: `worldSourceFrom(me, owned, castle, identity?)` — käyttää `toWireCell`
- [x] `worldStore.ts`: `exportWorldSource(deps, identity, now)` → `worldSourceFrom(await muster(...))`
- [x] `GameRepository.exportWorldSource` + `MockRepository`-delegoija
- [x] `world.test.ts` +6: `parsePlayerFile` round-trip/hylkäys, `mergePlayerFiles` TTL,
      `→ buildShards`, `worldSourceFrom`

### Script — `build-world.mjs` persist-malliin
- [x] Lukee `players/*.json` → `Map<id, PlayerFile>`; stdin `[{ number, body, createdAt }]`
- [x] Kirjoittaa `players/<id>.json`; `mergePlayerFiles(..., WORLD_PLAYER_TTL_MS)` →
      `buildShards` → `world/<res6>.json`; poistaa tyhjentyneen shardin
- [x] Todennettu käsin: 1 submission → shard + player-file; tyhjä ajo → player säilyy

### Action — `world.yml`
- [x] Kerää `title | startswith("world:")` (ei labelia); vie `createdAt`; `git add …/world`
- [x] `permissions: actions: write` + `gh workflow run deploy.yml --ref main` (vain jos muuttui)

### Klientti — kytkin ja nappi
- [x] `Settings.shareWorld: boolean`, oletus `false`; `SettingsMenu`-rivi
- [x] `useSharedWorld.ts` — kääri `useWorld` (`bbox: enabled ? bbox : null`) + `publish()`
- [x] `MapView`: `useSharedWorld`; `onPublish` → `HearthPanel` → `KeepRealm` "Raise your banner"
- [x] e2e `share.spec.ts` (4/4): kytkin pois → ei nappia, ei fetchejä; päällä → nappi avaa
      `github.com/…/issues/new` -URLin `world:`-otsikolla ja `parseSubmission`ista läpi menevällä bodylla
- [x] `sim.mjs` askel `raiseYourBanner` (12/12 vakaa)

### Savutesti — sulkee `BRDC-SHARE-001`:n `[~]` — **jää Infinitelle**
- [ ] `gh label create world-submission` (valinnainen — Action ei enää nojaa labeliin)
- [ ] `gh workflow run world.yml` + käsin yksi `world: Test` -issue kelvollisella bodylla
- [ ] `world/players/<id>.json` + `world/<region>.json` committoituvat, `deploy.yml` ajaa,
      shard näkyy Pagesissa → kirjaa `SHARE-001`:een, flippaa `[~]` → `[x]`, status `done`

## Toteutus

Päätökset (AskUserQuestion 2026-09-07): napin nimi **"Raise your banner"** (ei "The Wager");
toggle **pois oletuksena**; kartalla pysyminen **persistoi viimeisin per pelaaja**.

`world.json` on luettava tila, ei totuus. Jokainen voi valehdella vahvuutensa — tietoinen
kompromissi jo `world.ts`:n kommentissa, palvelin tulee Vaihe 5:ssä.

**Kirjoitustapa (Infinite 2026-09-08):** GitHub-issue tuntui kömpelöltä (peli → lomake).
Päätös: se jää *toimivaksi fallbackiksi* tähän tikettiin, ja varsinainen kirjoitustapa
vaihtuu **Cloudflare Worker + KV**:hen omana tikettinään (`BRDC-SHARE-003`). Suurin osa
tästä tiketistä säilyy — vain `worldSubmissionUrl` (→ `fetch(POST)`) ja
`build-world.mjs`/`world.yml` (→ Worker) korvautuvat.

### Sivukorjaukset (löytyivät simiä ajaessa, v0.5.43)

Sim toi Sampoamaja-Wagerin (rakennuksia rivaalisoluilla) ja paljasti kolme bugia:

- **Alkustash kahdesti.** `MapView`:n Hearth-efekti fire-and-forget-kutsuu `setHome`:n, ja
  `clock` vaihtuu joka renderillä + Strict Mode → kaksi rinnakkaista kutsua → stash 120.
  (`homing`-promise-vahti `setHome`:ssa kokeiltiin, mutta se rikkoi perustuksen — ring jäi
  valtaamatta.) Korjaus: alkustash **asetetaan**, ei lisätä (`writePouch({...EMPTY, ...STASH})`)
  → kaksi kutsua kirjoittaa saman, pussi = yksi rakennus. (`BRDC-ECON-007`)
- **Rivaalin rakennukset veivät oman kapasiteetin.** `useSelection.myBuildings` laski
  `buildingsOf(cells)` — myös tuoduilta soluilta. Wager builderilta → 6 rakennusta → et
  voinut rakentaa mitään. Korjaus: `.filter((c) => !c.imported)`. (`BRDC-BUILD-007`)
- **Rakennus ei veloittanut pussia.** `settlePouch`:n kello-nudge kirjoitti vanhentuneen
  poolin `writePouch`in päälle — ECON-006:n toinen puolisko, satunnainen ~33 %. Korjaus:
  **kaikki pussikirjoitukset yhden lukon läpi** (`commit()` `pouch.ts`:ssä), joka lukee
  tuoreen tilan lukon sisällä. `settlePouch`/`writePouch`/`awardClaims`/`collectPouch`
  reitittyvät sen kautta. Regressiotesti `pouch.test.ts`:ssä. (`BRDC-ECON-006`)

## Ei tässä

- Realtime, chat, palvelinvahvistettu taistelu — Vaihe 5
- Kansallinen kokonaisnäkymä — `BRDC-ATLAS-001`
- `repository_dispatch` / Contents-API — vaativat PAT:n klienttiin, rikkoo kultaista sääntöä 9
