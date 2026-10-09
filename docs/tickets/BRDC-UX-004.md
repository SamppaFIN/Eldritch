# BRDC-UX-004 — Keep välilehdille, ja lisätiedot togglen taakse

| | |
|---|---|
| **Alue** | `HearthPanel.tsx`, Keep-osiot |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | M |
| **Riippuvuudet** | UX-001 |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Keep on yksi ~11 ruudun pötkö: valtakunta, viikko, ambitio, suurhenkilöt, tutkija, Kirja, muukalainen, portit, kansalaiset, kukkaro, Hearth, temppelikoulut, mestariteokset, Legacy, riskit. Ei rakennetta, samat luvut kahdesti.

## 🟢 GREEN

- [x] Välilehdet kuten Ledgerissä: **Today** (Collect, kansalaiset, viikko, riskit) · **Realm** (Hearth, temppelit ja koulut, mestariteokset, Legacy) · **Investigator** (tutkija, tilat, liittolainen, tarina, Kirja, muukalainen, portit, potkuri) · **Season** (Doom/Mythos, mysteerit, ambitio, suurhenkilöt, taulut)
- [x] Togglen taakse: mestariteosten vaatimuslistat (näkyy "0 of 3 met"), tutkijan tarinakortti, Kirjan sivujen tekstit, Legacy-taulukko (näkyy summa), riskien yksityiskohdat
- [~] Ratkaistut valinnat yhdelle riville (ambitio, koulu, nimetty muukalainen) — muukalainen yksi rivi; valittu ambitio on otsikko + edistymispalkki, koulun riitit näkyvät listana (ne ovat toimintoja, eivät valinta)
- [x] Tuplat pois: Health · Sanity · Clues vain kerran — Keepissä vain Investigator-välilehden porttiosio; Today-välilehden "Sanity" on valtakunnan oma luku
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — `pnpm test` 2154 ✓, `typecheck` ✓, `lint:lines` ✓, build ✓; e2e 360 px: muutoksen speksit vihreinä (dream, masks, week, up-next, task-board, era, ambition, cell-actions, yield-card, opening 41/90/187, lands, nation 35/69, share); punaiset (dialogs, gpx, diplomacy, keep-citizens, season-gate 77/101, nation 107, guide 41, opening 66, claim 67/222) punaisia myös HEADissa d493c4b, rinnakkaisella worktree-ajolla

## Ei tässä

Osioiden sisällön muutokset.
