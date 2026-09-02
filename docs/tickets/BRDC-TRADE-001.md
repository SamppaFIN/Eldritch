# BRDC-TRADE-001 — Taverna: kulta kulttuuriksi, jotta monumentti nousee

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-BUILD-001, BRDC-CITY-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Lisätään lähelle seikkailun aloituspistettä taverna, missä voi vaihtaa rahaa
kulttuuriin, jotta saa rakennettua monumentteja."*

Kulttuuri on yksi yhdeksästä resurssista, ja sitä tuottaa käytännössä vain monumentti —
jonka rakentaminen vaatii kulttuuria. Umpisolmu: pelaaja voi olla täynnä kultaa eikä
pääse koskaan aloittamaan kulttuurihaaraa.

Taverna on solmun avain, ja se on pieni: yksi paikka, yksi vaihtosuunta, yksi kurssi.

## 🟢 GREEN

- [ ] **Taverna paikkana `data/`ssa**, kävelymatkan päässä patsaasta (`questSites.ts`:n
      `statue`) — se on paikka johon pelaaja jo menee.
- [ ] **Vaihto kulta → kulttuuri** puhtaana funktiona `packages/core`ssa, kurssi
      `constants.ts`:ssä. Yksisuuntainen: kulttuuria ei myydä takaisin kullaksi.
- [ ] Kurssi on **huono ja näkyvissä ennen vahvistusta**. Taverna on ovi, ei tulonlähde.
- [ ] Vaihtoraja per päivä, jotta kultavuori ei muutu monumenttivuoreksi yhdessä illassa.
- [ ] Toimii vain **tavernan heksalla seisten** — sama sääntö kuin seikkailun etapeilla
      (`BRDC-QUEST-003`).
- [ ] Vaihto kirjautuu History-lokiin ja avaa Guide-sivun kulttuurista.
- [ ] Testit: kurssi · päiväraja · pouch ei voi mennä negatiiviseksi · väärällä heksalla ei onnistu.

## Ei tässä

- Yleinen kauppajärjestelmä ja muut resurssiparit — `BRDC-CITY-002`in kauppapaikka.
- Tavernan tarina, juomat, hahmot. Jos taverna ansaitsee kohtaamisia, ne tulevat
  `BRDC-EVENT-002`in kirjastosta, eivät tästä.
