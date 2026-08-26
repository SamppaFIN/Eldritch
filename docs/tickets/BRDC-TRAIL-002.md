# BRDC-TRAIL-002 — Ley-linen renderöinti hehkulla

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-TRAIL-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Jälki on dataa, mutta kartalla ei näy mitään. Kävelemisen pitää tuntua siltä, että
maailmaan piirtyy jotain — se on koko pelin ydinpalkinto.

## 🟢 GREEN

- [ ] Jälki renderöityy MapLibren GeoJSON-lähteenä, ei DOM-elementteinä
- [ ] Hehku on **kaksi päällekkäistä layeria**:
      leveä sumea `--cosmic-purple` + kapea kirkas `--sacred-gold`
- [ ] Uusi segmentti animoituu esiin
- [ ] Animaatiot pois `prefers-reduced-motion: reduce` -tilassa
- [ ] 2 000 pisteen jälki renderöityy sujuvasti puhelimella (ei nykimistä)
- [ ] Käyttöliittymässä jälki on **"Ley-line"**, ei "trail"

## Toteutus

**Sanasto** (`files/CLAUDE.md` §Domain model) — koodissa `trail`, käyttöliittymässä
**Ley-line**. Sama pätee muihin: `claim` → *Awakening the Ground*, `steal` → *Corruption*,
`cell` → *Warded Cell*.

```ts
// Kaksi layeria samasta lähteestä
{ id: 'leyline-glow', type: 'line', source: 'trail',
  paint: { 'line-color': cosmicPurple, 'line-width': 12, 'line-blur': 8, 'line-opacity': 0.6 } }
{ id: 'leyline-core', type: 'line', source: 'trail',
  paint: { 'line-color': sacredGold, 'line-width': 3 } }
```

**Yksi GeoJSON-lähde, päivitys `setData()`llä.** Ei uutta layeria per segmentti — se oli
v2:n virhe markkereissa ja johti tuhansiin DOM-elementteihin.

## Testit

- [ ] `gps-noise.json`-fixture renderöityy ilman virhettä
- [ ] Layerien määrä pysyy vakiona kun pisteitä lisätään (ei kasva)
- [ ] `prefers-reduced-motion` → ei animaatioita
- [ ] Visuaalinen tarkistus puhelimella: hehku näkyy myös kirkkaassa ulkovalossa

## Ei kuulu tähän tikettiin

Sulkeutuneen lenkin korostus (BRDC-CLAIM-001). Muiden pelaajien jäljet — niitä ei näytetä
lainkaan, vain heidän alueensa.

## Lähde

`PROMPTS.md` Vaihe 1 kohta 6 · `files/CLAUDE.md` §Domain model, §Design tokens
