# BRDC-LANDS-003 — Maalla oli neljä nimeä ja yksi luku ilman selitystä

| | |
|---|---|
| **Alue** | `features/lands/LandsPanel.tsx`, `territory/names.ts`, `CellHeader.tsx`, `DiscoveryModal.tsx`, `gpx/NewLands.tsx` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S |
| **Riippuvuudet** | `BRDC-LANDS-001`, `-002`; sama sarja kuin `BRDC-DETAIL-001` … `-CODEX-003` |
| **Status** | `done` — 2026-09-15 (v0.5.96) |

## 🔴 RED

Sama auditointi kuin seitsemälle ruudulle, nyt "Your lands" -kirjanpitoon. Kaksi
löydöstä, molemmat koodista todennettuja.

### 1. Maaston nimi oli neljässä taulukossa — ja ne olivat jo eronneet toisistaan

| Tiedosto | `hill` |
|---|---|
| `CellHeader.tsx` | `'Bare hillside'` |
| `DiscoveryModal.tsx` | `'A bare hillside'` |
| `LandsPanel.tsx` | `'Hill'` |
| `gpx/NewLands.tsx` | `'Hill'` |

Kaksi rekisteriä — pitkä korttiotsikolle, lyhyt kapealle riville — ja **molemmat
kahdennettuina**. Pitkä pari oli jo ehtinyt liukua erilleen: sama maasto, sama rekisteri,
eri merkkijono. Juuri se mitä kopioitu taulukko tekee, ja täsmälleen sama vika kuin
`RESOURCE_WORD`illa ennen `BRDC-DETAIL-001`:tä.

### 2. Rivillä oli paljas luku, jonka ainoa selitys oli hover

```tsx
<span title="strength">{h.strength}</span>
```

Rivi luki *"timber · 340 · 3 d walked · 12 h"*. Mikä 340 on? Vastaus oli
`title`-attribuutissa — eli hoverissa, jota puhelimessa ei ole. Koodikanta sanoo tämän
itse, `gateNote.ts`in omassa docstringissä: *"on a touchscreen there is no hover to
explain it."* `claude.md` §14 sanoo saman: mitään ei pidä joutua arvaamaan.

## 🟢 GREEN

- [x] **Yksi lähde, kaksi rekisteriä**: `TERRAIN_NAME` (lyhyt) ja `GROUND_NAME` (pitkä)
      `territory/names.ts`:ssä — samassa tiedostossa kuin `BUILDING_NAME` ja `SPELL_NAME`,
      jonka oma docstring lupaa *"and now in one place"*
- [x] Neljä paikallista kopiota poistettu; liukuma ratkaistu `CellHeader`in hyväksi
      (`'Bare hillside'`), koska se on se ruutu jolla teksti eniten luetaan
- [x] Kaksi rekisteriä **säilyy tarkoituksella**: 80 px:n rivi ei mahduta *"Bare
      hillside"*, eikä korttiotsikko ansaitse *"Hill"*. Kaksi taulukkoa yhdessä
      tiedostossa on eri asia kuin neljä taulukkoa neljässä
- [x] `{h.strength}/{MAX_STRENGTH}` — suhdeluku selittää itsensä ilman etikettiä, ja on
      sama muoto jonka solukortti jo näyttää. `title`-attribuutit pois
- [x] `untilLost`in docstring lupasi `"—"`, koodi palautti `'safe'`. Docstring korjattu
      koodin mukaiseksi, ei toisin päin — `'safe'` on parempi sana kuin viiva
- [x] Portti: `lint:lines`, `tsc -b`, 1371 vitest, `pnpm build`, e2e `lands.spec.ts`

## Todennus

`lands.spec.ts` väittää rivin sisältävän `/Plain|Forest|Hill|Mountain|Lake|Coast|Market/`
— eli täsmälleen sen lyhyen rekisterin joka jäi voimaan — ja `/d walked/`. Kumpikaan ei
muuttunut. Ainoa muuttunut merkkijono koko työssä on `DiscoveryModal`in *"A bare
hillside"* → *"Bare hillside"*, jota mikään testi ei lukinnut (tarkistettu).

## Ei tässä

- `lands__pip`in ja muiden rivin merkkien väritys — ne lukevat jo `RESOURCE_COLOUR`ia,
  eli väälaki pätee siellä ennestään
- Rivin tiheys 360 px:llä. Ei mitattua ongelmaa; jos rivi kääriytyy kentällä, se on
  mittaus eikä arvaus, ja oma tikettinsä
