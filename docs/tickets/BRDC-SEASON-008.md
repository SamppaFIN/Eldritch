# BRDC-SEASON-008 — Maailmanihmeet jäävät kartalle ja saavat erikoistoiminnot

| | |
|---|---|
| **Alue** | `packages/core/src/rules/wonder.ts, harmalaWonder.ts, features/wonder` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-007 |
| **Lähde** | Infinite 2026-09-29 (chat); `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf` |
| **Status** | `todo` |

## 🔴 RED

Infinite 2026-09-29: *"haluan, että world wonderit jäävät kartalle ja niilläkin on
erikoistoimintoja."* Kauden nollaus ei saa pyyhkiä ihmeitä: ne ovat kartan pysyviä
maamerkkejä, eivät kauden omaisuutta. Nyt ihme on löytö, jolla on efekti mutta ei omaa
toimintoa.

Ristiriita dokumentin kanssa: Season-PDF sanoo *"deposits, wonders and gate sites have all
moved"* (uusi siemen siirtää ihmeet). Infiniten sana voittaa (§3: käyttäjän sanat ensin):
ihmeet pysyvät paikallaan kaudesta toiseen, siemen siirtää vain esiintymät ja portit.

## 🟢 GREEN

- [ ] Ihmeiden paikat eivät riipu kauden siemenestä (`wonderPlace` pois `seed`-syötteestä); kauden vaihto ei poista niitä
- [ ] Jokaisella ihmeellä oma erikoistoiminto (esim. kerran vuorokaudessa: näky, siunaus, vihjeen löytö, portin sinetöinti etäältä) — lista kirjoitetaan ja hyväksytetään Infinitellä ennen koodia
- [ ] Toiminto näkyy ihmeen paneelissa `hexActions`-rivinä; cooldown per pelaaja
- [ ] Legacy-rivi 'Wonders held' (SEASON-003) lukee edelleen hallintaa, ei löytöä
- [ ] Vitest toiminnoille + e2e yksi toiminto käytetty
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e.

## Ei tässä

Uudet ihmeet (sisältöä, ei mekaniikkaa).
