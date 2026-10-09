# BRDC-UX-001 — Avoin paneeli saa ruudun — kävelyarkki kutistuu

| | |
|---|---|
| **Alue** | `Hud.tsx`, `hud.css`, paneelien korkeus |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` (2026-10-09, haara `season-3`) |

## 🔴 RED

Kun Keep, hex-kortti, Lore tai Ledger on auki, kävelyarkki (Collect, sirut, nauha, neljä nappia) ja navipalkki jäävät alle: paneeli saa 428 px 780:stä. Keep on 4282 px eli ~11 ruudullista vieritystä.

## 🟢 GREEN

- [x] Paneelin ollessa auki arkki kutistuu yhdeksi riviksi (taso + Collect) tai piiloon; navipalkki jää — piiloon (Keepillä oma Collect). Juurisyy: BRDC-HUD-005:n compact-tila piilotti luokkia (`hud__stats`, `hud__claim`), jotka oli refaktoroinnissa nimetty uudelleen — arkki ei kutistunut koskaan
- [~] Paneelin näkyvä korkeus vähintään ~2× nykyinen 360×780-näkymässä (mitattu) — Keep 428 → 684 px (1,6×). Loput on navipalkki, joka jätettiin tarkoituksella; 2× vaatisi navin piilottamisen paneelin ajaksi (Infiniten päätös)
- [x] Paneelin sulkeminen palauttaa arkin ennalleen; ei layout-hyppyä kartalla (CLS) — CSS-piilotus, ei uudelleenmounttausta; `--hud-height` päivittyy
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — 26 arkkiin koskevaa speciä ajettu yhdellä workerillä: kaikki punaiset ovat punaisia myös edellisessä commitissa (11 vanhalla v0.8.1-listalla; claim:67 ja lands:139 vanhoja; claim:222 perf-budjetti ylittyy myös `main`issa 8,0–8,6 s; ledger korjattu 5 välilehdelle; week.spec odottaa Keepin tallennusta ennen reloadia)

## Ei tässä

Arkin uudelleensuunnittelu kokonaan.
