# BRDC-TRADE-001 — Taverna: kulta kulttuuriksi, jotta monumentti nousee

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-BUILD-001, BRDC-CITY-002 |
| **Status** | `done` — 2026-10-14 (v0.11.8) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Lisätään lähelle seikkailun aloituspistettä taverna, missä voi vaihtaa rahaa
kulttuuriin, jotta saa rakennettua monumentteja."*

Kulttuuri on yksi yhdeksästä resurssista, ja sitä tuottaa käytännössä vain monumentti —
jonka rakentaminen vaatii kulttuuria. Umpisolmu: pelaaja voi olla täynnä kultaa eikä
pääse koskaan aloittamaan kulttuurihaaraa.

Taverna on solmun avain, ja se on pieni: yksi paikka, yksi vaihtosuunta, yksi kurssi.

## 🟢 GREEN

- [x] ~~Taverna paikkana `data/`ssa~~ → **Tavernan oma heksa**: tiketin jälkeen Taverna tuli
      rakennettavaksi Työksi (BRDC-TAVERN-001), joten vaihto tehdään omalla Tavernalla seisten.
      Kiinteää paikkaa patsaan luona ei tarvita
- [x] **Vaihto kulta → kulttuuri** puhtaana funktiona `packages/core`ssa, kurssi
      `constants.ts`:ssä. Yksisuuntainen: kulttuuria ei myydä takaisin kullaksi.
- [x] Kurssi on **huono ja näkyvissä ennen vahvistusta** (5 kultaa / 1 kulttuuri). Taverna on ovi, ei tulonlähde.
- [x] Vaihtoraja per päivä (20 kulttuuria / UTC-päivä), jotta kultavuori ei muutu monumenttivuoreksi yhdessä illassa.
- [x] Toimii vain **tavernan heksalla seisten** — sama sääntö kuin seikkailun etapeilla
      (`BRDC-QUEST-003`).
- [x] Vaihto kirjautuu History-lokiin (`trade`) ja avaa Oppaan *Resources*-sivun.
- [x] Testit: kurssi · päiväraja · pouch ei voi mennä negatiiviseksi · väärällä heksalla ei onnistu
      (`tavernTrade.test.ts` 4, `tavernTrade.repo.test.ts` 3; e2e `tavern-trade.spec.ts` 360 px)

## Ei tässä

- Yleinen kauppajärjestelmä ja muut resurssiparit — `BRDC-CITY-002`in kauppapaikka.
- Tavernan tarina, juomat, hahmot. Jos taverna ansaitsee kohtaamisia, ne tulevat
  `BRDC-EVENT-002`in kirjastosta, eivät tästä.

## Huomio 2026-10-14

Tiketin *umpisolmu* (kulttuuria vain monumentista, joka vaatii kulttuuria) oli jo auennut: perustamislahjassa on 10 kulttuuria ja Taverna tuottaa sitä ilman kulttuurihintaa. Vaihto rakennettiin silti Infiniten valinnasta (kysely 2026-10-13): kultarikas valtakunta pääsee kulttuuriin nopeammin.
