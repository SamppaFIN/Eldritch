# BRDC-TUTOR-004 — Two dialogs, open at once

| | |
|---|---|
| **Alue** | `features/tutor/UnlockMoment.tsx`, and whatever dialog it can land on top of |
| **Status** | `todo` — raportoitu kolmesti tämän session e2e-ajoissa, ei diagnosoitu |
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
