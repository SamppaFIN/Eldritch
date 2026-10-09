# BRDC-UX-005 — Hex-kortti: tärkeimmät toiminnot ensin, loput "More"

| | |
|---|---|
| **Alue** | `CellPanel.tsx` |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | M |
| **Riippuvuudet** | UX-001 |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `todo` |

## 🔴 RED

Hearthin heksalla kortti on ~4 ruutua: seikkailun aloitus, Reveal, Ward, Open the Keep, Works/Rites, portin kolme vaihtoehtoa, olento, paikkatiedot, tuotto, maaruudukko ja tuntierittely. Hylkäysteksti ("Short 25 timber.") leijuu nappien välissä.

## 🟢 GREEN

- [ ] Näkyvissä 2–3 tärkeintä toimintoa, muut "More"-togglen takana
- [ ] Tuntierittely ja maaruudukko "Why this much?" -togglen taakse
- [ ] Hylkäysteksti sen napin viereen, joka sen aiheutti
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen

## Ei tässä

Uudet toiminnot.
