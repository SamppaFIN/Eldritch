# BRDC-WIKI-004 — Build-valikosta wiki-sivulle, ja sivulta kartalle

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M |
| **Riippuvuudet** | BRDC-WIKI-003, BRDC-BUILD-007 |
| **Status** | `done` (2026-09-06, v0.5.40) |
| **Valmius** | 100 % |
| **Lähde** | `BRDC-WIKI-003` jatkoon jättämät kohdat — Infinite 2026-09-06: *"pääset rakennusmenusta rakennuksiin ja niiden sijaintikortteihin"* |

## 🔴 RED

`WIKI-003` jätti kaksi kohtaa auki, koska `CellPanel` ja `MapView` olivat 400 rivissä:
suora linkki build-valikon rivistä rakennuksen wiki-sivulle, ja "show on map"
rakennuksen sivun sijaintikortilta.

## 🟢 GREEN

### Tilaa: `CellWorth.tsx` irti `CellPanel`ista

- [x] Maan arvo -lohko (`m²` · yield · naapurit · vahvuuspalkki + rappiokello) →
      `CellWorth.tsx`. `hoursLeft` + `remaining` siirtyivät mukana. `CellPanel`
      399 → 341.
- [x] `cell-panel.css` (399) → riittien lohko `spell-panel.css`iin, jonka `SpellPanel.tsx`
      importtaa. `cell-panel.css` 359.

### Build-valikko → wiki

- [x] `BuildPanel`: `onWiki?: (id) => void`. Rakennuksen nimi on nappi
      (`cell-panel__build-name`, cyan-linkki) kun `onWiki` annettu — sekä build-rivillä
      että "Standing here" -rivillä.
- [x] Pujotus: `MapView` → `CellPanel onWiki={aside.openHelp}` → `BuildPanel
      onWiki={(id) => onWiki(\`work:${id}\`)}`. `CellPanel.onWiki` on tyypitetty
      `WikiRef`illä (type-only import `../help/wikiPages.js`).

### Wiki-sivu → kartta

- [x] `wikiEntry` `work:`-sivu palauttaa `sites: string[]` — h3:t joilla rakennus seisoo.
- [x] `HelpPanel`: `onShowCell?: (h3) => void`; "Where you have it" -lista, jokainen rivi
      *"Cell N — show on map"* → sulkee oppaan + valitsee solun.
- [x] `useMapAside(repository, now, version, onShowCell)` — `onShowCell` **ref**issä, jotta
      `useSelection` voi olla julistettu tämän hookin jälkeen ilman TDZ:aa. `MapView`
      antaa `(h3) => inspect.onCellTap(h3)`.

### Portti

- [x] `pnpm test` (1001) `&& typecheck && lint:lines && build` vihreät.
- [x] e2e `guide.spec.ts` +1 testi: Hearth-solun build-valikosta "Monument"-nappi →
      Monument-sivu avautuu tilariveineen.

## Ei tässä

- Per-maasto-sivut (`BRDC-WIKI-003` "ei tässä" jää voimaan).
- Sijaintikortin rikkaampi sisältö (maastoglyfi, vahvuus). Rivi kertoo "Cell N", vie
  kartalle; siellä on koko solukortti.
