# BRDC-FX-003 — Syke vain sille, mikä on vaarassa

| | |
|---|---|
| **Alue** | `features/territory/{TerritoryLayer,BuildingIconLayer}`, `features/map/`, `features/map/useAwakening` |
| **Vaihe** | Läpileikkaava — uusi grafiikka |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ART-006, BRDC-PERF-003 (`feature-state` vaatii id:t) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-28: animaatiot *"vain erikoissoluille"* |

## 🔴 RED

- `claude.md` §13 sanoo *"Contested cells pulse"*, mutta kiistelty solu on nyt staattinen
  katkoviiva (`TerritoryLayer.ts:240-252`). Rapautumisikkunassa oleva solu ei myöskään syki
- Sigil- ja Worldseed-speksit animoivat jokaisen solun ja rakennuksen erikseen (`sigPulse`,
  `sigBob`, `wsPulse`, `wsBob`, `wsFlow`). MapLibren tasolla jatkuva animaatio pakottaa
  piirtämään **koko kartan** joka kuvalla, ja se kuluttaa akkua (`useMap.ts`: *"Battery: no
  continuous repaint"*)
- Silmukan sulkeminen luo kaksi DOM-solmua ja ajastimen jokaista valloitettua solua kohden
  (`useAwakening.ts:30-48, 69-80`). Iso lenkki tarkoittaa satoja solmuja

Huom: `BRDC-CLAIM-017`:n jälkeen seikkailutilan rival-solu siirtyy ensimmäisellä
kosketuksella, joten kiistelty tila syntyy enää Hearthin tai Fortressin piirityksessä.
Sykkeen pääkäyttö on **rapautuminen**.

## 🟢 GREEN

- [ ] Yksi rAF-silmukka, noin 10 fps, kutsuu `setPaintProperty(…'line-opacity')`
      suodatetuille kiistelty- ja rapautumisikkunatasoille. Mallina `useAwakening.ts:109-118`
      ja `StandingFlash.ts:81-88`
- [ ] Silmukka käy vain, kun tällaisia soluja on näkyvissä, ja pysähtyy kun `document.hidden`,
      `prefers-reduced-motion` tai Daylight-tila
- [ ] Fokussolun (valittu tai jalkojen alla) rakennus kelluu yhtenä DOM-`Marker`ina:
      transform-animaatio, leivottu kuva. Symbolitasolta sama rakennus piilotetaan
      `feature-state`lla, ei `setFilter`illä
- [ ] Muut rakennukset ovat staattisia. Kartalla ei ole solukohtaisia CSS- tai SVG-animaatioita
- [ ] `useAwakening`in DOM-solmut rajattu noin 40:een viewportissa
- [ ] E2e: kun näkyvissä ei ole erikoissoluja, kartta ei piirrä jatkuvasti uudelleen
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä, `pnpm e2e` vihreä

## Todennus

_Kirjataan toteutuksen jälkeen._

## Ei tässä

- Yhteinen kellunta kaikille rakennuksille (Infinite valitsi 2026-09-28: vain fokussolu)
- Claim burst, moments ja muut hetkelliset efektit (`BRDC-FX-001`, `BRDC-FX-002`)
