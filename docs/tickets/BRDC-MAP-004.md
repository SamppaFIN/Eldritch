# BRDC-MAP-004 — Vapaa kartan katselu + "Here" vie takaisin heksaan

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SHARE-003 (jaetun maailman katselu on tämän pääkäyttötapaus) |
| **Status** | `done` — 2026-09-09 (v0.5.45) |
| **Valmius** | 100 % — portti vihreä, `map.spec.ts` 22/22, sim-askeleet vihreät; kenttätesti Infinitellä |
| **Lähde** | Infinite 2026-09-09: *"ruutu on pinned käyttäjän sijaintiin.. haluan sinne toimintonapin millä karttaa voi liikuttaa ilman että ruutu on kiinni geolokaatioon"* ja *"here napin painaminen fokusoi nykyiseen heksaan.. palauttaa zoomin perustasolle.. samalla myös highlightaa heksan reunat, että käyttäjä näkee missä ollaan"* |

## 🔴 RED

Kamera seuraa jokaista GPS-fixiä kovakoodatusti. `MapCanvas` saa `follow`-propin mutta
`MapView` ei koskaan aseta sitä → oletus `true`, ja jokainen fix ajaa
`map.easeTo({ center: [position] })` (`MapCanvas.tsx:367`). Kartta ei jää minnekään minne
pelaaja panoroi: sekunnin sisällä se nykäistään takaisin pelaajan päälle.

Seuraukset:
- Jaettua maailmaa ei voi katsoa. `useWorld` hakee shardit *näkyvän* alueen mukaan
  (`BRDC-SHARE-001/003`), eli naapurin läänin näkeminen vaatii panoroinnin sinne — mikä
  ei nyt onnistu.
- Omaa lääniä ei voi tarkastella kokonaan kävellessä; reuna katoaa heti näkyvistä.
- Kartan koodissa on jo kommentti *"False once they pan away by hand"* (`MapCanvas.tsx:111`)
  — aikomus on ollut olemassa, toteutus ei.

**Ja kun kamera on irrotettu, takaisin ei ole nopeaa reittiä.** "Here"-nappi
(`Hud.tsx:374`) avaa nyt vain `CellPanel`in seisotusta solusta (`inspect.onCellTap`). Se ei
liikuta karttaa eikä palauta zoomia, eikä kartalla ole mitään merkkiä *mikä heksa* on se
missä seisot — pelaajan piste (cyan) näyttää sijainnin muttei solun rajoja. Territory-
pelissä juuri solun raja ratkaisee: sen sisällä olet, sen valtaat.

## Havainto koodista

