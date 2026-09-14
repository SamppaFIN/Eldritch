# BRDC-NAV-001 — Avaaminen ja lopettaminen eivät saa näyttää samalta

| | |
|---|---|
| **Alue** | `features/hud/SettingsMenu.tsx`, `settings-menu.css` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S |
| **Riippuvuudet** | `BRDC-DETAIL-001`, `BRDC-KEEP-008`, `BRDC-TECH-003`, `BRDC-CHAR-002` (sama sarja) |
| **Status** | `done` — 2026-09-15 (v0.5.92) |

## 🔴 RED

☰-valikko oli yksi erittelemätön pystyrivi: seitsemän kytkintä, viiva, ja kymmenen
toimintoa — kaikki samanmuotoisia, -painoisia ja -värisiä rivejä.

Konkreettinen vaara, ei makuasia: **"Empty the pouch"** — joka heittää menemään jokaisen
resurssin — renderöityi *täsmälleen* samannäköisenä kuin **"Codex of Dominion"** yhtä
riviä ylempänä. Lista selataan yhdellä peukalolla kävellessä. Vain `Delete progress`
oli merkitty (`--danger`); toinen yhtä tuhoava toiminto ei ollut.

`CLAUDE.md` §14 sanoo *"Same action = same appearance, always"*. Sen kääntöpuoli on tämä:
eri lajin toiminnot eivät saa näyttää samalta. Molemmilla on vahvistusdialogi, mutta
vahvistus on verkko pudotuksen alla — se ei ole syy tehdä pudotuksesta yhtä todennäköistä.

## 🟢 GREEN

- [x] Valikko jakautuu kahteen ryhmään: kaikki mikä **avaa** jotain (Guide, History, Your
      lands, Codex, Import a walk, Report a bug, What's new), ja sen alla kaikki mikä
      **lopettaa tai tuhoaa** jotain (Retreat, Empty the pouch, Delete progress)
- [x] Ryhmällä on **nimi** — `Ending things` — jotta viiva sen yllä luetaan tarkoitukseksi
      eikä eksyneeksi erottimeksi
- [x] `Empty the pouch` saa saman `--danger`-merkinnän kuin `Delete progress`; se tuhoaa
      yhtä lailla. `Retreat` ei saa — se päättää kävelyn, ei hävitä mitään
- [x] `Delete progress` on nyt niin kaukana `Guide`sta kuin valikossa voi olla
- [x] Portti: `lint:lines`, `tsc -b`, 1363 vitest, `pnpm build`, e2e `-g "the menu reaches
      Retreat|the menu control is a real button"`

## Todennus

Molemmat valikkoa käyttävät e2e-testit etsivät nappinsa **saavutettavalla nimellä**
(`getByRole('button', { name: 'Retreat from the map' })`, `'Delete progress'`) eivätkä
järjestyksellä, joten uusi `<hr>` ja ryhmäotsikko eivät voi rikkoa niitä — ja ajettuna ne
eivät rikkoneetkaan.

## Ei tässä

- **Kytkinten ryhmittely** (Ääni · Kartta · Säännöt · Maailma). Seitsemän kytkintä on yhä
  luettava lista, eikä yksikään niistä ole vaarallinen — ryhmäotsikot maksaisivat neljä
  riviä korkeutta 14 rem levyisessä alasvetovalikossa ratkaisematta mitään mitattua
  ongelmaa. Jos kytkimiä tulee lisää, tämä muuttuu
- **Navigoinnin ja asetusten erottaminen kahteen näkymään** — vanha suunnitelma ehdotti
  sitä; yksi valikko kahdella nimetyllä ryhmällä ratkaisee saman vaaran ilman toista
  näkymää ja toista takaisin-polkua (`§4.2`: minimaalinen koodi joka ratkaisee ongelman)
- `Guide` ja `History` ovat saavutettavissa myös HUD:sta. Se on kaksi reittiä samaan
  paikkaan, ei kahdentuma — eikä kumpikaan reitti ole väärä
