# BRDC-TUTOR-004 — Two dialogs, open at once

| | |
|---|---|
| **Alue** | `features/tutor/UnlockMoment.tsx`, and whatever dialog it can land on top of |
| **Status** | `todo` — raportoitu kolmesti, **diagnosoitu 2026-09-15**, ei korjattu |
| **Lähde** | Huomattu sivutuotteena `BRDC-DETAIL-001`/`-KEEP-008`/`-TECH-003`in e2e-todennuksissa |

## 🔴 RED

Sama ilmiö kolmesti kolmella eri speksillä, kolmella eri ajolla, aina samaan
`UnlockMoment`-opastusdialogiin liittyen:

- `step-claim.spec.ts` / `map.spec.ts`: "unlock" muistuttaa napin `<button
  class="unlock__later">`/`<button class="unlock__read">` sieppaa osoittimen klikkauksen
  joka oli tarkoitettu kartalle
- `temple.spec.ts`: `getByRole('dialog')` osuu kahteen elementtiin samaan aikaan —
  Research-dialogiin JA "unlock"-dialogiin (`aria-labelledby="unlock-title"`,
  `aria-modal="false"`) — molemmat auki yhtä aikaa

Jokainen toistettu identtisenä muuttamattomalla koodilla (`git stash`), joten kyse ei ole
minkään yksittäisen tiketin regressiosta — ilmiö on ollut olemassa jo ennen tätä sessiota.

**Mahdollinen oikea bugi tämän e2e-kohinan takana:** `UnlockMoment`in oma
`aria-modal="false"` viittaa siihen ettei se yritäkään olla ainoa avoin dialogi — mutta
jos se voi ilmestyä toisen, aidosti modaalin (`aria-modal` puuttuu/`true`,
`role="dialog"`) päälle kesken pelaajan toiminnon, se on sama ongelma oikealle
pelaajallekin: fokus ja ESC eivät tiedä kumpaa dialogia ne koskevat, ja osoitin voi
sieppautua väärään kohteeseen kesken kosketuksen.

## Ei tässä

Diagnoosi ja korjaus — ei vielä aloitettu. Katsottava ensin: mikä päättää milloin
`UnlockMoment` näytetään, ja voiko sen näyttäminen odottaa kunnes mikään muu dialogi ei
ole auki.

## Diagnoosi (2026-09-15, löytyi `BRDC-SIGIL-006`:n kuvakaappausajossa)

**Juurisyy: `.unlock` on samalla z-tasolla kuin HUD.**

- `unlock-moment.css`: `.unlock { position: fixed; inset: 0; z-index: var(--z-hud) }`
- `hud.css`: `.hud { position: fixed; z-index: var(--z-hud) }`
- Tasatilanteessa DOM-järjestys ratkaisee, ja HUD tulee myöhemmin — **HUD on päällä.**

**Uusi oire, pelaajalle todellinen:** 360×780-ruudulla avattu tilapaneeli ulottuu opastuksen
nappien päälle. Playwright yritti klikata "Not now" 120 sekuntia:
*`<button class="hud__handle"> … intercepts pointer events`*. Pelaaja ei voi sulkea
opastusta taittamatta paneelia ensin — eikä mikään kerro että niin pitäisi tehdä.

`inset: 0` koko ruudun kokoisena kerroksena selittää todennäköisesti myös ensimmäisen oireen
(opastus sieppaa kartalle tarkoitetun klikkauksen) — ei vielä todennettu erikseen.

### Päätös Infiniteltä — kaksi tapaa korjata

1. **Aito modaali:** `--z-modal`, `aria-modal="true"`, fokusloukku. Yksinkertainen, mutta
   opastus peittää kartan jota se opettaa
2. **Pysyy HUD-tasolla, mutta paneelin yläpuolella:** sijoitus `--hud-height`in yläpuolelle
   ja taustakerrokselle `pointer-events: none`, jolloin vain dialogi itse ottaa kosketuksen.
   Säilyttää nykyisen tarkoituksen (*"Centred in the map, not in the window"*)
