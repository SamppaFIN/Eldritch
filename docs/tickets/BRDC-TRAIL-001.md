# BRDC-TRAIL-001 — Sijainnin seuranta ja jäljen tallennus

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-GEO-001, BRDC-MOCK-001, BRDC-MAP-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Pelaajalla ei ole jälkeä. Kävely ei tuota mitään, eikä mikään säily reloadin yli.

## 🟢 GREEN

- [ ] `useGeolocation`-hookki käyttää `watchPosition`ia `enableHighAccuracy: true`
- [ ] Jokainen piste kulkee `acceptPoint`-suodattimen läpi (BRDC-GEO-001)
- [ ] Pisteet lähetetään **batchina 10 s välein**, ei yksitellen
- [ ] "Begin the Awakening" käynnistää runin (`startRun`)
- [ ] Jälki **säilyy sivun uudelleenlatauksen yli** ja jatkuu samasta runista
- [ ] GPS-lupa evätty → selkeä viesti ja ohje, ei hiljaista kaatumista
- [ ] Sijaintia ei saatavilla (sisätila) → HUD kertoo sen, peli ei jäädy
- [ ] **Toimii lentokonetilassa** — GPS toimii ilman dataa

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

- [ ] Playwright overridaa sijainnin CDP:llä ja syöttää `square.json`-fixturen
      → jälki piirtyy
- [ ] Reload kesken runin → jälki ja run palautuvat
- [ ] Lupa evätty → virheviesti näkyy, ei konsolivirhettä
- [ ] Hylätty piste (accuracy 80) ei päädy jälkeen
- [ ] Batch: 12 pistettä 60 s aikana → enintään 6 `submitTrail`-kutsua
- [ ] 360 px viewport ajetaan ensin

## Ei kuulu tähän tikettiin

Jäljen visuaalinen hehku (BRDC-TRAIL-002). Lenkin sulkeutuminen (BRDC-CLAIM-001).
Taustaseuranta ruutu sammuneena — se vaatii foreground servicen (Vaihe 5).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 5 · `files/CLAUDE.md` §Constants, §Testing
