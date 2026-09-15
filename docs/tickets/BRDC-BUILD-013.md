# BRDC-BUILD-013 — Forge ja Watchtower

| | |
|---|---|
| **Alue** | `rules/build.ts`, `types/domain.ts`, `rules/capture.ts` (piiritys), `sim/siege.ts`, reveal |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-TERRAIN-005`, `BRDC-BUILD-012` (Linnoituksen mittaukset) |
| **Lähde** | `worldseed.ts` (`STRUCTURES`) |

## 🔴 RED

Worldseed nimeää kaksi rakennusta joita pelissä ei ole (`BuildingId`, `types/domain.ts:65-82`):

- **Forge** — hill tai settlement, +2 iron. *"Needs Toolmaking + adjacent iron."*
- **Watchtower** — hill tai plain. *"Reveals 2 rings. Slows rival siege by half."*

Watchtowerin *"slows rival siege by half"* on **piiritysääntö**, ja piiritys on juuri mitattu
(`BRDC-BUILD-012`: puolustettu Linnoitus kaatuu kävelyllä 5). Puolittaminen Linnoituksen päälle
voi tehdä siitä käytännössä valloittamattoman — mitataan ennen kuin kytketään.

## 🟢 GREEN

- [ ] `forge`: maasto, tuotto, Toolmaking-vaatimus, viereinen rauta (esiintymä tai maasto)
- [ ] `tower`: 2 renkaan paljastus olemassa olevalla reveal-mekaniikalla
- [ ] **Piirityksen puolitus mitattu `sim/siege.ts`:ssä** yksin ja Linnoituksen kanssa ennen
      käyttöönottoa; luvut tikettiin
- [ ] Kuvat `#bForge`, `#bTower` (`BRDC-RES-002`)
- [ ] Hinnat (päätös)

## Päätös Infiniteltä

- Kumuloituuko Watchtowerin puolitus Linnoituksen kanssa?
- Hinnat — dokumentti ei anna

## Ei tässä

- Muut Worldseedin rakennukset ovat jo pelissä (granary, sawmill, quarry, market)
