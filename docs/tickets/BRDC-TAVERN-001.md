# BRDC-TAVERN-001 — Taverna ja tehtävätaulu

| | |
|---|---|
| **Alue** | `rules/build.ts`, `types/domain.ts` (`BuildingId`), uusi tehtävätaulun paneeli, `quest/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-TERRAIN-005` (settlement/trade), `BRDC-QUEST-006`, `BRDC-RES-001` (Ale Cellar) |
| **Lähde** | `worldseed.ts` (`STRUCTURES.tavern`), Worldseed §05 |

## 🔴 RED

Seikkailu alkaa nyt seisomalla sen ensimmäisellä paikalla. **Mikään paikka pelissä ei kerro
että tehtäviä on olemassa.**

Worldseed: **Tavern** on pelaajan rakentama, settlementille tai tradelle, +2 gold +1 culture.
*"The quest board. Every active chain in the province is listed here and nowhere else — so the
Tavern is not decoration, it is how the player finds out there is anything to do."*
Yksi per provinssi. Viereinen Ale Cellar tuplaa sen kullan.

Dokumentti sanoo myös: *"Also the respawn point for the Wager and the only place a rival can
leave a message."* — **Infinite on päättänyt poistaa Wagerin** (`BRDC-WAGER-008`).

## 🟢 GREEN

- [ ] `BuildingId 'tavern'`: maasto settlement|trade, tuotto +2 gold +1 culture, hinta (päätös —
      dokumentti ei anna)
- [ ] **Yksi per provinssi**, kieltäytyminen sanoo mitä tehdä
- [ ] Tehtävätaulu: provinssin aktiiviset ketjut, kunkin seuraava askel ja sen heksa
- [ ] Viereinen Ale Cellar tuplaa kullan (`BRDC-RES-001`)
- [ ] Kuva `#bTavern` (`BRDC-RES-002`)

## Päätös Infiniteltä

- **Wager-osuus pois** (respawn, viestit) — suositus: kyllä, `BRDC-WAGER-008`
- **"Listed here and nowhere else"** vs. Fuming Lake, joka alkaa patsaalta: listataanko molemmat
  taululla, ja voiko ketjun yhä aloittaa paikan päällä?
- Hinta

## Ei tässä

- Pelaajien väliset viestit
