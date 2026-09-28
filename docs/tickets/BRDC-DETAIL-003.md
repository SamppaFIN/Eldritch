# BRDC-DETAIL-003 — Heksan toiminnot yläreunaan, yhteen riviin

| | |
|---|---|
| **Alue** | `apps/game/src/features/territory/CellPanel.tsx`, uusi `CellActions.tsx`, `cell-panel.css`; sama rivi `BRDC-WORKS-001`:n rakennussivulle |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `done` — ajettu ja todennettu 2026-09-28 (v0.6.63) |
| **Riippuvuudet** | `BRDC-DETAIL-002` (kortin järjestys), `BRDC-WORKS-001` (käyttää samaa riviä) |
| **Lähde** | Infinite 2026-09-24: *"jos heksalla on omia toimintoja, niin asetellaan ne kaikki sivun yläreunaan"* |

## 🔴 RED

Heksakortin toiminnot ovat hajallaan kortin koko pituudella, tiedon seassa
(`CellPanel.tsx:171–329`). Kortti on usein pidempi kuin yksi ruutu, joten kävellessä yhdellä
peukalolla toiminto pitää etsiä vierittämällä:

| Toiminto | Sijainti nyt | Ehto |
|---|---|---|
| Seikkailu (quest) | heti otsikon alla — ainoa jo ylhäällä (field report 2026-09-16) | heksalla tehtäväpiste |
| Expand (temppeli) | paikkalohkon sisällä, CellWorthin alla | oma temppeli, ei maksimissa |
| Ward | CellWorthin ja dwell-palkin alla | oma |
| Reveal | Wardin alla | oma, paljastamaton |
| Consecrate | Revealin alla | oma, ei paikkaa |
| Temple school | Consecraten alla | oma temppeli |
| Build / Demolish | lähes pohjalla | oma |
| Cast (rite) | Buildin alla | valittu riitti |
| Trade | pohjalla | oma, kauppaheksa |
| Anomaly | pohjalla | oma, poikkeama |
| City state -kauppa | aivan pohjalla | kaupunkivaltion laituri |

§14 sanoo: *"Every primary action must be reachable with one thumb"* ja *"Nothing may
require precision — the user is moving"*. Tänään Build on usein ruudun alapuolella.

## Ratkaisu

Kortin järjestys ylhäältä alas:

1. **Otsikko** (`CellHeader`) — ennallaan
2. **Toimintorivi** (`CellActions`) — **kaikki tämän heksan toiminnot, ja vain ne**
3. **Avattu toiminto**, jos sillä on oma lomake (ks. alla), suoraan rivin alla
4. **Tieto** — mitä täällä on, mitä se tuottaa, historia, arvo, dwell-palkki (DETAIL-002:n
   järjestys säilyy, toiminnot vain poistuvat sen seasta)

**Kahdenlaisia toimintoja:**

- **Yhden napautuksen toiminto** tapahtuu suoraan rivistä: Quest, Reveal, Ward, Expand,
  Consecrate, Cast, *Open work* (rakennussivu, WORKS-001).
- **Valintaa vaativa toiminto** avaa oman osionsa rivin alle, yksi kerrallaan: Build
  (rakennuslista), Trade, Temple school, City state -kauppa, Anomaly. Rivin nappi on
  silloin `aria-expanded`, ja toinen napautus sulkee sen.

**Rivin säännöt:**

- Järjestys on kiinteä, jotta sama toiminto on aina samassa kohdassa (§14): Quest ·
  Reveal · Ward · Build/Open work · Expand · Consecrate · Cast · Trade · City · Anomaly.
  Näytetään vain toiminnot, joiden ehto täyttyy tällä heksalla
- Nappi ≥ 44 px, rivi rivittyy 360 px:llä (ei vaakavieritystä), ikoni + lyhyt sana +
  hinta, jos on (`Ward · 25 timber`)
- Estetty nappi näkyy disabloituna, ja **yksi** status-rivi rivin alla kertoo syyn sanoin
  ("Short 25 timber"). Ei omaa huomautusta jokaisen napin alle, kuten nyt
- Selitystekstit (esim. *"A ward adds strength. It does not reset the clock…"*) siirtyvät
  avatun toiminnon osioon tai napin `title`/wikiin, eivät riviin
- Rivaalin heksa: rivillä on vain sen omat toiminnot (Open work, vain luku). Jos toimintoja
  ei ole, rivi puuttuu kokonaan, eikä tyhjää palkkia piirretä

**Rakennussivu (WORKS-001):** sama `CellActions`-rivi heti sivun yläpalkin alla, samoilla
säännöillä (Ward, Reveal, Demolish…). Rakennuksen oma Research-CTA pysyy PDF:n mukaan
kiinteänä alareunassa, koska se kuuluu rakennukselle eikä heksalle.

## 🟢 GREEN

- [x] `CellActions.tsx`: rivi ja yksi status-rivi. Järjestys on yhdessä vakiossa
      (`ACTION_ORDER`, `hexActions.ts`; nimi ei ole `cellActions.ts`, koska Windows ei erota
      sitä `CellActions.tsx`:stä)
- [x] `cellActions(offer)` on puhdas ja testattu (`hexActions.test.ts`): vain tarjotut
      toiminnot, aina sama järjestys, syy vain estetylle napille. Ehdot kootaan `cellOffer.ts`:ssä
- [x] `CellPanel` renderöi rivin heti otsikon alle. Ward, Reveal, Consecrate, Expand ja
      questin askel ovat rivissä; Works, Rites, Trade routes, Temple school, Trade post ja
      Anomaly avautuvat sen alle. `ConsecratePanel` poistui, koska sen nappi siirtyi riviin
- [x] Valintaa vaativa toiminto avautuu rivin alle, yksi kerrallaan, ja toinen painallus
      sulkee (`cell-actions.spec.ts`)
- [x] 360 px: rivi on ruudun yläpuoliskolla (`cell-actions.spec.ts`, mobile-360 + desktop)
- [x] Olemassaolevat e2e:t päivitetty avaamaan Works ennen rakennuslistaa (`opening`,
      `guide`, `sim.mjs`) ja tunnistamaan laituri "Trade post" -napista (`diplomacy`).
      `opening` 10/10 ajettu. `adventure.spec.ts` mobile-360 on punainen jo commitilla
      `e696d72` (vertailuajo), joten se ei johdu tästä
- [x] Rivibudjetti: `CellPanel.tsx` 355 → 340, vaikka rakennussivu liitettiin siihen
- [x] WORKS-001:n sivu käyttää samaa riviä (vain yhden painalluksen toiminnot)
- [x] Portti: `pnpm test`, `pnpm typecheck`, `pnpm lint:lines`, `pnpm build`

## Ei tässä

- Toimintojen oma logiikka (hinnat, portit) — ennallaan, vain paikka muuttuu
- Uudet toiminnot