- `MapCanvas.tsx` on **399/400 riviä.** `MapView.tsx` on **397/400.** Kumpaankaan ei mahdu
  uutta tilaa tai propristaa ilman jakoa (golden rule 2: "kun raja tulee vastaan, jaa
  tiedosto — älä nosta rajaa"). Tämä tiketti **jakaa `MapCanvas`ia**: pari effektiä ulos
  hookeihin (sama kuvio kuin `useAwakening`, `useHearthTour`, `useTerrainResolver`).
- Seuraava-fix-effekti tekee kaksi asiaa: `markerRef.current.setLngLat(...)` (aina) ja
  `map.easeTo(...)` (kun `follow`). Marker jää `MapCanvas`iin (se omistaa `markerRef`),
  kameraosa siirtyy hookiin.
- MapLibren `dragstart`-eventissä `e.originalEvent` on tosi vain käyttäjän eleelle, ei
  ohjelmalliselle `easeTo`/`flyTo`:lle → sillä erottaa "pelaaja panoroi" itse liikkeestä.
- `ZOOM_WALKING = 16` (`useMap.ts:32`) on "perustaso". `flyTo({ zoom: ZOOM_WALKING })`
  palauttaa sen.
- Kartan tasot ovat omissa moduuleissaan (`AuraLayer.ts`, `TradeLayer.ts`,
  `AwakeningLayer.ts` + `set*Data(map, …)`). `AwakeningLayer` on jo ajastettu välähdys
  (opasiteetti alas ajassa) — seisotun heksan **hetkellinen** korostus rakentuu samaan
  kuvioon: uusi `StandingFlash.ts`.
- `standingOn: H3Index | null` on jo `MapView`ssä (`onInspectHere`, `standing`-propit
  lukevat sitä). `cellToBoundary` (h3-js) → polygon → line-layer.
- "Here" liipaisee kameran: `MapCanvas` saa käskyn ylhäältä. Pienin idiomaattinen tapa on
  `forwardRef` + `useImperativeHandle({ focusHere })` — `MapView` pitää `ref`in ja kutsuu
  sitä `onInspectHere`ssa `onCellTap`in rinnalla.
- Map-hookeille ei ole yksikkötestejä (maplibre-sidonnaiset); todennus on e2e
  (`map.spec.ts`, mockattu geolokaatio) + mahdollinen puhdas apufunktio.

## 🟢 GREEN

### Hook — `apps/game/src/features/map/useCameraFollow.ts` (uusi, 82 r)
- [x] `useCameraFollow({ map, ready, position, touring }) → { following, recenter, focusHere }`.
- [x] Omistaa `following`-tilan, oletus `true`.
- [x] Effekti: kun `following && !touring && position`, `map.easeTo({ center, duration: 900 })`.
- [x] `dragstart` **ja** `zoomstart` -kuuntelijat: `if (e.originalEvent) setFollowing(false)`
      — mikä tahansa käden liike (veto, wheel-zoom, pinch) irrottaa; ohjelmallinen
      `easeTo`/`flyTo` ei kanna `originalEvent`ia, joten follow ja recenter eivät laukaise sitä.
- [x] `recenter()`: `setFollowing(true)` + `map.flyTo({ center, duration: 500, essential: true })`.
- [x] `focusHere()`: `setFollowing(true)` + `flyTo({ center, zoom: ZOOM_WALKING, ... })`
      + `flashStandingHex(map, cellAt(position), prefersReduced())`. `standingH3` johdetaan
      `cellAt(position)`sta hookin sisällä — ei uutta `MapCanvas`-propsia (ja säästää `MapView`-rivin).

### `MapCanvas.tsx` — jaettu, 399 → 384
- [x] Poistettu `follow`-haara seuraava-fix-effektistä; `markerRef.current.setLngLat(...)` jäi omaan 3-riviseen effektiin.
- [x] `useCameraFollow({ map, ready, position, touring })` + `useImperativeHandle(ref, () => ({ focusHere }))`.
- [x] `forwardRef<MapHandle, MapCanvasProps>`. `export interface MapHandle { focusHere: () => void }`.
- [x] Tarkkuusrenkaan resize-effekti ulos → `useAccuracyRing.ts` (uusi, 43 r).
- [x] Renderöi `<><div .es-map/><CameraControl following={following} onRecenter={recenter} /></>`.
      `follow`-propti poistui `MapCanvasProps`ista.
- [x] `MapView.tsx` (397 → 399): `mapRef` + `ref={mapRef}` + `onInspectHere` kutsuu `focusHere()`n
      `onCellTap`in rinnalla (yksirivinen).

### Heksan hetkellinen korostus — `StandingFlash.ts` (uusi, 88 r)
- [x] `flashStandingHex(map, h3 | null, reduced)` — `null` → tyhjentää. `cellBoundary(h3)`
      (`@es3/core`, [lng,lat], rengas suljetaan) → yksi line-layer, luodaan kerran.
      **Ei täyttöä** (§12), `--mystic-cyan`, `line-width` 1.5→4.5 zoomin mukaan.
- [x] Animaatio: `line-opacity` 0.9 → 0 ~**1400 ms** `requestAnimationFrame`-easella (`1 - k²`),
      sitten `frame = 0`. `reduced` → 0.9 heti, `setTimeout(500)` → 0.
- [x] Peräkkäiset kutsut: `cancelAnimationFrame(frame)` ja alusta (moduulitason `let frame`).
- [x] Vain imperatiivinen kutsu `focusHere`n sisältä; ei tilaa `MapCanvas`issa.

### Nappi — `CameraControl.tsx` + `camera-control.css` (uudet, 37 + 44 r)
- [x] Pyöreä nappi oikeaan alakulmaan, HUD:n yläpuolelle **täydellä target-size-välillä**
      (`inset-block-end: calc(var(--hud-height) + var(--space-8))`), ettei se ahdista Collectia/Vigiliä.
- [x] Locate-risti inline-SVG:nä (stroke, ei fill).
- [x] `following` → `--mystic-cyan` + `aria-pressed="true"` + `aria-label="Camera follows you"`;
      muuten `--text-dim` + `aria-pressed="false"` + `aria-label="Recenter the map on you"`.
- [x] Napautus → `onRecenter()` aina. ≥44 px, `:focus-visible`-rengas, `prefers-reduced-motion` → ei transitionia.
- [x] Ei väri yksin: `aria-pressed` + eri `aria-label` + `data-following`.

### Attribuutio pois tieltä — `useMap.ts`
- [x] `attributionControl: false` + `map.addControl(new AttributionControl({ compact: true }), 'bottom-left')`.
      Oikea alakulma oli MapLibren attribuutiotoggle; uusi nappi ahdisti sitä (axe `target-size`).

### Todennus
- [x] `node scripts/check-line-limit.mjs` — kaikki alle 400 (`MapCanvas` 384, `MapView` 399).
- [x] `npx tsc -b` + `npx vitest run` (1015) + `pnpm build` vihreä.
- [x] `apps/game/e2e/map.spec.ts` — 22/22 (isoloituna / `--workers=2`). Uudet 6:
      1. käden veto → "Recenter the map on you" -nappi ilmestyy; uusi fix ei tuo markeria keskelle.
      2. Recenter-nappi → marker takaisin keskelle (< 8 px).
      3. zoomaa ulos 12.5 + panoroi, **Here** → `getZoom() > 15.4`.
      4. **Here** → `standing-flash-line`-tason opasiteetti > 0, sitten < 0.05 (välähtää ja katoaa).
      5. napit ≥ 44 px molemmissa projekteissa.
      Huom: `openMapSettled` ajaa `setGeolocation` kahdesti kartalla — Playwright toimittaa
      fixin vain tuoreelle asetukselle, muuten kameralla ei ole pelaajan sijaintia seurattavaksi.
- [x] `standards.spec.ts` a11y (map) vihreä attribuution siirron jälkeen. `sim.mjs`:
      "the camera control sits on the map, thumb-sized" + "Here flies back … at walking zoom" 13/14
      (jäljellä oleva MISS "Monument … YOURS" on vanha, ei tämän tiketin).
- [x] `nation.spec.ts` / `sim.mjs`: `getByRole('button', { name: 'You' })` → `{ name: 'You', exact: true }`
      — "Camera follows **you**" -label osui substring-hakuun.
- [ ] Kenttä: kävele, panoroi omaa lääniä pitkin ilman että kamera nappaa takaisin;
      paina Here → takaisin solun päälle perus­zoomiin, reunat välähtävät. *(Infinite ajaa.)*

## Ei tässä
- Zoom-napit (+/−), kompassi/"north up" -lukko, minikartta — eri tiketti jos halutaan.
- Kameran automaattinen uudelleenlukitus ajastimella ("palaa seuraamaan 10 s kuluttua").
  Nyt: panorointi irrottaa, Here/recenter lukitsee. Ei taikuutta.
- Kameran tilan säilytys reloadin yli — aina `following: true` käynnistyksessä.
- Seisotun heksan **pysyvä** ääriviiva — Infinite valitsi hetkellisen välähdyksen
  (2026-09-09). Jos pysyvä "tässä olet" -reuna halutaan myöhemmin, se on oma tikettinsä.
- UI-siivous laajemmin (Infinite: *"sen jälkeen aletaan siivoamaan UI:ta"*) — tämän
  jälkeen, oma tikettinsä.
