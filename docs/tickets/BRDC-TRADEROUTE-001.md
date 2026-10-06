# BRDC-TRADEROUTE-001 — Kauppareitit kävelemällä

| | |
|---|---|
| **Alue** | `rules/tradeRoute.ts`, `data/tradeRouteStore.ts`, trail |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | TRAIL-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A7; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Kahden paikan välinen yhteys ei tuota mitään. Kauppareitti tekee kävelystä talouden. (Huom. `TRADE-001` on eri asia: tavernan vaihtokurssi.)

## 🟢 GREEN

- [ ] Kun pelaaja kävelee yhtenäisen reitin omalta Marketilta toiselle Marketille tai kylään (oletus ≤ 2 km, yksi kävely), syntyy kauppareitti
- [ ] Reitti tuottaa kultaa tunnissa (oletus 2 + 1/km) niin kauan kuin molemmat päät ovat omia; katkeaa jos pää menetetään
- [ ] Reitti piirtyy kartalle ohuena kultaisena viivana; Ledgeriin oma rivi
- [ ] Puhtaat säännöt (reitin tunnistus kävelyn pisteistä) + fixture-testit `sim/`-kävelyillä
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Rivaalien väliset reitit; kauppareitin ryöstö.
