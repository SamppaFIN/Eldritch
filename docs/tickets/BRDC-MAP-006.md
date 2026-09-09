# BRDC-MAP-006 — Sivun lataus palauttaa kartan pelaajan luo

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-MAP-004 |
| **Status** | `done` — 2026-09-09 (v0.5.46) |
| **Valmius** | 100 % — portti vihreä, `map.spec.ts` 24/24; kenttätesti Infinitellä |
| **Lähde** | Infinite 2026-09-09: *"urgent fix.. on page refresh return map to players current location"* |

## 🔴 RED

Sivun lataamisen jälkeen kartta jää muualle kuin pelaajan kohdalle.

`useInitialPosition` kysyy avauskeskipisteen `getCurrentPosition`illa asetuksin
`{ enableHighAccuracy: true, timeout: 8_000, maximumAge: 0 }` (`useInitialPosition.ts:60`).
`maximumAge: 0` **kieltää selainta antamasta juuri saatua välimuistifixiä** — kylmällä
latauksella tarkka fix vie usein yli 8 s, timeout laukeaa, ja `centre` jää
`FALLBACK_CENTRE`ksi (`useInitialPosition.ts:12-15` — Pyynikin Poika, Tampere).
`MapView.tsx:216` odottaa `settled`iä, joten kartta avautuu vasta tämän jälkeen — ja
avautuu väärään paikkaan.

Kartan pitäisi korjata itsensä kun `watchPosition` tuo oikean fixin, mutta kaksi asiaa
estivät sen näkymästä korjauksena:

1. Seurantaefekti ajoi `map.easeTo({ center, duration: 900 })`, joka **panoroi
   lineaarisesti koko matkan**. Pitkällä matkalla zoomilla 16 se on 900 ms sokeaa
   vyörytystä, ei siirtymä.
2. `recenter()` ja `focusHere()` asettivat `following = true`, mikä ajoi seurantaefektin
   uudestaan — **kaksi kamera-animaatiota samasta fixistä kilpaili samasta kamerasta** ja
   lopputulos jäi sinne mihin häviäjä pysähtyi. Tämä näkyi `map.spec.ts`:n
   recenter-testin toistuvana välkkeenä mobile-360:llä.

## 🟢 GREEN

- [x] `useInitialPosition.ts:60` — `maximumAge: 0` → `60_000`. Tämä hook ei seuraa
      liikettä; se vastaa vain kysymykseen "mihin kamera avataan", ja minuutin vanha fix on
      ehdottomasti parempi kuin Tampere.
- [x] **`usePositionSource.ts`:n `maximumAge: 0` jää koskematta** — siellä se on oikein:
      vanha fix tulkittaisiin liikkeeksi ja piirtäisi ley-linjan jota kukaan ei kävellyt
      (tiedoston oma kommentti sanoo tämän).
- [x] `useCameraFollow` — session **ensimmäinen** oikea fix `flyTo`lla (`essential: true`,
      700 ms), sitä seuraavat `easeTo`lla kuten ennen. Ei zoomia mukaan: avauszoom on
      kutsujan (ensilataus avaa laveammin, `ZOOM_FIRST_LOOK`).
- [x] `centredOn`-ref lopettaa kilpailevat animaatiot: seurantaefekti ohittaa fixin, jonka
      `recenter`/`focusHere` juuri hoiti. Ref **nollataan** kun kamera ei ole meidän
      (`!following`) tai kun perustuskierros ajaa sitä (`touring`) — muuten paikallaan
      seisovan pelaajan seuraava, koordinaateiltaan sama fix ohitettaisiin eikä kamera
      palaisi kierroksen jälkeen.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (1015) + `pnpm build` vihreä.
- [x] `map.spec.ts` **24/24** molemmissa projekteissa (mobile-360 ja desktop).
- [x] Uusi case *"a reload brings the camera back to the player"*: `addInitScript` pakottaa
      `getCurrentPosition`in epäonnistumaan (juuri se timeout jonka RED kuvaa), fix
      asetetaan ~2 km päähän, sivu ladataan uudestaan, ja markkerin pitää palata ruudun
      keskelle alle 8 s:ssa.
- [x] Sivulöydös korjattu samalla: `panByHand`in solupaneelin siivous eriytettiin
      `closeCellSheet`iin ja tehtiin uudelleenyrittäväksi — se oli itse välkkyvä.

**Rehellisyys testin kattavuudesta:** ajoin kokeen, jossa `flyTo`-haara oli poistettu
käytöstä — **testi meni silti läpi**. Se siis lukitsee *sopimuksen* ("latauksen jälkeen
kamera on pelaajan kohdalla") muttei todista kumpaakaan korjausta. Varsinainen korjaus on
`maximumAge`, eikä sitä voi toistaa Playwrightissa: siellä `getCurrentPosition` ratkeaa
välittömästi eikä koskaan aikakatkaise. **Kenttätesti on tämän kohdan ainoa oikea todiste.**

- [ ] Kenttä: lataa sivu puhelimella kotona ja kaukana kotoa — kartta avautuu pelaajan
      kohdalle kummallakin kerralla, eikä Tampereelle. *(Infinite ajaa.)*

## Ei tässä

- Viimeisimmän sijainnin tallennus levylle avauskeskipisteeksi. Välimuistifix riittää; oma
  persistoitu "viimeksi nähty" olisi kolmas totuus sijainnista.
- `FALLBACK_CENTRE`in poistaminen — se on yhä oikea vastaus kun lupa on evätty.
