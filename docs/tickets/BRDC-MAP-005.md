# BRDC-MAP-005 — Kartan päällä kelluva kerros: yksi omistaja ruudun reunoille

| | |
|---|---|
| **Alue** | `hud/MapNotices.tsx`, `hud/FirstLook.tsx`, Guide-ilmoitus, `ClaimBurst`, `PouchGain`, `CameraControl`, `tutor/UnlockMoment.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `done` — 2026-09-22 (v0.6.46) |
| **Lähde** | Infinite 2026-09-09: *"nyt tuossa kartan päällä esim näkyy notifikaatio"* · 2026-09-15: *"laita joku malli millä tiedot ei rendaa päällekkäin"* |

## 🔴 RED

Kartan päällä kelluvilla DOM-elementeillä ei ole omistajaa. Jokainen laskee oman
paikkansa (`position: fixed`, oma `inset`), eikä mikään tiedä muista.

- `MapNotices` pinoaa jo omat ilmoituksensa (BRDC-HUD-004), mutta vain keskenään
- **Havaittu 2026-09-15, 360×780** (`BRDC-SIGIL-006`:n kuvakaappaukset):
  - **FirstLook-vihje** *"Walk into the hex beside yours."* piirtyy **solupaneelin otsikon
    päälle** — *"A place of trade (surveyed) · Yours"* on lukukelvoton sen alla
  - **Guide-ilmoitus** *"The Guide has a new page · The Hearth"* samassa kohdassa
  - **Opastusdialogin "Not now" jää tilapaneelin alle** — ks. `BRDC-TUTOR-004`, sama
    z-taso (`--z-hud`) kuin HUD

Karttamerkkien puoli samasta pyynnöstä on `BRDC-SIGIL-006` (slottitaulu). Tämä on DOM-puoli.

## 🟢 GREEN

- [x] Uusi `TopStack.tsx` (`apps/game/src/features/hud/`) omistaa ruudun yläreunan.
      `FirstLook`, `GuideNews` ja `MapNotices` eivät enää itse aseta `position: fixed`iä
      tai `top`ia — ne ovat nyt tavallisia lapsia yhden flex-sarakkeen sisällä, joka
      pinoo ne `gap`illa. `GuideNews`in tila siirrettiin pois `useMapAside`in sisältä
      renderöitäväksi (`aside.guideNews`), jotta se voi olla sama sarake `FirstLook`in
      ja `MapNotices`in kanssa eikä oma erillinen puunsa
- [x] `<TopStack hidden={sheetOpen}>` — `sheetOpen` on jo olemassa oleva ehto
      (`inspect.selected !== null || inspect.sanctum || inspect.researchOpen ||
      aside.anyOpen`), sama jolla HUD tiivistyy kävelypalkiksi. Koko sarake palauttaa
      `null`in kun mikä tahansa paneeli peittää kartan — päällekkäisyys ei ole enää
      mahdollinen z-indeksilaskennalla vaan rakenteellisesti
- [x] `e2e/top-stack.spec.ts` (uusi, 3/3, mobile-360): tuore profiili näyttää
      `.first-look__card`in `.top-stack`in sisällä; solukortin avaaminen (Lands-listan
      kautta, ei kävelyä) tyhjentää `.top-stack`in kokonaan (`toHaveCount(0)`); ESC
      sulkee kortin ja hyhjä palaa näkyviin
- [x] `--hud-height`in 17 fallback-esiintymää (12rem × 12, 8,5rem × 3, 9rem × 1 jo
      olemassa) yhtenäistetty **9rem**iin joka tiedostossa
- [x] `UnlockTeacher` siirretty renderöitymään `Hud`in **jälkeen** `MapView.tsx`ssä
      (oli ennen sitä). RED:in oma diagnoosi — sama `--z-hud` kuin HUD:lla — tarkoitti
      että piirtojärjestys (DOM-järjestys tasapelissä) ratkaisi kumpi peittää kumman;
      `UnlockTeacher` piirtyi ennen `Hud`ia, joten `Hud` peitti sen "Not now" -napin.
      Ei uutta z-indeksiä keksitty (CLAUDE.md §14: "Never invent a z-index outside this
      scale") — pelkkä järjestyksen vaihto samalla tasolla
- [x] Portti: `lint:lines`, `tsc -b`, 1620 vitest (ei regressiota), `pnpm build`,
      `e2e/top-stack.spec.ts` 3/3

**RED:in yksi väite oli jo vanhentunut ennen tätä tikettiä:** *"`.mapview__warning--dev`
on kuollut luokka"* — tarkistettu, sillä ON sääntö (`mapview.css`) ja se on aktiivisessa
käytössä (`MapNotices.tsx`in dev-ilmoitukset). BRDC-HUD-004 korjasi tämän jo aiemmin;
RED ei ollut päivittynyt sen mukana. Ei muutosta tarvittu tähän kohtaan.

## Ei tässä

- `UnlockMoment`in modaalisuuspäätös — `BRDC-TUTOR-004`. Tämä tiketti korjasi vain
  senkin paikan *DOM-järjestyksen* suhteessa HUD:iin, ei tehnyt siitä modaalia eikä
  ottanut kantaa pitäisikö sen olla
