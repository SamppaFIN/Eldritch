# BRDC-CLAIM-012 — Perustamiskierros: kamera kävelee Hearthin kuusi naapuria

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S |
| **Riippuvuudet** | BRDC-CLAIM-011, BRDC-HEARTH-001 |
| **Status** | `done` (v0.5.26) |
| **Valmius** | 100 % |
| **Lähde** | Infinite 2026-09-03: *"6 heksan esittelykierros ei aktivoidu"* → valinta: *"kameran kierros heksojen yli"* |

## 🔴 RED

Uusi peli antaa pelaajalle Hearth-solun ja renkaan kuusi solua sen ympäriltä, kaikki
vallattuina ennen ensimmäistä askelta (`claimHearth`). Mikään ei kiinnitä niihin
huomiota — rengas vain *on siinä*. CLAIM-008:n herätys-ripple (kansi nousee, sigili
purkautuu) oli ainoa "tässä tapahtui jotain" -ele, ja se on kytketty vain lenkin
sulkeutumiseen (`territory.lastClaim`), joka on CLAIM-009:stä lähtien oletuksena pois.

Infinite ei halunnut ripplen palautusta vaan **kameran kierroksen**: kamera lentää ulos
ja pysähtyy jokaisen renkaan heksan kohdalle vuorollaan, sitten asettuu takaisin
pelaajaan. Se on koko avaus joka sanoo "tämä on sinun" ilman riviä tutoriaalitekstiä.

## 🟢 GREEN

- [x] **`useHearthTour(map, ready, home)`** (`features/map/useHearthTour.ts`): kun
      `home` (Keep-solu, sama kuin Hearth-solu) tulee ei-nulliksi, kamera `flyTo`:aa
      jokaiseen `neighboursOf(home)`-soluun (`cellCentre`) zoomilla 17, ~0,9 s hyppy +
      ~0,65 s pysähdys, sitten `flyTo` takaisin Hearthiin `ZOOM_WALKING`illa.
- [x] **Vain perustamissessiossa.** `load('hearth')`-merkki on olemassa ja alle 2 min
      vanha → kyseessä on juuri perustettu Hearth, ei myöhempi boot.
- [x] **Vain kerran.** `localStorage['es3:hearth-tour']`-lippu; täysi reset (`clearAll`,
      `es3:*`) nollaa sen, joten aito uusi peli saa kierroksen uudelleen.
- [x] **Ei jää loukuksi.** Kartan raahaus (`map.once('dragstart')`) keskeyttää ja
      asettaa kameran takaisin pelaajaan.
- [x] **`prefers-reduced-motion`:** ei kiertoa — yksi `easeTo` Hearthiin, kesto 0.
- [x] **Ei tappele seurantakameran kanssa.** `useHearthTour` palauttaa `touring`n;
      `MapCanvas`n fix-per-fix `easeTo({ center: player })` on portitettu
      `follow && !touring`illa, ja jatkuu kun kierros loppuu.
- [x] **e2e** `hearth-tour.spec.ts` (2 × mobile-360 + desktop): kamera zoomaa yli 16,6:n
      ja ajautuu >20 m Hearthista, päätyy takaisin pelaajaan ~zoom 16:een; reload ei
      toista kierrosta.
- [x] `pnpm test` (934) · `pnpm typecheck` · `pnpm lint:lines` · `pnpm build` vihreät.

## Toteutus

Yksi hook, kolme riviä `MapCanvas`iin (import, kutsu, `&& !touring` seurantaefektiin +
`touring` deps-listaan). `MapCanvas` on 399 riviä — hook on omassa tiedostossaan siksikin.

## Ei tässä

- Herätys-ripple/sigilit kierroksen aikana — Infinite valitsi pelkän kameran, ei
  *"molemmat"*. Ripplen palautus askel-/Hearth-valtaukseen on oma asiansa.
- Tutoriaalitekstit heksojen kohdalla — `BRDC-CLAIM-010` (tutoriaalimoduuli).
- Keep vieraassa paikassa uudella pelillä (Infiniten toinen havainto samassa viestissä):
  puhtaalla resetillä `home` ja `castle` ovat sama solu tismalleen Hearth-kohdassa
  (todennettu e2e:llä). Vika on jossain ei-puhtaassa polussa — odottaa Infiniten
  tarkkoja toistoaskeleita.
