# BRDC-UX-006 — Lore tiiviimmäksi

| | |
|---|---|
| **Alue** | `LorePanel.tsx` |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Lore on ~5 ruutua: opitut palat täysikokoisina kortteina, sinetöidyt Aget (III–V) kaikkine korteineen, makutekstit jokaisessa.

## 🟢 GREEN

- [x] Opitut palat yhdelle riville
- [x] Sinetöity Age yhdeksi riviksi ("Sealed — learn 3 of Age II"), avattavissa
- [x] Makutekstit togglen taakse; eureka-rivi jää näkyviin
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — `pnpm test` 2154 ✓, `typecheck` ✓, `lint:lines` ✓, build ✓; e2e 360 px: muutoksen speksit vihreinä (dream, masks, week, up-next, task-board, era, ambition, cell-actions, yield-card, opening 41/90/187, lands, nation 35/69, share); punaiset (dialogs, gpx, diplomacy, keep-citizens, season-gate 77/101, nation 107, guide 41, opening 66, claim 67/222) punaisia myös HEADissa d493c4b, rinnakkaisella worktree-ajolla

## Ei tässä

Loren sääntömuutokset.
