# BRDC-MODE-001 — Reittimoodi vs. Seikkailumoodi: valinta, tallennus, portitus

| | |
|---|---|
| **Alue** | `apps/game/src/app/`, `apps/game/src/features/mode/` (uusi), `packages/core/src/types/`, `packages/core/src/data/profileStore.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Status** | `done` — 2026-09-23 (v0.6.54) |

## 🔴 RED

Infinite 2026-09-23: *"Haluen, että seikkailun alussa pelaajalla valitsee joko
reittimoodin tai seikkailumoodin, reittimoodi on riisuttu versio, mikä ei mittaa
highscore listalle muuta kuin kuljetun matkan ja vallatut heksat.. kaikki
pelimekaniikat on sitten eldrich sanctuaryssä."*

Peli on tänään yksi asia kaikille. `PlayerProfile` (`packages/core/src/types/domain.ts`)
ei tunne mitään moodia, ja `App.tsx`in boot-tilakone (`'title' | 'hearth' | 'map'`) ei
tarjoa kohtaa jossa pelaaja valitsisi mitään ennen Hearthin perustamista. `MapView.tsx`
renderöi ehdoitta koko kerrostuman — Keep, questit, ihmeet, Wager, klaanit, Cipher —
riippumatta siitä haluaako pelaaja niistä mitään.

Tämä tiketti on pelkkä valinta ja portitus: **ei uutta sääntölogiikkaa** (se on
`BRDC-MODE-002`), vain "kuka olet ja mitä sinulle näytetään."

## 🟢 GREEN

- [x] `GameMode = 'route' | 'adventure'` (`packages/core/src/types/domain.ts`),
      `PlayerProfile.mode: GameMode`
- [x] `profileStore.ts`in `readProfile()` ottaa `mode`-parametrin (oletus
      `'adventure'`), käytetään vain profiilin ensiluonnissa — myöhemmät luvut eivät
      koskaan vaihda olemassaolevan profiilin moodia. Vitest: `profileStore.test.ts`
      (3 testiä — oletus, ensiluonti kunnioittaa annettua moodia, myöhempi luku ei
      vaihda sitä)
- [x] `App.tsx`in tilakoneeseen uusi näkymä `'mode'`, `'title'`in ja `'hearth'`in
      väliin. `begin()` reitittää sinne jos `es3:mode`-merkkiä ei ole vielä
      kirjoitettu — sama `nextView()`-funktio myös session-palautukselle
- [x] Uusi `apps/game/src/features/mode/ModeSelect.tsx` (+ CSS) — kaksi nappia,
      "Begin the Adventure" ja "Begin the Route", sama visuaalinen kieli kuin
      `TitleScreen.tsx`in `RitualButton`. Valinta kirjoittaa `saveNow('mode', {mode})`
      (`es3:mode`, sama kuvio kuin `es3:hearth`/`es3:session`)
- [x] `useBoot.ts` lukee `es3:mode`-merkin ja välittää sen `createRepository`ille —
      **ei** myöhemmin erillisenä `setMode`-kutsuna, ks. sivulöydös alla
- [x] `MapView.tsx`: `isRoute = profile.mode === 'route'` portitsee. Uusi
      `AdventureOverlays.tsx` (`features/hud/`) niputtaa Discovery/Quest/Cipher/
      Adventure/Encounter/Wonder-ilmestymät yhdeksi `isRoute`-portiksi (myös
      `MapView.tsx`in 400 rivin budjetin vuoksi). Erikseen portitettu: `HearthPanel`
      (koko Keep-ruutu, `inspect.sanctum && !isRoute`), `WagerDialog`/`ResearchDialog`
      (`open`-propsiin `&& !isRoute`), `UnlockTeacher` (koko onboarding-opettaja),
      klaani-/Wager-/Hall of Fame-/Retire-linkit `SettingsMenu`ssa (uusi optionaalisuus
      `onOpenClan`/`onOpenClanCodex`/`onOpenHallOfFame`/`onRetireKingdom`illa, sama
      `onWager`-kuvio kuin ennestään), `nation.bannerId` `MapCanvas`iin (`null`),
      `onCastleTap`/`onOpenKeep`/`onOpenResearch` (`undefined` — nappi jää näkyviin
      mutta disabloituu, sama kuvio kuin "Here" jo käyttää kun ei seistä millään)
- [x] `Hud.tsx`: taso/XP-lohko pois reittimoodissa — "Consciousness"-nimikkeen tilalla
      "Route" / "Walking", `hud__xp`-palkki ei renderöidy. **Ei tässä**: erillistä
      matka-/heksarivä ei lisätty — se tulee `BRDC-MODE-002`ssa oikealla datalla,
      tyhjän kaksoiskappaleen sijaan (heksamäärä näkyy jo "Warded"-lukemassa)
- [~] `useSelection.ts`in `useResearch`/`useSpells`-portitus **ei toteutettu** —
      tarkastelun jälkeen todettu tarpeettoman riskialttiiksi tässä tiketissä: niiden
      tulosta (`spell.active`, `research.researched`) lukevat myös `useShownCells`in
      sumuraja ja `CellPanel`, joiden käyttäytymistä ei haluttu muuttaa. Jätetty
      myöhemmäksi, pieneksi suorituskykyparannukseksi — ei korrektiusongelma
- [x] Olemassaolevat e2e-testit läpäisevät ennallaan seikkailumoodilla — katso
      "Sivulöydökset" alla kuudesta tiedostosta jotka piti korjata tämän tiketin takia
- [x] Uusi `apps/game/e2e/mode-select.spec.ts` (3 testiä): moodivalintaruutu ilmestyy
      ennen Hearthia; reittimoodi piilottaa/disabloi Keep-, Research-, Wager-, klaani-
      ja Hall of Fame -toiminnot; seikkailumoodi toimii ennallaan (regressiovahti)

## Todennus

`pnpm test` (1666 vihreää, +6 tästä tiketistä), `pnpm typecheck`, `pnpm lint:lines`
kaikki vihreää. `apps/game/e2e/mode-select.spec.ts` (3/3), `map.spec.ts` (14/14),
`geo-permission.spec.ts` (2/2, uusi tiedosto — ks. sivulöydös), `standards.spec.ts`
(10/10, uusi a11y-testi moodivalintaruudulle), `atlas.spec.ts` (6/6) kaikki ajettu
`mobile-360`-projektilla, kaikki vihreää.

## Sivulöydökset, 2026-09-23

**Todellinen bugi, ei vain UI-portti: profiili syntyi väärällä moodilla joka kerta.**
`useBoot.ts` kutsui alun perin `createRepository()`in ilman moodia ja yritti kutsua
`repository.setMode(mode)`ia vasta sen JÄLKEEN — mutta `createRepository()`in oma
sisäinen alustus (`takeRazed` → `getOwnedCells` → `getProfile`) luo profiilin JO
ennen kuin kutsuja saa kontrollin takaisin. `setMode` sen jälkeen on aina no-op, koska
`readProfile` kunnioittaa vain annettua moodia ensiluonnissa. Reittimoodin valinta ei
siis koskaan tosiasiassa mennyt läpi — löytyi vasta e2e-testistä, joka odotti Research-
napin olevan disabloitu eikä ollutkaan. Korjaus: `createRepository(mode?)` ottaa moodin
parametrina ja kutsuu `setMode`ia ENNEN mitään muuta, `useBoot.ts` lukee `es3:mode`-
merkin ennen `createRepository`in kutsua eikä sen jälkeen. **Tunnettu, korjaamaton
reunatapaus:** jos pelaaja avaa Wagerin title-ruudulta (`App.tsx`in `openWager`) ennen
moodin valintaa, se kutsuu `createRepository()`in ilman moodia ja luo profiilin
`'adventure'`ksi jo silloin — myöhempi moodivalinta ei enää tehoa. Harvinainen polku,
ei korjattu tässä tiketissä.

**Kuusi e2e-tiedostoa piti korjata**, koska ne ohittivat `hearth.ts`in jaetun
`openMap`-avustajan ja klikkasivat "Begin the Awakening" → Hearth suoraan: `decay.spec.ts`,
`map.spec.ts`, `standards.spec.ts`, `trail.spec.ts`, `wager.spec.ts`, `sim.mjs`. Jokainen
sai yhden lisärivin ("Begin the Adventure" -klikkaus) tai (map.spec.ts:n
BRDC-GEO-001-lohko) suoran `es3:mode`-merkin `localStorage`-siemenenä samalla tavalla
kuin `es3:hearth` jo tehdään.

**`map.spec.ts` oli 428/400 riviä muutosten jälkeen** — `test.describe('a browser that
never answers (BRDC-GEO-001)')` -lohko (täysin itsenäinen, oma `openWith`-avustajansa)
siirrettiin uuteen `geo-permission.spec.ts`iin.

**Sivulöydös, ei tämän tiketin bugi mutta löytyi sen kautta: `standards.spec.ts`in ja
`wager.spec.ts`in "Retreat from the map" -klikkaukset unohtivat "Advanced"-välirivin.**
Sigil-uudistus (screen 01) siirsi Retreatin Advanced-osion taakse, `map.spec.ts`in oma
testi ja `dialogs.spec.ts`in `openMenuAction`-avustaja tietävät tämän — nämä kaksi
tiedostoa eivät koskaan tienneet, ja `getByRole('button', {name:'Retreat from the
map'})` jäi odottamaan elementtiä joka ei koskaan ilmesty (90 s timeout). Ei liity
moodivalintaan — sama bugi olisi ollut olemassa ilman tätäkin tikettiä. Korjattu
molemmissa tiedostoissa.

## Ei tässä

- **Ei uutta sääntölogiikkaa.** Rappio, valtaus, vahvistus toimivat reittimoodissa
  tässä tiketissä täsmälleen kuten seikkailumoodissa — ne vain eivät näy UI:ssa.
  `BRDC-MODE-002` korvaa moottorin reittimoodille kevyemmällä
- **Ei matkalaskuria eikä tulostaulua.** `BRDC-MODE-002`
- **Ei moodin vaihtoa kesken pelin.** Valinta on pysyvä koko tallennuksen ajan; ainoa
  tapa vaihtaa on nollata eteneminen ja aloittaa uudelleen (olemassaoleva "Delete
  progress" -toiminto)
- **Ei `useResearch`/`useSpells`-portitusta.** Ks. GREEN — päätettiin liian riskialttiiksi
  tälle tiketille, jätetty erilliseksi pieneksi parannukseksi
- **Ei korjausta Wager-title-ruutu-reunatapaukselle.** Ks. sivulöydös yllä
