# BRDC-UX-001 — Avoin paneeli saa ruudun — kävelyarkki kutistuu

| | |
|---|---|
| **Alue** | `Hud.tsx`, `hud.css`, paneelien korkeus |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `todo` |

## 🔴 RED

Kun Keep, hex-kortti, Lore tai Ledger on auki, kävelyarkki (Collect, sirut, nauha, neljä nappia) ja navipalkki jäävät alle: paneeli saa 428 px 780:stä. Keep on 4282 px eli ~11 ruudullista vieritystä.

## 🟢 GREEN

- [ ] Paneelin ollessa auki arkki kutistuu yhdeksi riviksi (taso + Collect) tai piiloon; navipalkki jää
- [ ] Paneelin näkyvä korkeus vähintään ~2× nykyinen 360×780-näkymässä (mitattu)
- [ ] Paneelin sulkeminen palauttaa arkin ennalleen; ei layout-hyppyä kartalla (CLS)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen

## Ei tässä

Arkin uudelleensuunnittelu kokonaan.
