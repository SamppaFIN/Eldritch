# BRDC-SEASON-004 — Kausi sinetöidään: pakotettu retire ja historia

| | |
|---|---|
| **Alue** | `features/season, features/hall; apps/worker/src/legacy.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S3, "The map becomes a fossil")` |
| **Status** | `done` — 2026-09-29; sija S3:ssa ja rivaalien read-only [~] |

## 🔴 RED

Retire (HALL-001) on vapaaehtoinen, eikä eläköityneiden lista päädy historiaan (jonossa oleva TODO). Dokumentti: sinetöinnissä kartta jäätyy, 48 h fossiilina luku-tilassa, sitten tilinpäätös.

**Lisäys Infiniteltä 2026-09-29:** *"kun season 2 julkaistaan, siihen tulee ilmoitus että
Retire your kingdom to the history books.. Lisäksi haluan, että cloudflaressa olevat vanhat
kingdomit, surreal kingdom, sampan majamaa jne.. arkistoidaan kanssa."* Retire ei siis jää
pelaajan oman laitteen varaan: Workerin `player:*`-tiedostot (myös niiden, jotka eivät
enää avaa peliä) arkistoidaan Chroniclesiin samalla kertaa.

## 🟢 GREEN

- [~] Sinetöity kausi: `K.sealed` (`repository.legacy.freeze`) pysäyttää askelvaltauksen ja kävelyn kasvun ✓ (Vitest); S3-ruutu `SeasonGate` (Quiet/Risen + Legacy-taulukko + "The map is frozen") ✓ e2e. **Ei vielä:** rakentamisen esto sinetöitynä ja oma sija (tulee SEASON-005:n tauluista)
- [x] Pakotettu retire: `SeasonGate` ajaa saman polun kuin vapaaehtoinen (`retireKingdom` → `resetForSeason`, `publishLegacy` Chroniclesiin, `clearAll`, reload); tuore tallennus liittyy avoimeen kauteen (`keep.found`)
- [x] **Julkaisuilmoitus:** (`SeasonGate` + `Modal dismissible={false}`: ei ×:ää, ESC ei sulje; aukeaa kun Workerin kausi n ≥ 2 on auki ja tallennuksella on Season 1 -maata; era esitäytetty "Season 1"; e2e `season-gate.spec.ts`) kun v0.7.0 avautuu ja pelaajan tallennus on Season 1:ltä, ensimmäinen ruutu on "Retire your kingdom to the history books". Se ei ohitu ennen retirea
- [x] (`apps/worker/src/archive.ts`, `POST /season/archive` {era, wipe?} admin-avaimella; avain `legacy:<pelaaja>:archive-<era>` → idempotentti; Fortress-solut talteen `season:ruins` SEASON-007:lle, `GET /season/ruins`. **Ajettu vain tyyppitarkistuksena** — Infinite ajaa `wrangler deploy`n ja kutsun) **Workerin vanhat kuningaskunnat arkistoidaan:** admin-reitti (`ADMIN_KEY`) kirjoittaa jokaisesta `player:*`-tiedostosta `LegacyEntry`n Chroniclesiin (Surreal Kingdom, Sampan majamaa, …), sitten `player:*` ja shardit tyhjenevät uutta kautta varten. Idempotentti: toinen ajo ei tuplaa rivejä
- [x] Eläköityneiden lista historiaan: arkistointi ja pakotettu retire kirjoittavat molemmat Chroniclesiin (`/legacy`), jonka Hall of Fame -paneeli jo näyttää
- [~] Rivaalien viimeiset valtakunnat read-only: ei vielä (vaatii arkistoidun kartan tilannekuvan ennen `wipe`ä)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1903); MapView 399/400

## Todennus

e2e: admin sinetöi → pelaaja näkee S3:n eikä voi vallata.

## Ei tässä

—
