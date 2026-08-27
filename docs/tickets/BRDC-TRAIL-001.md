# BRDC-TRAIL-001 — Sijainnin seuranta ja jäljen tallennus

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-GEO-001, BRDC-MOCK-001, BRDC-MAP-001 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 95 % |

## 🔴 RED

Pelaajalla ei ole jälkeä. Kävely ei tuota mitään, eikä mikään säily reloadin yli.

## 🟢 GREEN

- [x] `useGeolocation`-hookki käyttää `watchPosition`ia `enableHighAccuracy: true`
- [x] Jokainen piste kulkee `acceptPoint`-suodattimen läpi (BRDC-GEO-001)
- [x] Pisteet lähetetään **batchina 10 s välein**, ei yksitellen
- [x] "Begin the Awakening" käynnistää runin (`startRun`)
- [x] Jälki **säilyy sivun uudelleenlatauksen yli** ja jatkuu samasta runista
- [x] GPS-lupa evätty → selkeä viesti ja ohje, ei hiljaista kaatumista
- [x] Sijaintia ei saatavilla (sisätila) → HUD kertoo sen, peli ei jäädy
- [x] **Toimii lentokonetilassa** — GPS toimii ilman dataa

## Toteutus

```ts
// apps/game/src/features/trail/useGeolocation.ts
// - watchPosition, enableHighAccuracy
// - acceptPoint()-suodatus ennen puskuriin lisäystä
// - puskuri tyhjennetään repository.submitTrail()-kutsulla 10 s välein
// - hylätyt pisteet + syy tilaan, HUDia varten
```

**Miksi batch:** yksi kirjoitus per GPS-tick tappaa akun ja täyttää IndexedDB:n.
10 s batch on sama luku, joka Vaiheessa 3 menee `submit_trail_batch`-RPC:lle —
rajapinta ei muutu, vain toteutus.

**Akku:** `MIN_POINT_INTERVAL_MS` 5 s + `CONSOLIDATE_RADIUS_M` 5 m tarkoittaa, että
paikallaan seisominen ei tuota pisteitä lainkaan. Tämä on tarkoituksellista.

**Runin elinkaari:** yksi run = yksi kävelylenkki. Se ei pääty automaattisesti ajan
kuluessa — pelaaja lopettaa sen tai lenkki sulkeutuu (BRDC-CLAIM-001).

## Testit

- [~] Playwright overridaa sijainnin ja jälki piirtyy. **Syöte on synteettinen kävely,
      ei `square.json`** — fixture kytketään käyttöön BRDC-CLAIM-001:ssä, jossa sitä
      oikeasti tarvitaan
- [x] Reload kesken runin → jälki ja run palautuvat
- [x] Lupa evätty → virheviesti näkyy, ei konsolivirhettä
- [x] Hylätty piste (accuracy 80) ei päädy jälkeen
- [x] Eräajo todennettu ulkoapäin: ~45 s kävelyä kasvattaa jälkeä enintään 6 kertaa,
      ei kerran per fix (`trail-detail.spec.ts`)
- [x] 360 px viewport ajetaan ensin

> **Lisäksi toteutettu / muutokset:**
> - `usePositionSource` yhdistää laitteen ja (vain dev-buildissa) WASD-simulaation
>   saman muodon taakse. Simulaattori ei päädy tuotantobundleen — todennettu grepillä.
> - **Reload jatkaa suoraan kartalta.** Puhelin lataa PWA:n uudelleen aina kun se haluaa
>   muistia takaisin, ja mieluiten silloin kun ruutu on ollut taskussa kymmenen minuuttia
>   — eli juuri kesken kävelyn. Aloitusnäytölle palaaminen jättäisi pelaajan kesken lenkin
>   napin taakse jonka hän on jo painanut. `Withdraw` on tarkoituksellinen ja päättää session.
> - **`interval`-hylkäyksiä ei näytetä HUDissa.** Laite antaa fixin noin sekunnin välein,
>   `MIN_POINT_INTERVAL_MS` on viisi — suurin osa hylätään joka erässä. Se on tarkoitettu
>   harvennus (yksi piste / ~7 m), ei vika, ja HUDiin jäisi pysyvä valitus jolle pelaaja
>   ei voi mitään. Näytetään vain `accuracy`, `speed` ja `consolidated`.
> - Tyhjennys `pagehide`ssä, ei `beforeunload`issa: mobiiliselain jäädyttää taustavälilehden
>   laukaisematta `beforeunload`ia, ja jokainen viestiin vastaaminen maksaisi 10 s kävelyä.
>
> **Bugi, jonka e2e löysi:** `repository as GameRepository` valehteli — `useTrail` kutsui
> `getActiveRun`ia nullille ensimmäisellä renderillä. Cast korvattu rehellisellä
> `GameRepository | null` -tyypillä.

## Ei kuulu tähän tikettiin

Jäljen visuaalinen hehku (BRDC-TRAIL-002). Lenkin sulkeutuminen (BRDC-CLAIM-001).
Taustaseuranta ruutu sammuneena — se vaatii foreground servicen (Vaihe 5).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 5 · `files/CLAUDE.md` §Constants, §Testing
