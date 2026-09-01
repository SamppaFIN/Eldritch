# BRDC-RAID-001 — Partio: kevyt strateginen kerros ilman lautapeliä

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio (EI ennen kuin BRDC-MOBILE-001 ulkolenkki on tehty) |
| **Effort** | M (per-ruutu-tila + per-tunti-tick, yksi yksikkötyyppi) |
| **Riippuvuudet** | BRDC-MOBILE-001 (kävelyydin todistettu ulkona), BRDC-BUILD-002 (fortress), BRDC-CLAIM-005 (siege) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-02: *"strateginen sotiminen.. armeijoiden liikuttelu"* — rajattu versio |

## 🔴 RED

Konflikti on nyt joko kävele-vihollisruudun-läpi (siege) tai async Wager. Kumpikin vaatii
jalat. Infinite haluaa "siirrä nappula kartalla" -tunteen. Täysi RTS (yksiköt, polut,
pinot, taisteluratkaisu) on **oma pelinsä liimattuna päälle** — GPS-kerros ON
liikkumissysteemi. Tämä on halpa versio joka antaa tunteen rikkomatta sitä.

## 🟢 GREEN

- [ ] **Partio = token** jonka asetat omalle ruudulle (vaatii fortressin alueella).
      Yksi yksikkötyyppi. `K.raids` → `Record<H3Index, { placedAt; upkeepPaidUntil }>`.
- [ ] **Ei liikkumista.** Partio projisoi hyökkäysvoimaa **viereisiin vihollisruutuihin**
      per tunti — hidas, katollinen (esim. −10 strength/tunti/partio, max yksi partio per
      kohde). Sama `resolveCapture`-matikka, vain lähde on token eikä kävelijä.
- [ ] **Ylläpito.** Partio syö ruokaa + rautaa per tunti pouchista. Kun ei varaa → partio
      hajoaa. Tekee laajenemisesta valinnan, ei ilmaista.
- [ ] **Ei instant-flippiä.** Vihollisruutu vaihtaa omistajaa vasta strengthin nollassa,
      kuten siege nyt (§11). Partio *pehmittää*, jalat *ottavat* — tai toinen partio.
- [ ] Kartalla: partio = pieni stroke-sigili (§12) omalla ruudulla, viiva kohteeseen kun
      se hyökkää.
- [ ] Kaikki matikka `packages/core`:ssa puhtaana (`rules/raid.ts`) + Vitest: ylläpito,
      projektio, katto, hajoaminen.

## Ei tässä

- Useita yksikkötyyppejä, formaatiot, huoltolinjat — eri peli.
- Reaaliaikainen PvP-taistelu — async Wager + siege riittävät.
- Partion liikuttelu ruudusta toiseen — jos halutaan, se on oma tikettinsä; v1 = staattinen
  projektio naapureihin.
- **Ei aloiteta ennen kuin kävelyydin on kävelty ulkona** (BRDC-MOBILE-001). Syvyyden
  rakentaminen todistamattoman ytimen päälle on v2:n virhe.
