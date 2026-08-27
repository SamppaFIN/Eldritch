# BRDC-VIGIL-001 — Vigil: raja pysyy totena kun puhelin on taskussa

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-GROW-001, BRDC-DWELL-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Ulkotesti 2026-08-27 · Infiniten havainto |

## 🔴 RED

Ulkotestissä puhelin oli taskussa ja selain avattiin silloin tällöin. Koordinaatteja
tuli — ja raja oli silti täysin väärä. Kolme erillistä syytä, kaikki vaikenevat:

1. **Selain jäädyttää taustalle jääneen sivun.** Jäädytetty sivu ei saa yhtään
   GPS-fixiä. Tallennukseen jää kourallinen hetkiä joina sattui katsomaan ruutua.
2. **Kasvu jäi jumiin ensimmäisen katkon jälkeen.** `growInto` vaatii vierekkäisyyden
   omaan alueeseen. Katkon jälkeen pelaaja on satoja metrejä omastaan — jokainen askel
   ohitettiin `not-adjacent`-syyllä, eikä kävely enää koskaan valtaa mitään.
3. **Katko piirrettiin ley-linena.** Kaksi fixiä 12 minuutin päässä toisistaan
   yhdistettiin samalla kirkkaalla viivalla kuin oikeasti kävelty maa — raja kulki
   katujen läpi joilla kukaan ei käynyt, eikä mikään kertonut mihin osaan uskoa.

Lisäksi `accrueDwell` hyvitti 20 minuutin katkon kokonaan sille ruudulle jossa ruutu
sammui — bussipysäkki olisi saanut Ankkurikiven.

## 🟢 GREEN

- [x] `OBSERVATION_GAP_MS = 2 min` — nimetty raja sille että peli lakkasi katsomasta
- [x] Katkon jälkeinen fix saa siementää: `growInto(..., requireAdjacency = false)`
- [x] Katkoton hyppy torjutaan yhä — vierekkäisyysvahti säilyy ennallaan
- [x] Katko piirtyy harmaana katkoviivana, ei ley-linena; hehku suodatetaan pois
- [x] Liikkuva katko hyvittää dwelliä enintään `OBSERVATION_GAP_MS`; paikallaan
      pysyvä yhä `MAX_DWELL_GAP_MS`
- [x] `TrailResult.unobservedMs` kertoo paljonko jäi näkemättä
- [x] `useKeepAlive`: Wake Lock + hiljainen äänisilmukka, käynnistys kosketuksesta
- [x] HUD:n Vigil-kytkin sanoo kumpi puolisko pitää — ja paljonko on jäänyt näkemättä
- [x] Regressiotesti `packages/core/src/data/pocket.test.ts` toistaa koko kävelyn

## Toteutus

Selain antaa tähän kaksi vipua, ei kolmatta:

| Vipu | Mitä pitää | Rajoite |
|---|---|---|
| **Wake Lock** | Näyttö päällä → sivu pysyy edustalla | Hyödytön taskussa |
| **Ääni** | Soittava sivu on vapautettu jäädytyksestä ja ajastinkuristuksesta | Androidilla toimii, iOS:llä ei juuri |

Äänisilmukka on 1 s WAV (220 Hz, ~-60 dB, `volume = 0.02`) — ei täysi hiljaisuus, koska
hiljainen raita luetaan herkemmin kuulumattomaksi. Toisto on aloitettava
käyttäjäeleestä, siksi `new Audio(...)` ja `play()` ovat `toggle`-callbackin sisällä
eivät efektissä.

**Kumpikaan ei ole foreground service.** Ruutu sammuneena tapahtuva seuranta, jonka
käyttöjärjestelmä oikeasti takaa, on Vaihe 5 (Capacitor) — ja tämä tiketti on syy siihen
että se vaihe on olemassa.

## Ei tässä

- Foreground service · Vaihe 5
- Katkon paikkaus interpoloimalla — se olisi juuri se valhe joka tässä korjattiin
