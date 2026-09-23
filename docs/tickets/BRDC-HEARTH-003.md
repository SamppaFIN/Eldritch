# BRDC-HEARTH-003 — Grow the Hearth with food

| | |
|---|---|
| **Alue** | `packages/core/src/rules/hearthGrowth.ts`, `data/hearthGrowthStore.ts`, `apps/game/src/features/keep/HearthGrowth.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `done` — 2026-09-24 (v0.6.61) |

## 🔴 RED

Infinite 2026-09-24: *"tee vielä ominaisuus millä käyttämällä ruokaa voi kasvattaa omaa
hearthia toivotusti."* Sama toive kuin 2026-09-23 todo-listan kohta 17 (Hearthin säde
kasvaa kuin Civilizationissa, yksi heksarengas kerrallaan). Hearth perustetaan solulla ja
sen kuudella naapurilla; siitä eteenpäin maata sai vain kävelemällä viereen.

## 🟢 GREEN

- [x] `rules/hearthGrowth.ts`: puhdas `growHearth(pool, ring, hexes)` —
      rengas *n* on `6n` heksaa, hinta **5 ruokaa per ostettu heksa** (rengas 2 = 60,
      rengas 6 = 180; alle varaston katon `BASE_STORAGE_CAP` 500). Kattona 6 rengasta
      (127 heksaa). Kieltäytyy ennen kuin ottaa mitään. 7 Vitest-testiä
- [x] `data/hearthGrowthStore.ts`: `growHearthAt` — settle → laske seuraavan renkaan
      **vapaat** heksat → maksa vain niistä → valtaa `resolveCapture`lla. Toisen (tai
      oman) hallussa oleva heksa jää koskematta eikä maksa: tämä ostaa maata, ei vie
      sitä. Rengas talletetaan (`K.hearthRing`). 5 Vitest-testiä repositoryn läpi
- [x] `GameRepository.hearthRing()` / `growHearth(now)`
- [x] Keep-paneeliin "Hearth reach N of 6" ja nappi "Grow the Hearth · 60 food"
      (hinta näkyy ennen painallusta, nappi pois päältä ilman ruokaa, tulos sanotaan:
      "N hexes taken, M already held"). Kartta piirtyy uudelleen (`onGrown`)
- [x] e2e: `hearth-growth.spec.ts` — Keepissä nappi, hinta ja pois päältä uudessa pelissä
- [x] Portti: `lint:lines`, `tsc -b`, **1731** vitest, `pnpm build`

## Omat valintani (ei erikseen kysytty)

- Hinta 5/heksa on arvaus. Uusi peli ei tuota ruokaa (perusvarasto on kivi ja kulttuuri),
  joten ensimmäinen rengas vaatii ruokaa tuottavaa maata — säädettävissä yhdestä vakiosta
  (`HEARTH_FOOD_PER_HEX`)
- Vain seikkailumoodi: Keep on reittimoodissa piilossa, eikä reittimoodissa ole ruokaa

## Ei tässä

- "Väestö kasvattaa Hearthia" (todo 17:n toinen puolisko) — nyt maksetaan ruoalla, ei
  väestöllä
