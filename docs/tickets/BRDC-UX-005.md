# BRDC-UX-005 — Hex-kortti: tärkeimmät toiminnot ensin, loput "More"

| | |
|---|---|
| **Alue** | `CellPanel.tsx` |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | M |
| **Riippuvuudet** | UX-001 |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Hearthin heksalla kortti on ~4 ruutua: seikkailun aloitus, Reveal, Ward, Open the Keep, Works/Rites, portin kolme vaihtoehtoa, olento, paikkatiedot, tuotto, maaruudukko ja tuntierittely. Hylkäysteksti ("Short 25 timber.") leijuu nappien välissä.

## 🟢 GREEN

- [x] Näkyvissä 2–3 tärkeintä toimintoa, muut "More"-togglen takana
- [x] Tuntierittely ja maaruudukko "Why this much?" -togglen taakse
- [x] Hylkäysteksti sen napin viereen, joka sen aiheutti
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — `pnpm test` 2154 ✓, `typecheck` ✓, `lint:lines` ✓, build ✓; e2e 360 px: muutoksen speksit vihreinä (dream, masks, week, up-next, task-board, era, ambition, cell-actions, yield-card, opening 41/90/187, lands, nation 35/69, share); punaiset (dialogs, gpx, diplomacy, keep-citizens, season-gate 77/101, nation 107, guide 41, opening 66, claim 67/222) punaisia myös HEADissa d493c4b, rinnakkaisella worktree-ajolla

## Ei tässä

Uudet toiminnot.
