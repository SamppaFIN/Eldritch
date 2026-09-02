# BRDC-NATION-001 — Valtion nimi, lippu ja tilastot Keepin kärkeen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CASTLE-002, BRDC-CHAR-001, BRDC-BANNER-001 |
| **Status** | `done` — 2026-09-02 (v0.5.12), kenttätodennus `[~]` |
| **Valmius** | 90 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"ennen sitä valtion nimen ja lipun valinta ja tilastot, lääni ja asukasmäärä."*

Keep-paneeli (`HearthPanel`) avaa "Your Anchor Stone" ja kertoo Consciousness-tason,
mutta pelaajalla ei ole **valtiota** — ei nimeä, ei lippua, ei kansakunnan lukuja. Keep
on `claude.md` §10:n mukaan se julkinen kasvo jonka muut näkevät; kasvolla pitää olla nimi.

## 🟢 GREEN

- [x] **Valtion identiteetti tallessa.** `es3:nation` = `{ name, bannerId }`
      (`features/nation/nation.ts`, `load`/`saveNow`). Tyhjä nimi → `displayName` →
      *"The Nameless Reach"*, ei estä pelaamista. Tuntematon `bannerId` → `vesica`.
- [x] **Identiteettiosio on paneelin ensimmäinen** — `<NationIdentity>` heti Keepin
      `hearth-panel__head`in jälkeen: nimikenttä, lippu, tilastorivi.
- [x] **Tilastot:** `provinceCount(owned)` = `new Set(owned.map(regionOf)).size` (res 6);
      `population(cellCount, buildingCount)` = `cells*POP_PER_CELL + buildings*POP_PER_BUILDING`
      (`rules/nation.ts`, puhtaat, `constants.ts`:ssä luvut). "N provinces · M souls".
- [x] Nimen muokkaus: paikallinen `draft`-`useState`, `onChange` päivittää vain sen,
      `onBlur`/Enter committaa. `HearthPanel` ei renderöidy per näppäin.
- [~] Nimi/lippu Wager-viestiin ja `world.json`iin — kenttä on olemassa; vienti on
      `BRDC-WAGER-JSON-004`.
- [x] Testit `nation.test.ts`: läänit lasketaan kerran, väkiluku skaalautuu, ei mene
      negatiiviseksi. 873 vihreää.
- [~] Kenttätodennus: nimikentän tuntuma oikealla puhelimella — ensi testipäivänä.

## Ei tässä

- Oikea väestömekaniikka (kasvu, ruoka, tyytyväisyys). Luku on koriste, ei järjestelmä.
- Lipun grafiikka ja heksamerkki — `BRDC-BANNER-001`.
- Diplomatia, valtioiden väliset suhteet — `BRDC-CITY-001`.
