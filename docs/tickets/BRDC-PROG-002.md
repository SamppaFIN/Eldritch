# BRDC-PROG-002 — Ei käsiä, ei satoa

| | |
|---|---|
| **Alue** | `packages/core/src/rules/staffing.ts, data/pouch.ts, keep + cell panel` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | PROG-001 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (LAW I, WORK-taulukko, "Stores fill for 12 hours")` |
| **Status** | `in-progress` — 4/5; esiintymäbonukset jäljellä (2026-09-29) |

## 🔴 RED

Rakennus tuottaa tänään ikuisesti ilman ketään (`perHourBonus`). LAW I: rakennus tuottaa vain miehitettynä; paikat kasvavat tasolla; varasto täyttyy 12 h ja Keepille kävely kerää kaiken (päivän kymmenykset).

## 🟢 GREEN

- [x] (`rules/staffing.ts`: `WORK_TABLE`, `slotsFor`, `staffedBonus`, `assignWorker`, `trimStaff`; dokumentin listaamaton Work maksaa vanhan tuntituottonsa per työläinen, 1 paikka) `slots(lv)=1+⌊lv/2⌋`; per-worker-tuotot dokumentin taulukosta (Farmstead +3 food … Drowned Man +1 culture +1 gold)
- [x] Miehittämätön = 0 tuottoa: `perHourBonus` maksaa Season 2 -tallennuksella vain miehitetyt (myös Works-puun bonukset); `repository.keep.staff/staffOn` valmiit. Nälkälähtö vie työläisen (`trimStaff`). UI: `features/keep/CellStaff.tsx` solukortissa (Send a citizen / Call one back, rivi per rakennus, ei näy Season 1:llä); e2e `keep-citizens.spec.ts` 6/6. Alkuperäinen: Miehittämätön = 0 tuottoa; `Send idle citizen` solupaneelissa ja P1:ssä
- [x] (`STORE_MS`, `KeepState.titheAt`; `settlePouch` pysäyttää koko valtakunnan — tuotanto, aitta ja syönti — 12 h viimeisestä keräyksestä, nukuttuja tunteja ei makseta jälkikäteen; `walkFlow` kerää kun jälki osuu Hearth-soluun, `titheAtKeep`; Keep-paneeli: "Stores fill for N more h" / "The stores are full…"). Nykyinen Collect-nappi (D1) jää Season 1:lle — yhdistäminen kun Season 1 päättyy. Alkuperäinen: Varasto 12 h katto (`storageH`), Keepille kävely kerää; nykyinen Collect yhdistyy tähän (D1 ratkeaa)
- [ ] Forge syö 1 timber/työläinen; esiintymäbonukset (food deposit ×2, forest in reach, bog iron)
- [ ] Vitest + e2e: miehitys → tuotto alkaa
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e + P1 AT WORK -lista.

## Ei tässä

Rakennuspuun tasot (PROG-005).
