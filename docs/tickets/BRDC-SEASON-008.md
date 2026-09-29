# BRDC-SEASON-008 — Maailmanihmeet jäävät kartalle ja saavat erikoistoiminnot

| | |
|---|---|
| **Alue** | `packages/core/src/rules/wonder.ts, harmalaWonder.ts, features/wonder` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-007 |
| **Lähde** | Infinite 2026-09-29 (chat); `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf` |
| **Status** | `done` — 2026-09-29 |

## 🔴 RED

Infinite 2026-09-29: *"haluan, että world wonderit jäävät kartalle ja niilläkin on
erikoistoimintoja."* Kauden nollaus ei saa pyyhkiä ihmeitä: ne ovat kartan pysyviä
maamerkkejä, eivät kauden omaisuutta. Nyt ihme on löytö, jolla on efekti mutta ei omaa
toimintoa.

Ristiriita dokumentin kanssa: Season-PDF sanoo *"deposits, wonders and gate sites have all
moved"* (uusi siemen siirtää ihmeet). Infiniten sana voittaa (§3: käyttäjän sanat ensin):
ihmeet pysyvät paikallaan kaudesta toiseen, siemen siirtää vain esiintymät ja portit.

## 🟢 GREEN

- [x] (tarkistettu: `wonderRoll` hashaa ilman kauden suolaa, joten ihmeet pysyvät; SEASON-007:n suola ei koske niitä) Ihmeiden paikat eivät riipu kauden siemenestä (`wonderPlace` pois `seed`-syötteestä); kauden vaihto ei poista niitä
- [x] (**Infinite hyväksyi 2026-09-29** ehdotuksen "one action per wonder": 12 toimintoa `rules/wonderActs.ts` — R'lyeh sinetöi lähimmän portin kaukaa, The Temple sanity +3 / vrk, Nameless City 2 vihjettä, Hyperborea aitta +25 %, Kadath paljastaa 3 rengasta, Leng yhden tekniikan wisdomin, Y'ha-nthlei 40 manaa, Mountains of Madness Fight +1, Arkham Lore +1, Deeper Slumber palauttaa tutkijan, Innsmouth 60 ruokaa, Dunwich Stones ilmainen riitti Reckoningissa) Jokaisella ihmeellä oma erikoistoiminto (esim. kerran vuorokaudessa: näky, siunaus, vihjeen löytö, portin sinetöinti etäältä) — lista kirjoitetaan ja hyväksytetään Infinitellä ennen koodia
- [x] Toiminto heksakortilla (`CellWonder.tsx`) sillä heksalla, josta valtakunta ihmeen löysi (`K.wonderFinds`; ihmeen istuin on koko provinssi); kerran / vrk / pelaaja (`K.wonderActs`), vain heksan haltijalle
- [x] Legacy-rivi 'Wonders held' lukee hallintaa (löytöheksa yhä oma) — SEASON-003
- [x] Vitest (`wonderAct.repo.test.ts` 4) + e2e Innsmouth käytetty ja lepää
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1916)

## Todennus

Vitest + e2e.

## Ei tässä

Uudet ihmeet (sisältöä, ei mekaniikkaa).
