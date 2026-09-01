# BRDC-BLIGHT-001 — Rappio näkyväksi: leviävä turmelus reunoilta

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S–M (render + copy -kerros olemassa olevan decayn päälle) |
| **Riippuvuudet** | BRDC-CLAIM-005 (decay/sweep), BRDC-MAP-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-02: *"esim hirviöt"* → rappio hirviönä; Aavistuksen ehdotus |

## 🔴 RED

Decay on taulukkomekaniikka: ruudun `strength` laskee, HUD sanoo "The Void reclaims N",
ruutu katoaa. Se toimii mutta se ei **tunnu** miltään — ei vihollista jota vastaan
taistella, vain numero joka pienenee. Sama matikka voisi näkyä asiana.

## 🟢 GREEN

- [ ] **Blight = decay-tila renderöitynä.** Ruutu jonka `strength` on grace-ajan alle ja
      laskussa saa kartalla asteittaisen tumman tahran (fill-opacity nousee kun strength
      lähenee nollaa). Ei uutta tilaa storeen — johdettu `projectCell`in tuloksesta.
- [ ] **Turmelus leviää reunalta.** Jos omistetun ruudun **naapuri on omistamaton JA**
      itse ruutu on jo blightissa, blight etenee visuaalisesti nopeammin (ei mekaanisesti —
      pelkkä render­painotus, jotta reuna näyttää murenevan sisäänpäin).
- [ ] **Kävely puhdistaa.** Blightatun ruudun vierailu (= `lastVisitedAt` päivittyy, kuten
      nyt) poistaa tahran. Ei uutta verbiä — olemassa oleva reinforcement.
- [ ] **HUD/loki copy:** "The Void reclaims" → "Turmelus vie N ruutua" + rivi "kävele ne
      ennen kuin ne mätänevät". `describe.ts` `reclaim`-kind pysyy, teksti vaihtuu.
- [ ] Puhdas `blightLevel(cell, now): 0..1` (`rules/decay.ts` tai `territoryFeatures.ts`),
      testattu: grace-ajan sisällä 0, nollastrengthissä 1.
- [ ] `prefers-reduced-motion`: tahra on staattinen, ei sykkivä.

## Ei tässä

- Oikeat liikkuvat hirviö-entiteetit kartalla — se on iso systeemi (spawn, AI, tila).
  Tämä on decayn *ilmiasu*, ei uusi olio.
- Blightin mekaaninen vaikutus (nopeampi strength-lasku reunalla) — vain visuaalinen v1;
  jos halutaan mekaaniseksi, se on `constants.ts`-muutos ja oma tarkastelunsa.
