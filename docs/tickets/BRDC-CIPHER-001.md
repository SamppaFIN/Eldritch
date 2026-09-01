# BRDC-CIPHER-001 — Sirpaleet, koottu kirjoitus, ja repeämä toiseen ulottuvuuteen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio (backlogia täyttöön, ei omaa featurea — §6 sääntö 6) |
| **Effort** | M (1–2 tikettiä: keräys+kokoaminen, sitten repeämä-event) |
| **Riippuvuudet** | BRDC-EVENT-001 (chain-engine), BRDC-CHAR-001 (found-items-osio), BRDC-REVEAL-001 (hash-tierit) |
| **Status** | `in-progress` — Vaihe 1 (keräys + kokoaminen) valmis v0.5.3, Vaihe 2 (repeämä) `todo` |
| **Valmius** | 55 % |
| **Lähde** | Infinite 2026-09-02: *"löydät reissuilta random viestejä jotka yhdessä kokoavat mystisen kirjoituksen ja kartan, millä pääsee toiseen ulottuvuuteen"* |

## 🔴 RED

Kävelyllä ei löydy mitään omistettavan maan lisäksi. v2:n discovery-loop (kerää sirpaleita,
saat XP:tä) oli hyvä koukku mutta se lastattiin sisällöllä kunnes se hajosi. v3:lla on
deterministinen hash (`reveal.ts`, `anomaly.ts`), chain-engine ja Character-näkymän
found-items-osio — kaikki palaset ovat jo olemassa, mutta mikään ei yhdistä niitä
metsästykseen jolla on maali.

## 🟢 GREEN — Vaihe 1 (valmis v0.5.3)

- [x] **`cipherShardAt(h3)`** (`rules/cipher.ts`, puhdas): sirpale vain `common`-ruudulla
      jonka suolattu FNV-hash alittaa ~1.4 % → n. 1 % kaikesta maasta. Indeksi 0..6 toisesta
      hashista. Deterministinen, reload ei re-rollaa. Ei koske `rare`/`legendary`-tiereihin.
- [x] **Sirpaleen poiminta** kävelemällä ruudun päälle (`useCipher`, `useQuestFinds`-kaava).
      `K.cipherShards` = `number[]`. Kerran per indeksi.
- [x] **Sirpale kantaa rivin** kirjoitusta (`data/cipher.json`) ja **sointu sigiliä**
      (`Heptagram`, laskettu {7/3}-tähti, stroke, ei dataa — §12).
- [x] **Kokoaminen**: 7 sirpaletta → Character-näkymän **The Cipher** -osio: osittainen
      tähti + kerätyt rivit + `N/7`. 7/7 → koko sigili + koko kirjoitus.
- [x] `CipherReveal`-toast löydöllä (sigili + rivi + pling), jää napautukseen.
- [x] Puhdas + Vitest: `rules/cipher.test.ts`, `data/cipher.repo.test.ts`. 827 vihreää.

## 🟢 GREEN — Vaihe 2 (`todo`)

- [ ] **`cipherTargetCell()`** — repeämän sijainti. Auki: kiinteä ruutu offsetilla Fuming
      Laken patsaskoordinaatista (jaettu, Härmälä-ankkuroitu kuten maastokysely) **vai**
      globaali suunta+etäisyys sovellettuna kunkin pelaajan omaan Hearthiin (jaettu
      *matka*, saavutettavissa missä tahansa). Päätös Vaihe 2:n alkaessa.
- [ ] Kultainen markkeri sille ruudulle kun cipher on koossa (territory-GeoJSONiin kuten
      quest-markkerit, tai oma taso).
- [ ] **`the-rift`** seikkailu `adventures.json`:iin + walk-onto-target-liipaisin joka
      kutsuu `startAdventure('the-rift')`; päättyy codex-avaukseen (`cipher-rift`) + XP.
- [ ] Ei oikeaa toista karttaa — oma vaiheensa jos repeämä toimii.

## Toteutus

Sirpalenumerointi ja kokoamistarkistus ovat puhtaita funktioita (`rules/cipher.ts`).
Tekstit `data/cipher.json`:issa; sigili laskettu (`heptagram.tsx`), ei path-dataa.
`data/cipherStore.ts` on seam (`adventureStore.ts`-muotoa). Repeämä (Vaihe 2) ajetaan
`adventureStore`in kautta, ei chain-enginellä — chain sitoo anomalia-solun tilaan,
seikkailu ei.

## Ei tässä

- Oikea toinen kartta / ulottuvuus omana pelitilanaan — oma vaiheensa jos repeämä toimii.
- Sirpaleiden vaihtokauppa pelaajien välillä — Vaihe 5.
- Useita ciphereitä — engine ottaa dataa, backlog täyttää myöhemmin.
