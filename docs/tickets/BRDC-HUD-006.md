# BRDC-HUD-006 — Kapea ja leveä HUD

| | |
|---|---|
| **Alue** | `features/hud/Hud.tsx`, `useHudFold.ts`, `HudNarrow.tsx` (uusi), `hud-sheet.css` |
| **Vaihe** | Käytettävyys (lokakuu 2026) |
| **Effort** | S–M |
| **Riippuvuudet** | BRDC-HUD-001 (30 % -raja), BRDC-ONBOARD-001 (Kirjan askel) |
| **Lähde** | Infinite 2026-10-13: *"No voisko hudista tehdä kapean ja leveän version?"* Päätökset: kapeassa luvut + Collect + Kirjan askel; uusi pelaaja aloittaa kapeasta |
| **Status** | `done` |

## 🔴 RED

360 px:n puhelimella HUD (paneeli 307 px + navigaatio 58 px) vie 44 % ruudusta, HUD-001:n
raja on 30 % (`trail-detail:81` punainen). Kahva taittaa paneelin nyt kokonaan pois — väliä ei
ole.

## 🟢 GREEN

- [x] **Kapea** (oletus): rivi 1 — taso · heksat · pieni Collect; rivi 2 — Up next -nauhan
      ensimmäinen (Kirjan askel). Varoitukset (häipyvät solut, Void, loitsu, waypoint)
      näkyvät molemmissa
- [x] **Leveä**: nykyinen paneeli sellaisenaan
- [x] Kahva vaihtaa kapean ja leveän välillä; valinta muistetaan (`es3:hud-size`). Vanha
      "kokonaan piiloon" -tila poistuu — kapea korvaa sen
- [x] HUD-001: kapea HUD < 30 % ruudusta 360 px:ssä — mitattu 25,6 % (`trail-detail:81` vihreä,
      ja sama testi avaa leveän ja kaventaa takaisin)
- [x] e2e: `openMap` avaa leveän (vanhat speksit löytävät pussin, Landsin, Vigilin);
      `everything = false` näyttää uuden pelaajan kapean
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Ei tässä

Leveän sisällön uudelleenjärjestely.
