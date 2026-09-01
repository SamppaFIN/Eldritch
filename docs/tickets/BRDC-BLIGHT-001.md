# BRDC-BLIGHT-001 — Rappio näkyväksi: leviävä turmelus reunoilta

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S–M (render + copy -kerros olemassa olevan decayn päälle) |
| **Riippuvuudet** | BRDC-CLAIM-005 (decay/sweep), BRDC-MAP-002 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infinite 2026-09-02: *"esim hirviöt"* → rappio hirviönä; Aavistuksen ehdotus |

## 🔴 RED

Decay on taulukkomekaniikka: ruudun `strength` laskee, HUD sanoo "The Void reclaims N",
ruutu katoaa. Se toimii mutta se ei **tunnu** miltään — ei vihollista jota vastaan
taistella, vain numero joka pienenee. Sama matikka voisi näkyä asiana.

## 🟢 GREEN

- [x] **Blight = decay-tila renderöitynä.** `blightLevel(cell, now, home?)` (`rules/decay.ts`,
      puhdas): 0 grace-ajan sisällä, `clamp01((hoursPastGrace) / BLIGHT_FULL_HOURS)` sen
      jälkeen, kaikki 1 kymmenen päivän jälkeen. Ei uutta tilaa. `CELL_BLIGHT_LAYER` on
      near-black fill `fill-opacity = blight × 0.6`, fillin päällä, viivojen alla.
- [x] **Turmelus leviää reunalta.** `cellsToGeoJson` laskee omistus-setin ja merkitsee
      reunasolun (omistettu + ≥1 omistamaton naapuri); `blight × BLIGHT_EDGE_FACTOR (1.5)`,
      katolla 1. Pelkkä render­painotus, ei mekaniikkaa.
- [x] **Kävely puhdistaa.** Automaattista — vierailu nollaa `lastVisitedAt`in → past-grace
      → blight 0 seuraavassa renderissä. Ei uutta verbiä.
- [x] **Copy:** HUD:n himmenemisvaroitus "— the blight is on them, walk them";
      `decay`-codexiin lause tahrasta. "The Void reclaims" jää fiktioksi, "blight" on vain
      sen ilmiasun nimi — ei muuta uudelleennimetty.
- [x] Puhdas `blightLevel` testattu (`decay.test.ts`): grace, ramppi, katto, Hearth/imported
      poikkeukset, Bulwark-suoja. `territoryFeatures.test.ts` laajennettu. 834 vihreää.
- [x] `prefers-reduced-motion`: tahra on staattinen fill, ei animaatiota purettavana.

## Ei tässä

- Oikeat liikkuvat hirviö-entiteetit kartalla — se on iso systeemi (spawn, AI, tila).
  Tämä on decayn *ilmiasu*, ei uusi olio.
- Blightin mekaaninen vaikutus (nopeampi strength-lasku reunalla) — vain visuaalinen v1;
  jos halutaan mekaaniseksi, se on `constants.ts`-muutos ja oma tarkastelunsa.
