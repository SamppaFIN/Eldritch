# BRDC-CIPHER-001 — Sirpaleet, koottu kirjoitus, ja repeämä toiseen ulottuvuuteen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio (backlogia täyttöön, ei omaa featurea — §6 sääntö 6) |
| **Effort** | M (1–2 tikettiä: keräys+kokoaminen, sitten repeämä-event) |
| **Riippuvuudet** | BRDC-EVENT-001 (chain-engine), BRDC-CHAR-001 (found-items-osio), BRDC-REVEAL-001 (hash-tierit) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-02: *"löydät reissuilta random viestejä jotka yhdessä kokoavat mystisen kirjoituksen ja kartan, millä pääsee toiseen ulottuvuuteen"* |

## 🔴 RED

Kävelyllä ei löydy mitään omistettavan maan lisäksi. v2:n discovery-loop (kerää sirpaleita,
saat XP:tä) oli hyvä koukku mutta se lastattiin sisällöllä kunnes se hajosi. v3:lla on
deterministinen hash (`reveal.ts`, `anomaly.ts`), chain-engine ja Character-näkymän
found-items-osio — kaikki palaset ovat jo olemassa, mutta mikään ei yhdistä niitä
metsästykseen jolla on maali.

## 🟢 GREEN

- [ ] **`cipher`-hash-tier** `reveal.ts`:ään — hyvin harvinainen (~1 %), oma FNV-suola.
      Deterministinen: sama ruutu joka puhelimessa, reload ei re-rollaa.
- [ ] **Sirpaleen poiminta** kävelemällä collect-säteelle (discovery-vakiot: `collect 5 m`).
      Yksi sirpale per `cipher`-ruutu, kertaalleen. Tallentuu `K.cipherShards`.
- [ ] **Sirpale kantaa palan** kirjoitusta (rivi tekstiä) **ja palan SVG-sigiliä** (stroke,
      ei täyttöä — §12). Deterministinen sirpalenumero ruudun hashista.
- [ ] **Kokoaminen**: N sirpaletta (esim. 7) → "Broken Cipher" Character-näkymässä. Koottuna
      renderöityy **yksi kokonainen kirjoitus + yksi kokonainen sigili**.
- [ ] **Kartta**: koottu cipher osoittaa yhteen H3-ruutuun — deterministinen **globaalista**
      siemenestä, ei pelaajakohtaisesta, jotta kaverit kilpailevat tai tekevät yhteistyötä.
      Ruutu näkyy kartalla kultaisena sigilinä kun cipher on koossa.
- [ ] **Repeämä**: kävele ruudulle + pidä hetki → kertakäyttöinen chain-event
      (`chains.json`-muoto). Ei oikeaa toista karttaa (se on oma vaiheensa) — **hetki**:
      lyhyt kirjoitettu sekvenssi + pysyvä codex-avaus ja kosmeettinen merkki.
- [ ] Kaikki keräys- ja kokoamislogiikka `packages/core`:ssa puhtaana + Vitest.

## Toteutus

Sirpalenumerointi ja kokoamistarkistus ovat puhtaita funktioita (`rules/cipher.ts`).
Kirjoituksen tekstit + sigilin palat ovat dataa (`data/cipher.json`). Repeämä on
`chainStore`in kautta kuten anomalian ketju. Found-items-UI laajenee yhdellä
"Broken Cipher · 4/7" -rivillä.

## Ei tässä

- Oikea toinen kartta / ulottuvuus omana pelitilanaan — oma vaiheensa jos repeämä toimii.
- Sirpaleiden vaihtokauppa pelaajien välillä — Vaihe 5.
- Useita ciphereitä — engine ottaa dataa, backlog täyttää myöhemmin.
