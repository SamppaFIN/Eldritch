# BRDC-SEED-002 — Maamerkit ja pisteet OpenStreetMapista

| | |
|---|---|
| **Alue** | uusi `scripts/fetchLandmarks.mjs`, `packages/core/src/data/landmarkSeed.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-SEED-001` |
| **Lähde** | `worldseed.ts` (`STRUCTURES.landmark`), Worldseed §05 *"revealed from OpenStreetMap"* |

## 🔴 RED

Worldseedin kuusi kirjoitettua maamerkkiä ovat käsin tehtyä sisältöä (nimi + tarina), mutta
niiden **sijainti** on tässä yhteydessä epäluotettava (`BRDC-SEED-001`:n löydös) ja
dokumentti itse sanoo maamerkkijärjestelmän lähteeksi OSM:n (`tourism`, `historic`,
`artwork_type`, `memorial`, `place_of_worship`). Repossa ei ole yhtään OSM-hakua — vain
kaksi käsin kirjoitettua `.mjs`-skriptiä muihin tarkoituksiin.

Node 22:n sisäänrakennettu `fetch` riittää Overpass API:iin — **ei uutta riippuvuutta.**

## 🟢 GREEN

- [ ] `scripts/fetchLandmarks.mjs`: yksi Overpass-kysely rajatulle bbox:lle (Härmälänranta,
      käännetyn ankkurin ympäri, `BRDC-SEED-001`), tulos `landmarks.osm.json`
      (nimi, koordinaatti, osm id, tagi)
- [ ] Kirjoitetut kuusi maamerkkiä **täsmäytetään** OSM-tulokseen nimellä/etäisyydellä
      (< 50 m): täsmäys korvaa koordinaatin OSM:n omalla, tarina säilyy kirjoitettuna
- [ ] Täsmäämättömät kirjoitetut maamerkit (jos sellaisia on) listataan tikettiin, ei
      hylätä hiljaa
- [ ] Muut OSM-löydöt joilla ei ole kirjoitettua tarinaa saavat geneerisen tarinapohjan
      (nimi + tyyppi), merkitään `authored: false`
- [ ] Yksikkötesti käyttää tallennettua kiinteää `landmarks.osm.json`-fixturea (ei
      verkkokutsua testiajossa)
- [ ] Tulos on `HexSeed.landmark`in syöte (`BRDC-LANDMARK-001`)

## Ei tässä

- Verkkokutsu ajossa — vain build-ajan skripti, tulos on tiedosto
- Maamerkin kortti tai kartalle piirto — `BRDC-LANDMARK-001`
