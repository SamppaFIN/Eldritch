# BRDC-MOBILE-004 — Kartta ei avaudu puhelimella

| | |
|---|---|
| **Alue** | `apps/game/vite.config.ts` (VitePWA / workbox) |
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | XS (korjaus) · L (se mitä se paljastaa) |
| **Status** | `done` — korjaus ja kenttävahvistus 2026-09-15 (v0.5.95) |
| **Lähde** | Infinite 2026-09-15: *"nyt kännykässä s23u kaatuu… desktopilla toimii, mutta kännyllä ei kartta avaudu… lataudu siis."* |

## 🔴 RED

Työpöydällä peli toimii. Puhelimella karttaruutu latautuu eikä karttaa tule.

**Syy, mitattuna käännetystä `sw.js`:stä, ei arvattuna.** Service worker esilatasi
**kahdeksan** tiedostoa:

```
registerSW.js · index.html · assets/index-*.css · assets/index-*.js
assets/MapView-*.css · assets/MapView-*.js · icon.svg · manifest.webmanifest
```

Listalta puuttuvat ne kaksi, joita MapLibre tarvitsee piirtääkseen yhtään ruutua:
**`assets/maplibre-gl-worker.mjs`** ja sen tuoma **`assets/maplibre-gl-shared.mjs`**
(489 kB). Workboxin oletus-glob on `**/*.{js,css,html,ico,png,svg}` — ja molemmat ovat
`.mjs`, koska `vite.config.ts`in oma plugin kirjoittaa ne kiinteillä nimillä (MapLibre
etsii ne URL:lla, jota Rollup ei näe).

Eli: **sovelluskuori avautuu välimuistista, ja sitten se kysyy verkolta karttatyöläistään.**
Pöytäkoneella se haku onnistuu eikä kukaan huomaa mitään. Puhelimella ei välttämättä — ja
tulos on täsmälleen se hiljainen vika jonka *tämä sama tiedosto dokumentoi kahdesti*:
*"style loads, TileJSON loads, and not one tile is ever requested."*

**Fontit puuttuivat samasta syystä** — kaikki 24 (12 × woff2, 12 × woff).

## 🟢 GREEN

- [x] `workbox.globPatterns` kattaa `mjs` ja `woff2`
- [x] Todennettu käännetystä `sw.js`:stä: molemmat `.mjs` ja kaikki 12 woff2-leikkausta
      ovat manifestissa. **8 → 24 tiedostoa, 1888 KiB → 2532 KiB**
- [x] `woff2` ilman `woff`ia: jokainen selain joka pystyy ajamaan tämän buildin lukee
      woff2:n, ja molempien esilataus tuplaisi fonttipainon tyhjästä
- [x] Portti: `lint:lines`, `tsc -b`, 1371 vitest, `pnpm build`
- [x] **Kenttävahvistus S23 Ultralla — Infinite, 2026-09-15: *"korjaus auttoi, nyt toimi"*.**
      Tämä oli syy, ei arvaus joka sattui olemaan lähellä. Vanha service worker vaihtui
      `autoUpdate`illa sovelluksen uudelleenavauksessa

## Mitä tämä paljastaa, ja mikä on isompi asia kuin itse korjaus

`claude.md` §9 sanoo Vaihe 1:n portiksi *"Walk 10 min in airplane mode; trail persists"*,
ja §19 sanoo *"Run the 360px mobile viewport first, not last. v2's mobile layout was a P0
bug in a mobile-only game."*

Tätä ei huomannut yksikään testi, koska **mitään ei aja service workeria vasten**. E2E
ajaa `vite preview`iä, jossa SW:n esilatauslista ei ole pelissä mukana; yksikkötestit
eivät tiedä koko tiedostosta. Portti oli vihreä koko ajan, ja peli oli rikki juuri siinä
laitteessa jota varten se on tehty.

**Se on oma tikettinsä** (`BRDC-MOBILE-005`, kirjoittamatta): jokin ajo, joka lataa
buildin service workerin kanssa, katkaisee verkon ja vaatii kartan piirtyvän.

## Ei tässä

- `BRDC-GPX-004` — tuonti kestää 20–22 s `mobile-360`:ssa. Eri vika, yhä auki. Sprite-
  rasteroinnin korjaus (sama tutkimusretki, oma committinsa) **ei** lyhentänyt sitä,
  mikä on mitattu eikä oletettu
- Esilatauksen koko sinänsä. 2,5 MB on kertaluonteinen asennushinta pelille jonka on
  tarkoitus toimia ilman verkkoa; jos se alkaa haitata, se on oma päätöksensä
