# BRDC-FX-003 — Syke vain sille, mikä on vaarassa

| | |
|---|---|
| **Alue** | `features/territory/{TerritoryLayer,BuildingIconLayer}`, `features/map/`, `features/map/useAwakening` |
| **Vaihe** | Läpileikkaava — uusi grafiikka |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ART-006, BRDC-PERF-003 (`feature-state` vaatii id:t) |
| **Status** | `[~]` — toteutettu ja todennettu 2026-09-29; kellunta vain jalkojen alla olevalle solulle, uusi grafiikka odottaa ART-006:ta |
| **Valmius** | 85 % |
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

- [x] Yksi silmukka (`features/map/useSpecialPulse.ts`), noin 10 fps, liikuttaa
      `line-opacity`a kahdella tasolla: kiistelty (`cells-contested`, katkoviiva) ja uusi
      `cells-fading` (oma violetti viiva solulle, joka on HUD:n 48 tunnin rapautumisikkunassa;
      sama sääntö kuin HUD:n "fading", Hearth ja Fortressin suoja pois). Käyrä 0,3–0,9,
      jakso 1,6 s (`pulseOpacity`, testattu)
- [x] Silmukka käy vain, kun `queryRenderedFeatures` löytää näiltä tasoilta jotain ruudulta
      (`moveend`, `idle`, solujen muutos). Se pysähtyy ja palauttaa lepo-opasiteetin, kun
      `document.hidden`, `prefers-reduced-motion` tai `[data-daylight]`
- [~] Kellunta: yksi DOM-`Marker` (`features/map/useFocusFloat.ts`), rakennuksen oma sprite,
      pelkkä transform-animaatio (5 s, reduced motion → ei animaatiota). Symbolitasolta
      sama rakennus piilotetaan `feature-state`lla (`icon-opacity`). **Vain jalkojen alla
      oleva solu** — valittu solu ei ole `MapCanvas`in tiedossa ilman `MapView`n muutosta
      (399 riviä). Kuva on nykyinen sprite, kunnes ART-006 tuo uudet
- [x] Muut rakennukset ovat staattisia; kartalla ei ole solukohtaisia animaatioita
- [x] `useAwakening`in DOM-efektit (lentävät "+10" ja sigilit) rajattu 40:een, vain
      näkyvissä oleville soluille (`AWAKENING_DOM_MAX`)
- [x] E2e `fx-pulse.spec.ts` (molemmat projektit): tavallisella maalla alle 5 `render`iä
      3 s:ssa; rapautuvalla maalla yli 10; reduced motion → alle 5
- [x] `pnpm test` (1 816) · `typecheck` · `lint:lines`; `map.spec` 26/26, `sigil:31` punainen
      jo ennestään

## Ei tässä

- Yhteinen kellunta kaikille rakennuksille (Infinite valitsi 2026-09-28: vain fokussolu)
- Claim burst, moments ja muut hetkelliset efektit (`BRDC-FX-001`, `BRDC-FX-002`)
