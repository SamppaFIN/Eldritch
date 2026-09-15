# BRDC-SEED-004 — HexSeed: Härmälänrannan heksojen esiarvot

| | |
|---|---|
| **Alue** | uusi `packages/core/src/types/hexSeed.ts`, `packages/core/src/data/cellStore.ts` (lukupolku), `packages/core/src/data/MockRepository.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-SEED-001`, `BRDC-SEED-002`, `BRDC-SEED-003` |
| **Lähde** | Infinite 2026-09-16: *"mut ensin se heksojen esiarvot härmälänrantaan"* |

## 🔴 RED

Kolme edellistä tikettiä (kohdistus, maamerkit, jako) tuottavat kukin oman osansa dataa.
Mikään ei vielä kokoa niitä **yhdeksi heksakohtaiseksi esiarvoksi** jonka `CellStore` voi
lukea, eikä mikään päätä mitä tapahtuu kun pelaaja astuu Härmälänrannan heksalle
ensimmäistä kertaa — onko se tyhjä (nykyinen käytös) vai onko sillä jo maasto, mahdollinen
löytö, maamerkki ja mahdollinen seikkailusolmu valmiina?

## 🟢 GREEN

- [ ] `HexSeed { h3, terrain, confidence, resource?, landmark?, structure?, quest? }` —
      yksi tyyppi, kokoaa `SEED-002`/`SEED-003`:n tulokset per H3-solu
- [ ] Härmälänrannan alueelle (käännetyn ankkurin ympäri, säde dokumentin bbox:n mukaan)
      generoidaan `HexSeed`-taulukko build-ajassa; tallennetaan `packages/core/src/data/seed/harmala.json`
- [ ] `CellStore`in luku: kun solulla on `HexSeed` eikä sillä ole vielä pelaajadataa,
      maasto/löytö/maamerkki tulevat siemenestä `Cell`in oletusarvojen sijaan. Solu joka on
      jo pelaajan muokkaama (`BRDC-HEX-001`in historia) ei koskaan ylikirjoitu
- [ ] Testi: tunnettu Härmälänrannan H3-solu (esim. vahvistetun patsaan solu) lukee oikean
      maamerkin ja maaston ilman verkkokutsua
- [ ] Testi: alueen ulkopuolinen solu käyttäytyy täysin kuten ennen (regressio)
- [ ] `MockRepository` tarjoaa siemenen ilman IndexedDB-migraatiota — puhdas lisäys,
      ei olemassa olevan tallennuksen muutos
- [ ] Kenttäkoe: käynnistä peli Härmälänrannassa, kävele viidelle eri heksalle, jokainen
      näyttää oikean maaston ja vähintään yksi näyttää maamerkin ilman manuaalista asetusta

## Ei tässä

- Kortin ulkoasu (`BRDC-CARD-001`) — tämä tiketti tuo datan, ei UI:ta
- Muiden alueiden (koko Suomi) siemennys — tarkoituksella rajattu Härmälänrantaan ensin
