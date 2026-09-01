# BRDC-WAGER-JSON-003 — Voitetulla Wagerilla on hampaat: rappiomajakka

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Riippuvuudet** | BRDC-WAGER-JSON-001/002, BRDC-CLAIM-005 (decay) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Aavistuksen ehdotus 2026-09-02: *"Wagerilla ei ole syytä"* |

## 🔴 RED

Voitettu Wager "pehmentää rajaa, ei ota maata" (`the-wager` codex). Teemallisesti oikein —
jalat ottavat maan — mutta mekaanisesti ohut: miksi vaivautua? Async-kaksintaistelu tarvitsee
konkreettisen mutta ei-liian-vahvan palkinnon.

## 🟢 GREEN

- [ ] **Voitto istuttaa majakan** yhteen rivaalin **rajaruutuun** (ruutu joka on rivaalin
      omistuksessa ja koskettaa jotain sinun ruutuasi). `K.beacons` →
      `Record<H3Index, { plantedAt; expiresAt }>`.
- [ ] **Majakka nopeuttaa sen ruudun decayta** 48 tunnin ajan (esim. `DECAY_PER_DAY × 2`
      sillä ruudulla). Ei ota ruutua — vain pehmittää, jotta kävelysi sinne on
      todennäköisemmin ratkaiseva.
- [ ] **Vain yksi majakka per Wager-voitto**, ja majakka vanhenee itsestään. Ei kasata
      majakoita kymmentä rajalle.
- [ ] Kartalla: majakka = pieni pulssaava `--danger`-sigili rivaalin ruudulla (kontrasti
      omaan sykkivään contested-ruutuun).
- [ ] Loki: "Wager-voitto · majakka istutettu" — `describe.ts` `wager`-kind saa haaran.
- [ ] `rules/beacon.ts` puhdas: `beaconDecayFactor(h3, beacons, now): number`, testattu
      (aktiivinen 2×, vanhentunut 1×).
- [ ] `sweepDecay` / `projectCell` kertoo decayn tällä faktorilla.

## Ei tässä

- Majakka joka ottaa maata — se rikkoisi "jalat ottavat" -periaatteen.
- Hyökkäysmajakat omalle maalle (puolustusbonus) — eri idea, oma tikettinsä.
- Majakan siirto / poisto käsin — vanhenee itsestään, se riittää.
