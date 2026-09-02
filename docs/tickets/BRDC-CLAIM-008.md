# BRDC-CLAIM-008 — Vallatun heksan paljastus tuntuu lahjapaketin avaamiselta

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-006 (awakening-ripple), BRDC-CLAIM-007 |
| **Status** | `done` (v0.5.22), kenttätodennus `[~]` |
| **Valmius** | 90 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Infinite: *"haluan että uuden heksan saaminen tuntuu kuin lahjapaketin avaaminen"* —
tarkennus: *"joka kerta kun vallotat uuden heksan alueeseesi."*

Lenkin sulkeminen antaa jo porrastetun kultavälähdyksen per solu (`useAwakening` +
`AwakeningLayer`), "+10 timber" -nousun (`flyGains`), ja koko ruudun mandala-
yhteenvedon (`ClaimBurst`). Silti se ei tunnu paketin avaamiselta:

1. **Mitään ei ole piilossa.** Omistuksen violetti täyttö maalataan heti alle — kulta
   on koriste jo tehdyn päälle, ei "ennen"-tilaa jota paljastaa.
2. **Käärepaperi ei lähde pois.** Kulta haihtuu paikallaan, ei repeä eikä purkaudu ulos.
3. **Sisältö ei paljastu.** Uusi maa ja saalis ovat jo valmiiksi näkyvissä.

## 🟢 GREEN

- [x] **Kansi, ei välähdys.** `AwakeningLayer.ts`: `opacityFor` → `curve()` +
      `WRAP_ALPHA_STOPS` (fill: 0.9 kun `progress - delay <= 0`, 0 kohdassa 0.35) ja
      `TEAR_ALPHA_STOPS` (line: 0.3 → 1 leimahdus → 0). Uusi `clearAwakening(map)` on
      lepotila, koska `setAwakeningProgress(map, 0)` tarkoittaa nyt "yhä käärepaperissa".
      `AWAKENING_MS` 2000 → 2400.
- [x] **Per-heksan pyhä geometria purkautuu.** `useAwakening.ts`: `SIGIL_SVG`
      (kolme sisäkkäistä heksaa, `hexPts()` = `HexMandala`n sääntö, stroke, ei fill),
      `spawnSigil(map, h3, reduced)` projisoi keskipisteen ja lisää `.gift-sigil`-divin;
      `gift-reveal.css` piirtää `stroke-dasharray`lla ja purkaa ulos (`scale(0.35→1.6)` +
      fade). Porrastus `setTimeout(spawn, delay × AWAKENING_MS)` — `delay` luetaan
      `awakeningFeatures(cells)`in propertyistä.
- [x] **`claimed` ja `taken` molemmat.** `awakeningReveal` (muuttumaton) suodattaa jo
      `claimed`/`taken`; `reinforced`-vain-lenkki palauttaa `null` eikä laukaise mitään.
- [x] **`prefers-reduced-motion: reduce`** → `.gift-sigil--still` (ilmestyy, häipyy,
      ei liiku), `clearAwakening(map)`, ei rAF-silmukkaa. `flyGains` on jo `--still`.
- [x] **`ClaimBurst` ja `flyGains` säilyvät** — kumpaakaan ei kosketa.
- [x] **Kuria (§12):** inline-SVG merkkijono, ei kirjastoa, ei rasteria. Yksi avaus per
      lenkin sulku — luonnostaan rajattu, ei kattoa.
- [x] Testit `awakening.test.ts` (+3): stagger-ikkuna `[0, AWAKENING_MS]` eikä
      yhtäaikainen · `WRAP_ALPHA_STOPS` ei-kasvava, peitetty ≥ 0.8, avattu = 0 ·
      `TEAR_ALPHA_STOPS` huippu 1, loppu 0. Vanhat ripple-testit vihreät. 904 yht.
- [~] Kenttätodennus: avauksen tuntuma `pnpm dev`-simulaatiossa ja oikealla puhelimella —
      seuraavalla testikierroksella. Koodi, tyypit, testit ja build vihreät.

## Toteutus

**Ei uutta pelisääntöä, ei uutta layeria, ei uutta lähdettä.** Olemassa oleva
awakening-järjestelmä ajaa yhtä animoitua lukua (`progress` 0→2) per valtaus, ja
`awakening.ts` antaa per-solu `delay`n (0–1, väreily keskeltä). Muutetaan mitä luku
*tekee*, ja lisätään käärepaperi.

- `AwakeningLayer.ts` — `opacityFor` korvataan peitä→paljasta-käyrillä (fill: kääre
  auki; line: repeämän leimahdus). Käyrän portaat jaettu vienticonsteina testiä varten.
  `AWAKENING_MS` 2000 → 2400.
- `useAwakening.ts` — `flyGains`n rinnalle `unwrapSigils(map, features)`: lukee `delay`n
  suoraan `awakeningFeatures(cells)`in propertyistä, projisoi keskipisteet, spawnaa
  `.gift-sigil`-divit (kaava kuten `flyGains`: `animationend` + `setTimeout`-poisto).
  Reduced-motion → `.gift-sigil--still`.
- `apps/game/src/features/map/gift-reveal.css` — uusi, pieni: `.gift-sigil`,
  `.gift-sigil--still`, `@keyframes gift-unwrap` + `gift-unwrap-still`.
- `awakening.test.ts` — laajennus yllä olevalla.

## Ei tässä

- Passiivinen viereiskasvu (`growInto`, dwell-vetoinen) ei animoidu — se ei ole
  "vallotat", ja kasvutapahtuma-kanavaa ei ole. Jatkotiketti jos halutaan.
- `ClaimBurst`n korvaaminen / keventäminen — Infinite piti sen ennallaan (2026-09-02).
- Ääni/värinä avaukselle — `BRDC-CLAIM-007` hoitaa palautteen, ei tuplata.
