# BRDC-SEASON-004 — Kausi sinetöidään: pakotettu retire ja historia

| | |
|---|---|
| **Alue** | `features/season, features/hall; apps/worker/src/legacy.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S3, "The map becomes a fossil")` |
| **Status** | `todo` |

## 🔴 RED

Retire (HALL-001) on vapaaehtoinen, eikä eläköityneiden lista päädy historiaan (jonossa oleva TODO). Dokumentti: sinetöinnissä kartta jäätyy, 48 h fossiilina luku-tilassa, sitten tilinpäätös.

**Lisäys Infiniteltä 2026-09-29:** *"kun season 2 julkaistaan, siihen tulee ilmoitus että
Retire your kingdom to the history books.. Lisäksi haluan, että cloudflaressa olevat vanhat
kingdomit, surreal kingdom, sampan majamaa jne.. arkistoidaan kanssa."* Retire ei siis jää
pelaajan oman laitteen varaan: Workerin `player:*`-tiedostot (myös niiden, jotka eivät
enää avaa peliä) arkistoidaan Chroniclesiin samalla kertaa.

## 🟢 GREEN

- [ ] Vaiheessa `sealed` peli on luku-tilassa (ei valtausta eikä rakentamista); S3-ruutu Quiet/Risen + sija + Legacy
- [ ] Pakotettu retire: valtakunta Hall of Fameen (HALL-003 Chronicles), tallennus nollautuu kaudelle
- [ ] **Julkaisuilmoitus:** kun v0.7.0 avautuu ja pelaajan tallennus on Season 1:ltä, ensimmäinen ruutu on "Retire your kingdom to the history books". Se ei ohitu ennen retirea
- [ ] **Workerin vanhat kuningaskunnat arkistoidaan:** admin-reitti (`ADMIN_KEY`) kirjoittaa jokaisesta `player:*`-tiedostosta `LegacyEntry`n Chroniclesiin (Surreal Kingdom, Sampan majamaa, …), sitten `player:*` ja shardit tyhjenevät uutta kautta varten. Idempotentti: toinen ajo ei tuplaa rivejä
- [ ] Eläköityneiden lista historiaan (Atlas history / Chronicles)
- [ ] Rivaalien viimeiset valtakunnat avattavissa read-only
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

e2e: admin sinetöi → pelaaja näkee S3:n eikä voi vallata.

## Ei tässä

—
