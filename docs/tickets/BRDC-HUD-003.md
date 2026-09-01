# BRDC-HUD-003 — Hampurilaisvalikko, ja tuhoavat toiminnot pois kävelypalkista

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-CLAIM-007 (`Settings`), BRDC-HUD-002 |
| **Status** | `done` — 2026-09-01 |
| **Valmius** | 90 % |

## 🔴 RED

"Return everything to the Void" (`⬡`) ja "Withdraw" istuvat alapalkissa "Here":n ja
"Vigil":n vieressä — tuhoava toiminto yhden osuman päässä napista jota painetaan
muutaman sekunnin välein kävellessä. Ääntä ja värinää (BRDC-CLAIM-007) ei voi kytkeä
mistään.

## 🟢 GREEN

- [x] Yläkulmassa pieni hampurilaisnappi (`☰`), lokeron reunan sisällä (`env(safe-area)`)
- [x] Auki: Sound-kytkin, Vibration-kytkin, "Retreat from the map", "Delete progress"
- [x] Retreat/Delete käyttävät **samaa vahvistusdialogia** (`SanctumDialogs`) kuin ennen
      — valikko vain siirtää laukaisimen
- [x] `Here` ja `Vigil` jäävät alapalkkiin ennallaan
- [x] Kytkimet tallentuvat (`saveSettings`, avain `settings`), oletus molemmat päällä
- [x] ESC ja ulkopuolinen napautus sulkevat; ei fokuslukkoa (pelaaja liikkuu)
- [x] `role="switch"` + `aria-checked`, `aria-expanded`, näkyvä fokusrengas
- [x] `.hud__withdraw` / `.hud__icon-btn` CSS poistettu — muutokseni teki niistä orpoja

## Toteutus

`SettingsMenu.tsx` (+`settings-menu.css`): `position: fixed` ylävasen, `z-index:
var(--z-hud)`. Nappi avaa `GlassPanel`in (`role="dialog"`). Kytkimet ovat
`<button role="switch">`, teksti "On"/"Off" värillä (vihreä/dim) — väri ei yksin kanna
tietoa. Retreat/Delete kutsuvat `onRetreat`/`onDeleteProgress` jotka `MapView`ssä
laukaisevat `setConfirming('withdraw'|'reset')` — dialogit ennallaan.

`MapView` omistaa `settings`-tilan (`useState(loadSettings)`), `onSettingsChange`
tallentaa + asettaa. `<SettingsMenu visible={inspect.cell === null && !inspect.sanctum}>`
— piilossa kun solu- tai kotipesäpaneeli on auki, jottei nappi peitä paneelin
yläkulmaa.

`Hud`:sta poistettu `onWithdraw`/`onReset` propit ja niiden kaksi `RitualButton`ia
`hud__actions`ista. `MapNotices`-erottelu (BRDC-CLAIM-007) piti `MapView`n alle 400 r.

## Testit

- [x] 675 testiä vihreä, `tsc -b` puhdas, `lint:lines` OK
- [~] `SettingsMenu` on React-komponentti — ei yksikkötestiä; `load`/`saveNow` on jo
      testattu `persist/save.test.ts`:ssä
- [~] Manuaalinen: valikko auki/kiinni, kytkin päälle/pois säilyy reloadissa, Retreat
      avaa vahvistuksen — kentällä

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `claude.md` §14 (yksi peukalo, tuhoavat vahvistetaan)
