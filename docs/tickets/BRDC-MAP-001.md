# BRDC-MAP-001 — MapLibre ja tumma karttatyyli

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SETUP-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Karttaa ei ole. v2 käytti Leafletia rasteritiilillä suoraan OpenStreetMapista, ja se
näytti tavalliselta OSM-kartalta — `ANALYSIS.md`:n arvion mukaan v2:n esityksen heikoin
osa. Lisäksi Leafletin klusterointi jouduttiin kytkemään pois päältä, koska se meni
rikki (`MapSystem.js:922`).

## 🟢 GREEN

- [ ] MapLibre GL JS renderöi kartan WebGL:llä
- [ ] Karttatyyli on **tumma ja sävytetty `--void-black`iin** — ei saa näyttää OSM:ltä
- [ ] Tyyli on omassa tiedostossaan `apps/game/src/features/map/style.ts`, jotta sitä
      on helppo virittää
- [ ] Kartta täyttää ruudun, HUD kelluu sen päällä
- [ ] Pelaajan sijaintimarkkeri: hehkuva piste + tarkkuusympyrä
- [ ] 360 px viewportilla kartta on käytettävä yhdellä peukalolla
- [ ] Verkkokatko: kartta ei kaadu, taustaksi jää tumma väri ja HUD toimii

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

- [ ] Kartta renderöityy Playwrightissa ja `map.isStyleLoaded()` on tosi
- [ ] Tiilipyynnöt estettynä → sivu ei kaadu, HUD näkyy
- [ ] 360 px viewport ajetaan ensin
- [ ] Sijaintimarkkeri liikkuu simuloidun sijainnin mukana

## Ei kuulu tähän tikettiin

Jäljen renderöinti (BRDC-TRAIL-002). Heksat (BRDC-CLAIM-006). Klusterointi — sitä ei
tarvita ennen kuin kartalla on löytöjä (Vaihe 6).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 2 · `files/CLAUDE.md` §Stack, §Design tokens ·
`ANALYSIS.md` §8 kohdat 12, 15
