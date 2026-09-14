# BRDC-SIGIL-005 — Oma kasvo: kaksikymmentä avataria

| | |
|---|---|
| **Alue** | `features/character/avatarIds.ts`, `Avatar.tsx`, `avatarShapesA/B.tsx`, `AvatarPicker.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | done — 2026-09-14 (v0.5.87) |
| **Edeltäjä** | BRDC-SIGIL-001, BRDC-SIGIL-004, BRDC-CHAR-001 |

## 🔴 RED

Design-dokumentin §04 antaa kaksikymmentä avataria viidessä perheessä (Silhuetti,
Silmäinen, Vesi, Viivamerkki, Kaksisävy) — **eri asia kuin valtakuntamerkit**:
valtakuntamerkki merkitsee omistettua maata kartalla; avatar on pelaajan oma kasvo,
näkyvillä vain You-ruudulla. Peli ei tuntenut tätä käsitettä ollenkaan ennen tätä.

## 🟢 GREEN

- [x] **Kaksikymmentä avataria porrattu tarkasti dokumentista**, hyväksytty JSX-muotoon.
      Neljä per perhe, `currentColor` läpi jokaisessa niin että kääri-`<svg>` värittää
      koko kuvan yhdellä CSS-propertyllä
- [x] **Oma, itsenäinen tallennus.** `es3:avatar`, sama versioitu kirje kuin
      `nation.ts`illa — ei jaettu tila, koska mikään muu ruutu ei koskaan lue tätä
      (toisin kuin lippu, jonka kartta myös piirtää)
- [x] **Kääntäjä pakottaa täydellisyyden** täälläkin: `AVATAR_META: Record<AvatarId, …>`
- [x] Valitsin Character-ruudulla, sama kuvio kuin `BannerPicker`: nappi avaa, ruudukko
      sulkeutuu valinnasta, saavutettava nimi jokaiselle
- [x] Portti: 1361 vitest, desktop `nation` 4/4, mobile-360 `standards` 9/9

## Kaksi asiaa jotka löytyivät tehdessä

**Node-ympäristössä ei ole `localStorage`ia.** Kirjoitin ensin testit jotka kutsuivat
`writeAvatarId`/`readAvatarId`iä suoraan — juuri kuten `nation.ts` ei koskaan ole tehnyt,
tarkastuksen jälkeen selvisi miksi: juuritason `vitest.config.ts` on `environment: 'node'`.
Poistin ne kaksi testiä ja jätin persistenssin sinne minne `nation.ts`kin sen jättää — e2e:hen
oikeaa selainta vasten.

**Kaksinkertainen skrollikontaineri esti klikkauksen.** Annoin ensin
`.character__avatar-picker`ille oman `overflow-y: auto`in, kuten `.nation__picker`ille.
Mutta `.character`-paneeli **itse** jo skrollaa, ja e2e ei päässyt klikkaamaan Shoggothia
— Playwrightin scroll-into-view hämmentyi sisäkkäisistä skrolleista. Todennettu
ajamalla testi toistuvasti puhtaana pelkän poiston jälkeen. Yksi skrolli koko arkille on
myös parempi käyttöliittymä: peukalo ei jää loukkuun kahdenkymmenen laatan sisään.

## Todennus

`avatar.test.ts`: guard, 20 kappaletta, viisi tasan neljän perhettä, ei kahta samaa
nimeä. `nation.spec.ts` laajennettu: valitsin avautuu, tarjoaa 20, oikea nimi napissa,
säilyy uudelleenavauksen yli.

## Ei tässä

- Seitsemän ruutua, refraktiokerros — listattu `BRDC-SIGIL-001`:ssä
- Avatar ei näy missään muualla kuin You-ruudulla (ei kartalla, ei Codexissa) —
  tarkoituksellista: dokumentti ei pyydä sitä, ja se olisi uusi mekaniikka
