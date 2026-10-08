# BRDC-TRADEROUTE-001 — Kauppareitit kävelemällä

| | |
|---|---|
| **Alue** | `rules/tradeRoute.ts`, `data/tradeRouteStore.ts`, trail |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | TRAIL-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A7; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Kahden paikan välinen yhteys ei tuota mitään. Kauppareitti tekee kävelystä talouden. (Huom. `TRADE-001` on eri asia: tavernan vaihtokurssi.)

## 🟢 GREEN

- [x] Kun pelaaja kävelee yhtenäisen reitin omalta Marketilta toiselle Marketille tai kylään (oletus ≤ 2 km, yksi kävely), syntyy kauppareitti — `advanceJourney` (≤ 2 km, ei yli 30 min taukoa); kylän pää = kylän ovi-heksa; walk writer kantaa matkan erien yli (`K.tradeJourney`), yksi reitti per pääpari, lyhyempi voittaa
- [x] Reitti tuottaa kultaa tunnissa (oletus 2 + 1/km) niin kauan kuin molemmat päät ovat omia; katkeaa jos pää menetetään — `routesGold` YIELD-mallin kautta (realm-rivi "Trade route: 0.6 km"); kylän pää ei voi kadota
- [x] Reitti piirtyy kartalle ohuena kultaisena viivana; Ledgeriin oma rivi — `routeLayer.ts` (katkennut haaleana katkoviivana); Ledgeriin oma Routes-välilehti
- [x] Puhtaat säännöt (reitin tunnistus kävelyn pisteistä) + fixture-testit `sim/`-kävelyillä — `tradeRoute.test.ts` (`simulateWalk`), `tradeRoute.repo.test.ts` (kahdessa erässä walk writerin läpi)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2107/2107, e2e `trade-route.spec.ts` 360 px vihreä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Rivaalien väliset reitit; kauppareitin ryöstö.
