# BRDC-TRAIL-002 — Ley-linen renderöinti hehkulla

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-TRAIL-001 |
| **Status** | `done` — 2026-08-27 (2 kohtaa auki, ks. alla) |
| **Valmius** | 85 % |

## 🔴 RED

Jälki on dataa, mutta kartalla ei näy mitään. Kävelemisen pitää tuntua siltä, että
maailmaan piirtyy jotain — se on koko pelin ydinpalkinto.

## 🟢 GREEN

- [x] Jälki renderöityy MapLibren GeoJSON-lähteenä, ei DOM-elementteinä
- [x] Hehku on **kaksi päällekkäistä layeria**:
      leveä sumea `--cosmic-purple` + kapea kirkas `--sacred-gold`
- [ ] Uusi segmentti animoituu esiin — **ei toteutettu.** Jälki päivittyy kerralla
      `setData`lla. Siirretty Vaiheeseen 6 (kiillotus)
- [x] Animaatiot pois `prefers-reduced-motion: reduce` -tilassa
- [x] 2 000 pisteen `setData` **mitattu**: pääsäie ei jumitu (< 250 ms), kartta pysyy elossa
- [x] Käyttöliittymässä jälki on **"Ley-line"**, ei "trail"

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

- [x] `gps-noise.json` syötetään renderöijälle ja kaikki 69 pistettä päätyvät lähteeseen
- [x] Layerien määrä pysyy vakiona kun pisteitä lisätään (ei kasva)
- [x] `prefers-reduced-motion` → ei animaatioita
- [ ] **Puhelimella ulkona tarkistamatta** — se on Vaiheen 1 hyväksymisportti, ei minun ajettavissani

> **Säätö:** hehkuväri on `--cosmic-purple` sävy pidettynä mutta vaaleus nostettuna
> (`#a04ad4`). Token-arvolla `#4a1a5c` halo on tummempi kuin rakennukset joiden yli se
> kulkee, eikä sitä yksinkertaisesti näy puhelimessa päivänvalossa.

## Ei kuulu tähän tikettiin

Sulkeutuneen lenkin korostus (BRDC-CLAIM-001). Muiden pelaajien jäljet — niitä ei näytetä
lainkaan, vain heidän alueensa.

## Lähde

`PROMPTS.md` Vaihe 1 kohta 6 · `files/CLAUDE.md` §Domain model, §Design tokens
