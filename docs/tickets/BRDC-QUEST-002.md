# BRDC-QUEST-002 — Seikkailu siirtyy kartalle

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-QUEST-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infiniten testiajon huomiot 2026-09-01 (v0.4.4) |

## 🔴 RED

Fuming Lake aloitettiin Keepistä simulaationa, ei siitä heksasta missä patsas seisoo.
Etapit eivät olleet heksojen toimintoja. Palaute katosi ennen kuin sen ehti lukea —
trinket-ilmoitus oli poissa ennen kuin Infinite huomasi sen. Vallatusta heksasta ei
lentänyt mitään näkyvää saantoa.

## 🟢 GREEN

- [x] **Seikkailu aloitetaan patsaan heksalta** — `QuestCellPanel` (CellPanelin alipaneeli,
      `AnomalyPanel`in muotoa). Patsaan napista tarina alkaa JA näyttää ensimmäisen sivun
      yhdellä painalluksella (`useFumingLake.openQuestHex`).
- [x] **Jokainen etappi on heksan toiminto** — `questCellInfo` (puhdas): patsas → "Begin",
      nykyisen vaiheen paikka → sen verbi ("Investigate the lake" jne.), edempänä oleva
      paikka → ei toimintoa. Nappi avaa graafisen `AdventureDialog`in (Infiniten valinta).
- [x] **Heksan tiedoissa historia** — `QuestCellPanel` näyttää lyhyen rivin ("You are at
      this point in the tale", "You found this by walking here").
- [x] **Keepin sisäänkäynti pois** — `HearthPanel` menetti "Adventures"-napin; jäljellä
      vain read-only rivi "The Fuming Lake — <puhuja>" kun tarina on kesken.
- [x] **Ilmoitukset jäävät ruudulle** — `QuestReveal` ja `PlaceReveal` odottavat
      napautusta (15 s varmuuskatkaisu), "Tap to dismiss" -vihje. `QuestReveal` soittaa
      plingin (`hud/pling.ts`), `settings.sound` ohjaa.
- [x] **"+N puuta" lentää vallatulta heksalta** — `useAwakening` piirtää kartalle kunkin
      uuden heksan päälle `+10 timber` -tekstin joka nousee ja häipyy 1.8 s
      (`gains-flyup.css`), resurssin värillä. `prefers-reduced-motion` → 1 s haalistus.
- [x] **Uusi määränpää ilmoitetaan** — `useQuestWaypoint`: kun `visibleQuestSites` kasvaa,
      HUD:iin rivi "New waypoint · Hermit's Hovel — walk there" + pling.
- [x] **Historia nimeää löydön** — `describe.ts` `kind:'quest' ref:'found:X'` →
      "Found The Wisdom Stone". "Kuka" = pelaaja itse Vaiheeseen 5 asti.

## Toteutus

`CellPanel` ja `MapView` olivat 399 rivissä. Irrotettu: `cellHistory.ts` (CellPanelista),
`useCellTerrain.ts` ja `useFumingLake.ts` (MapView'sta — koko quest-johdatus yhteen
hookiin). `STAGE_SITE` + `SITE_VERB` `questSites.ts`:ään.

## Ei tässä

- Moninpeli "kuka löysi" — Vaihe 5, backend. Loki sanoo "you".
- Markkeriporrastuksen uudistus — `visibleQuestSites` tekee sen jo (v0.4.3).
- Pysyvä per-heksa historia-store — `QuestCellPanel`in rivi johdetaan tarinan tilasta.
