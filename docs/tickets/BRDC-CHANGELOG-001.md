# BRDC-CHANGELOG-001 — Changelog in the menu, appended on every push

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) + jatkuva ylläpito |
| **Riippuvuudet** | BRDC-HUD-003 (valikko), BRDC-LOG-001 (paneelimuoto) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-01: *"tehdään myös change log hampurilaisvalikkoon.. aina kun pusket uuden version listaa muutokset.. appendaa filuun. anna versionumero"* |

## 🔴 RED

Kaverit pelaavat julkaistua Pages-versiota. Kun jokin muuttuu, he eivät tiedä mitä —
eikä ole tapaa katsoa. "Onko tämä uusi?" on kysymys johon peli ei vastaa.

## 🟢 GREEN

- [ ] `CHANGELOG.md` juuressa. Jokainen työntö lisää version-lohkon: `## 0.x.0 —
      YYYY-MM-DD` + lyhyt lista muutoksista (ei commit-viestejä, ihmisen kieltä)
- [ ] Yksi versionumero, yhdessä paikassa (`APP_VERSION` `packages/core`ssa tai
      `package.json`ista johdettu). `claude.md` §2 `versio` pidetään synkassa
- [ ] `ChangelogPanel` — `HelpPanel`/`LogPanel`-muoto: ei-modaali, ESC, katkaistu HUDin
      yläpuolelle, vierii. Uusin versio ensin
- [ ] `SettingsMenu`ssa rivi **"What's new"** (tai versio näkyy siinä: `v0.3.0`)
- [ ] Sisältö: `changelog.json` jonka build johtaa `CHANGELOG.md`:stä, TAI .md
      parsitaan ajossa. Ei toista totuutta
- [ ] "Uusi versio" -merkki valikon napissa kunnes pelaaja on avannut changelogin
      (localStorage: viimeksi nähty versio)

## Prosessi (avustajalle)

Joka `git push origin main` -kerran jälkeen:
1. Bumppaa `APP_VERSION` (patch normaalisti, minor kun vaihe/iso ominaisuus)
2. Lisää `CHANGELOG.md`:n kärkeen version-lohko
3. Committaa se samaan tai seuraavaan pushiin

## Ei tässä

- Automaattinen "päivitä nyt" -kehote (service worker) — Vaihe 4/5
