# BRDC-MAP-001 — MapLibre ja tumma karttatyyli

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SETUP-002 |
| **Status** | `done` — 2026-08-26 |
| **Valmius** | 100 % |

## 🔴 RED

Karttaa ei ole. v2 käytti Leafletia rasteritiilillä suoraan OpenStreetMapista, ja se
näytti tavalliselta OSM-kartalta — `ANALYSIS.md`:n arvion mukaan v2:n esityksen heikoin
osa. Lisäksi Leafletin klusterointi jouduttiin kytkemään pois päältä, koska se meni
rikki (`MapSystem.js:922`).

## 🟢 GREEN

- [x] MapLibre GL JS renderöi kartan WebGL:llä
- [x] Karttatyyli on **tumma ja sävytetty `--void-black`iin** — ei saa näyttää OSM:ltä
- [x] Tyyli on omassa tiedostossaan `apps/game/src/features/map/style.ts`, jotta sitä
      on helppo virittää
- [x] Kartta täyttää ruudun, HUD kelluu sen päällä
- [x] Pelaajan sijaintimarkkeri: hehkuva piste + tarkkuusympyrä
- [x] 360 px viewportilla kartta on käytettävä yhdellä peukalolla
- [x] Verkkokatko: kartta ei kaadu, taustaksi jää tumma väri ja HUD toimii

## Toteutus

**Miksi MapLibre eikä Leaflet** (`files/CLAUDE.md` §Stack):
- Klusterointi on **natiivi ominaisuus**, ei oma toteutus — v2:n TODO poistuu
- Vektoritiilet ovat tyyliteltävissä; rasteritiiliä ei voi värjätä
- WebGL renderöi kymmeniä tuhansia heksoja (BRDC-CLAIM-006); Leaflet ei

**Tiililähde:** avaimeton vektorilähde. Tämä on ainoa sallittu ulkoinen verkkopyyntö
koko Vaiheiden 0–2 sovelluksessa, ja se on dokumentoitava `style.ts`:ään kommenttina.

**Sävytys:** vektorityylin väripaletti ylikirjoitetaan tokeneilla — maa `--void-black`
suuntaan, vesi `--eldritch-blue`, tiet himmeä `--cosmic-purple`. Tekstitarrat minimiin:
tämä on peli, ei navigaattori.

**Graceful degradation:** jos tiilipyynnöt epäonnistuvat, kartta jää tummaksi taustaksi.
Jälki, heksat ja HUD renderöityvät silti — ne ovat omia GeoJSON-layereitään.
Vaiheen 1 hyväksymisportti on **lentokonetilassa kävely**, joten tämä ei ole
teoreettinen vaatimus.

## Testit

- [x] Kartta renderöityy Playwrightissa ja `map.isStyleLoaded()` on tosi
- [x] Tiilipyynnöt estettynä → sivu ei kaadu, HUD näkyy
- [x] 360 px viewport ajetaan ensin
- [x] Sijaintimarkkeri liikkuu simuloidun sijainnin mukana

> **Kolme bugia, jotka e2e-testit löysivät ja jotka jäivät testeiksi:**
>
> 1. **MapLibren worker ei latautunut.** MapLibre 6 etsii tiiliparserinsa
>    `new URL('./maplibre-gl-worker.mjs', import.meta.url)`illa. Rollup ei näe
>    merkkijonosta koottua URLia, joten tiedostoa ei emitoitu; worker haki SPA-fallback-
>    HTML:n ja kuoli jäsentäessään sitä. **Vika oli täysin hiljainen:** tyyli latautui,
>    TileJSON latautui, virhettä ei tullut — eikä yhtään tiiltä koskaan pyydetty.
>    Korjaus: `vite.config.ts`:n oma plugin emitoi workerin ja sen `maplibre-gl-shared.mjs`:n.
> 2. **Tarkkuusympyrä oli 256× liian suuri.** Metriä/pikseli -kaavassa oli ylimääräinen
>    `+ 8`, joka kuuluu saman identiteetin tiilipikselimuotoon. 12 m tarkkuus piirsi
>    5 386 px ympyrän.
> 3. **Markkeri oli 9 px pielessä** eli puolet omasta leveydestään. `es-breathe`-animaatio
>    asetti `transform: scale()`, joka korvasi keskityksen `translate(-50%, -50%)`.
>    Korjaus: animaatio käyttää erillistä `scale`-ominaisuutta, joka ei kosketa `transform`ia.
>
> **Muutos suunnitelmaan:** verkkokatkolla **ei vaihdeta tyyliä**. Tausta on jo
> `--void-black`, joten `createVoidStyle` olisi heittänyt layerit pois turhaan. Sen
> sijaan tila raportoidaan HUDissa ja palautuu itsestään kun peitto palaa
> (`sourcedata`). Katutason katoaminen kerrotaan sanoin, ei värillä.

## Ei kuulu tähän tikettiin

Jäljen renderöinti (BRDC-TRAIL-002). Heksat (BRDC-CLAIM-006). Klusterointi — sitä ei
tarvita ennen kuin kartalla on löytöjä (Vaihe 6).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 2 · `files/CLAUDE.md` §Stack, §Design tokens ·
`ANALYSIS.md` §8 kohdat 12, 15
