# BRDC-CHANGELOG-001 — Changelog in the menu, appended on every push

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) + jatkuva ylläpito |
| **Riippuvuudet** | BRDC-HUD-003 (valikko), BRDC-LOG-001 (paneelimuoto) |
| **Status** | `done` — 2026-09-01 (ylläpito jatkuvaa) |
| **Valmius** | 85 % |
| **Lähde** | Infinite 2026-09-01: *"tehdään myös change log hampurilaisvalikkoon.. aina kun pusket uuden version listaa muutokset.. appendaa filuun. anna versionumero"* |

## 🔴 RED

Kaverit pelaavat julkaistua Pages-versiota. Kun jokin muuttuu, he eivät tiedä mitä —
eikä ole tapaa katsoa. "Onko tämä uusi?" on kysymys johon peli ei vastaa.

## 🟢 GREEN

- [x] `APP_VERSION` `packages/core/rules/constants.ts`:ssä — yksi lähde. `package.json`
      ×2 ja `claude.md` §2 nostettu samaan (`0.3.0`)
- [x] `apps/game/src/features/changelog/changelog.json` — versio-lohkot, uusin ensin,
      ihmisen kieltä. **Tämä on se tiedosto johon lisätään** joka työnnöllä
- [x] `ChangelogPanel` — `LogPanel`-muoto: ei-modaali, ESC, katkaistu HUDin yläpuolelle,
      vierii
- [x] `SettingsMenu`ssa rivi **"What's new · v0.3.0"** (versio näkyy oikeassa reunassa)
- [x] Yksi tiedosto — `changelog.json` on totuus, ei erillistä `CHANGELOG.md`:tä
      (git-historia on silti se oikea loki)
- [~] "uusi versio" -merkki kunnes avattu — siirretty (localStorage viimeksi nähty)
- [x] `apps/game/tsconfig.json` `include` sai `src/**/*.json` (kuten `packages/core`)

## Prosessi (avustajalle)

Joka `git push origin main` -kerran jälkeen:
1. Bumppaa `APP_VERSION` (patch normaalisti, minor kun vaihe/iso ominaisuus)
2. Lisää `CHANGELOG.md`:n kärkeen version-lohko
3. Committaa se samaan tai seuraavaan pushiin

## Ei tässä

- Automaattinen "päivitä nyt" -kehote (service worker) — Vaihe 4/5
