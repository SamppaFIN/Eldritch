# BRDC-ECON-007 — Ei tukirahoja: alkustash, Collect, todennettu saanti

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-005, BRDC-ECON-006 |
| **Status** | `done` — 2026-09-07 (v0.5.42); kenttätodennus `[~]` |
| **Valmius** | 95 % — koodi + testit + gate vihreä; kentällä todentamatta |
| **Lähde** | Infinite 2026-09-07: *"poistetaan kaikki tukirahat myös pelistä.. uusi seikkailu antaa pienen alkustashin, mikä voi rakentaa yhden rakennuksen.. on todettava, että pelaaja saa resursseja oikein, joka kerta kun löytää uuden ruudun ja joka tunti palkkion, collect napilla"* |

## 🔴 RED

Talous antaa yhä tukirahaa. `grantVersionGift` nostaa jokaisen resurssin lattiaan
(`createRepository.ts:69`), ja turvaverkko `giftIsOwed` täyttää tyhjän pussin uudestaan
aina kun Hearth on perustettu (`started && pouchEmpty`). BRDC-ECON-005 kavensi tämän
kertaan per peli, mutta lahja on yhä siellä ja se hämärtää tuotannon: pelaaja ei erota
ansaittua trickleä annetusta lattiasta.

Claim-saantoa (`CLAIM_YIELD` per tuottava solu) ei ole koskaan testattu suoraan — että
jokainen uusi ruutu maksaa, joka kerta. Ja tuntikertymä valuu pussiin näkymättä; ei
hetkeä jossa pelaaja *saa* palkkionsa.

## 🟢 GREEN

### Tukirahat pois
- [x] `grantVersionGift` poistettu (`packages/core/src/data/pouch.ts`, `data/index.ts`-export)
- [x] `createRepository.ts`: `GIFT_KEY`, `giftIsOwed`, lahjaportti ja turvaverkko poistettu.
      Tyhjä pussi + perustettu Hearth on nyt sallittu tila
- [x] `createRepository.test.ts` poistettu (koko tiedosto oli `giftIsOwed`)
- [x] `pouch.test.ts`: `grantVersionGift`-describe ja sen import poistettu
- [x] `grantAll` / `debugGrant` jää — vain `import.meta.env.DEV` (jo niin, `SettingsMenu.tsx:207`)

### Alkustash Hearthin perustuksessa
- [x] `STARTER_STASH = { stone: 60, culture: 10 } as const` — `rules/constants.ts`:ssä
      (§11 vakioiden koti). Tasan yksi Monument, joka on ainoa rakennus ilman tech- ja
      terrain-vaatimusta → ainoa jonka uusi pelaaja voi oikeasti nostaa
- [x] `MockRepository.setHome`: `grantBonus(store, owned, STARTER_STASH, now)` **kerran per
      peli JA vain tyhjään pussiin** — `K.starterGiven` + `bare`-tarkistus. Jälkimmäinen
      pitää ~15 repo-testin fixtuurit koskemattomina (ne esilataavat pussin)
- [x] Kehysrivi: `FirstLook.tsx` toinen rivi — *"The first stones are yours — raise something."*

### Todennettu saanti
- [x] `pouch.test.ts` → `describe('awardClaims — every new cell pays…')`: erä N solua →
      N × `CLAIM_YIELD`; barren = 0; sama solu maksaa toisenkin kerran; `reinforced` = 0
- [x] Uuden pelaajan tuntikertymä: **jo katettu** BRDC-ECON-005:n auditissa (1 fishery, ei
      bonuksia, settle +1 h ≡ `forecastRates.perHour`). Ei uutta testiä

### Collect-nappi
- [x] `ResourceState`: additiiviset `collectedAt?`, `poolAtCollect?` — ei schema-nostoa.
      **Sivukorjaus:** `settleResources` rakensi paluuolion jättäen tuntemattomat kentät
      pois → `...state`-levitys molempiin `return`-kohtaan, ettei Collect-merkki katoa
      joka settlessä
- [x] `collectPouch(store, owned, now)` → `{ delta, total, hours, at }`. Settle ensin;
      `delta = pool − poolAtCollect` clampattu ≥ 0; ei muuta poolia
- [x] `GameRepository.collect(now)` + `MockRepository`-delegoija
- [x] HUD: Collect-nappi **pussirivin sisällä** (`Hud.tsx`, `hud__value--pouch`), kompakti
      (~26 px, yli axe:n 24 px target-size-rajan) — kelluva overlay kokeiltiin ensin mutta
      se sieppasi klikkejä ja kasvatti HUD:n yli 30 % budjetin (`trail-detail.spec.ts:81`).
      Tunnit näkyvät painalluksen jälkeen `PouchGain`issa ("N h")
- [x] `usePouchPolling`: gain-koneisto pois kokonaan (`positiveDelta`, `PouchGain`-tyyppi,
      `LAST_KEY`, `first`/`prev` refit). **`WelcomeBack` poistettu** — "while you were away"
      -kortti oli juuri se automaattinen hetki jonka Collect korvaa. `usePouchPolling.test.ts`
      poistettu (testasi vain `positiveDelta`ia)
- [x] Migraatio: `?? now` / `?? state.pool` -fallbackit `collectPouch`issa **ovat** migraatio
      — ensimmäinen painallus vanhalla pussilla näyttää 0 ja leimaa merkin. Ei erillistä koodia

## Toteutus

Collect **ei ole talousmekaniikka** vaan tuntumamomentti (Infiniten valinta): trickle
kertyy pussiin kuten ennenkin, `settlePouch` koskematon. Collect vain lukee "paljonko on
tullut viime painalluksesta" ja soittaa saman `PouchGain`-animaation. `poolAtCollect` on
kuittausraja, ei toinen lompakko.

`MockRepository.ts` on 399/400 — tämä tiketti tiivistää muutaman 3-rivisen `async`-metodin
tiedoston omaan arrow-idiomiin (`getResources`, `getForecast`, `debugGrant` ym.) tehdäkseen
tilaa. Sama kuvio kuin `resetResources`, `getRevealed` ja Keep-metodit jo ovat.

**e2e-sivuvaikutukset (lahjan poisto):** `research.spec.ts` nojasi versiolahjan 30
wisdomiin → seedaa nyt wisdomin staattisen `/icon.svg`-sivun kautta (kilpailuvapaa, ei
appia ajossa). `guide.spec.ts` odotti Monument-riviä → `STARTER_STASH` kattaa sen culturen.
`standards.spec.ts` (target-size) + `trail-detail.spec.ts:81` (HUD 30 %) → Collect on
kompakti pussirivissä, ei kelluva overlay. Portti: `check-line-limit` + `tsc` + `vitest`
(1004) + `build` vihreät; e2e vihreä pl. tunnetut kuormitusflaket.

## Ei tässä

- Collectin jäädytysmalli (pool lukossa kunnes kerätty) — hylätty, trickle jatkuu
- Oikea onboarding-seikkailu askelineen — `BRDC-TUTOR-001`
- `grantBonus`in poisto — sitä käyttää alkustash ja reveal-bonus (`BRDC-CLAIM-009`)
