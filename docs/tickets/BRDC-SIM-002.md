# BRDC-SIM-002 — Reitin toisto (playback) deviin ja e2e:hen

| | |
|---|---|
| **Alue** | `packages/core/src/sim/playback.ts`, `apps/game/src/features/playback/`, `usePositionSource`, `useTrail` |
| **Vaihe** | 3 — Season 3 (haara `season-3`) |
| **Effort** | M |
| **Riippuvuudet** | BRDC-SIM-001 (fixturet), BRDC-GPX-001 (`parseGpx`) |
| **Lähde** | Infinite 2026-10-09: *"haluan että teet deviin simulaation millä voi playbackinä testata kuljettua reittiä. playwright tms testit"* — lähteiksi GPX, oma kävely ja valmiit reitit; Playwright ajaa sovelluksen omaa toistoa |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Kuljetun reitin voi nyt testata vain kävelemällä sen uudelleen, WASD-näppäimillä (G) tai
GPX-tuonnilla, joka ajaa koko reitin kerralla eikä näytä mitään matkan aikana. Playwright
siirtää sijaintia käsin piste kerrallaan, ja 5 s minimiväli tekee 10 minuutin kävelystä
10 minuutin testin.

## 🟢 GREEN

- [x] Ydin (puhdas, testattu): reitin luku GPX:stä tai JSONista, ajoitus uudelleen niin että
      viimeinen piste on "nyt" ja pisteiden välit säilyvät (nopeus- ja välisuodatin tuomitsevat
      toiston kuten oikean kävelyn), valmiin reitin siirto alkamaan siitä missä seisot — `sim/playback.ts`, 8 testiä; `startAt` skaalaa itä–länsi-siirron leveyspiirin mukaan (testi kiinni otti 4 %:n venymän Helsinkiin siirrettäessä)
- [x] Toisto syöttää pisteet samaan putkeen kuin live-GPS (`useTrail` → `submitTrail`): samat
      suodattimet, sama valtaus. ×1 / ×5 / ×20 / ×60, tauko, pysäytys — toiston ajan polku kirjoitetaan sekunnin välein (muuten 10 s), joten viiva ja valtaukset etenevät katsottaessa; löytökortit odottavat "N finds waiting" -napin takana, kartta jää näkyviin
- [x] Toiston alku ja loppu aloittavat uuden runin, ettei hyppy live-sijainnin ja reitin
      välillä hylkää pisteitä
- [x] Lähteet: GPX-tiedosto, valmiit reitit (square, figure-eight, open-line,
      back-and-forth, gps-noise), oma kävely — "Tallenna kävely" lataa käynnissä olevan runin
      JSONina, joka toistuu sellaisenaan
- [x] Dev-paneeli (näppäin P): lähde, nopeus, toista/tauko/pysäytä, edistyminen
- [x] Vain dev- ja e2e-buildissa; pelaajan buildissa ei paneelia eikä `window`-koukkua — tuotantobuildissa ei `PlaybackPanel`- eikä fixture-chunkeja (tarkistettu `pnpm build` -tulosteesta)
- [x] Playwright: `window.__es3Playback` + apufunktio (`e2e/playback.ts`: `playRoute`, `stopPlayback`); spec ajaa valmiin reitin, GPX:n ja
      paneelin, ja tarkistaa että maata vallataan ja polku piirtyy
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px — 2162 testiä; playback.spec 3/3 ja step-claim.spec 7/7 vihreinä; kuvat `playback-mid.png`, `playback.png`

## Ei tässä

Tauon jälkeinen kelaus (seek). Toisto puhelimella tuotantobuildissa. Aiempien runien lista
(peli ei säilytä niitä — oma kävely tallennetaan ensin tiedostoksi).

## Käyttö

- **Dev:** `pnpm dev`, kartalla **P** → paneeli. Valitse Built-in tai GPX/JSON-tiedosto, nopeus, Play. Stop palauttaa sijainnin puhelimelle (tai G/WASD-kävelylle). "Save this walk" tallentaa käynnissä olevan runin JSONiksi, joka toistuu samasta paneelista.
- **Playwright:** `await playRoute(page, { fixture: 'open-line' })` tai `{ text: gpx, name: 'walk.gpx' }`, nopeus kolmantena (oletus ×60); `stopPlayback(page)`.

## Havaittu, ei korjattu

"N finds waiting" -nappi jää oppituntikortin alle kartan yläreunassa (`playback-mid.png`). Sama päällekkäisyys on pelaajalla "Open its card" -napin jälkeen — oma pieni tikettinsä.
