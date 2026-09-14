# BRDC-SIGIL-002 — Maasto on laatta, ei kirjain

| | |
|---|---|
| **Alue** | `features/territory/terrainSprites.ts`, `TerritoryLayer`, `territoryImages` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | done — 2026-09-14 (v0.5.84) |
| **Edeltäjä** | BRDC-SIGIL-001, BRDC-ART-003 |

## 🔴 RED

Infinite: *"toi kartta on ihan tissiposki."*

Maasto oli **tekstiglyyfi** — risti metsälle, aaltoviiva vedelle — 9–18 px:n kirjain
80 px:n heksassa. Se on symbolitaulu, ei paikka. Designdokumentin §03 on koko vastaus
tähän, ja se on yksi muutos: plintti per maasto.

## 🟢 GREEN

- [x] **Seitsemän isometrista laattaa**, yksi jokaiselle maastolle
- [x] **Dokumentin rakennussääntö, sääntönä eikä seitsemänä piirroksena:** 2:1-vinoneliö,
      yläpinta täydellä värillä, vasen 42 % mustaa, oikea 22 %, hiusviiva valkoista 20 %:lla.
      Testi vaatii jokaisen laatan käyttävän samaa plinttiä — jos yksi lakkaa, se lakkaa
      näyttämästä muiden sukulaiselta
- [x] **Uusi maasto on uusi koriste, ei uusi resepti.** Plintti on yksi merkkijono
- [x] Rasteroidaan kerran atlakseen — sama polku kuin `bannerSprites` ja `buildingSprites`.
      Ei sheettiä repossa, ei CDN:ää (§7)
- [x] **Glyyfikerros jää varalle eikä poistu.** Alustalla ilman canvasia ei ole kuvia, ja
      silloin kartta putoaa kirjaimiin sen sijaan että heittäisi. Kerros sammutetaan vasta
      kun laatat ovat oikeasti atlaksessa
- [x] Laattakerros on **kaiken alla**: Work seisoo maalla, ja plintti on se millä se seisoo
- [x] Ei `var()`:ia eikä `oklch()`:ta laatan SVG:ssä — sen dekoodaa `Image` dokumentin
      ulkopuolella, jossa kumpikaan ei ratkea. Testi vahtii tätä
- [x] Portti: 1332 vitest, desktop `map` 14/14 + `sigil` 1/1, mobile-360 `standards` 9/9

## Todennus

E2E ajaa oikeassa selaimessa ja kysyy kartalta itseltään: ovatko kuvat atlaksessa, onko
laattakerros näkyvissä, ja **astuiko glyyfikerros syrjään**. Kaksi merkkiä yhdestä asiasta
yhdellä heksalla on sitä kohinaa josta §12 varoittaa.

Jaot joita tämä vaati: `TerritoryLayer` → `territoryImages.ts` (mitä kuvia on olemassa vs.
mitkä kerrokset piirtävät niitä) ja → `layerIds.ts` (muuten noiden kahden välille syntyy
tuontisykli).

## Ei tässä

- **Bonusresurssien spritet** (12 kpl dokumentissa). Sama polku, seuraava askel.
- **Rakennusten spritejen uudelleenpiirto** dokumentin hahmojen mukaan. `buildingSprites`
  on jo isometrinen ja toimii; sen korvaaminen on makua, ei vikaa — ja
  [[good-enough-is-done]] koskee juuri sitä.
