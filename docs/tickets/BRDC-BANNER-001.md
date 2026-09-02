# BRDC-BANNER-001 — Esivalitut lippubannerit, ja lippu omilla heksoilla

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ART-002, BRDC-MAP-002 |
| **Status** | `done` — 2026-09-02 (v0.5.12), kentän lippu `[~]` |
| **Valmius** | 85 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Tämä lippu tulee pienellä sun mailles heksoihin, kuten building merkki.. tee
muutama esivalittu banneri, mikä on helppo piirtää svg grafiikalla."*

Rakennukset saivat karttamerkin `BRDC-ART-002`:ssa. Pelaajan **omalla maalla** ei ole
mitään joka sanoisi *kenen* se on ilman värin lukemista — ja väri ei `claude.md` §14:n
mukaan koskaan yksin kanna tietoa. Lippu on se merkki.

## 🟢 GREEN

- [x] **Kuusi esivalittua banneria**, jokainen inline stroke-SVG ilman fillia
      (`claude.md` §12), 1–2 palettiväriä: `vesica`, `heptagram`, `chevron`, `pale`,
      `eye`, `triquetra`. `Banner.tsx` (`<Banner id size />`), yksi `viewBox="0 0 48 48"`.
- [x] **Banneri­valitsin** `features/nation/BannerPicker.tsx` — 3×2-ruudukko, valittu
      `aria-pressed` + kulta­reunus, näppäimistöllä. `NationIdentity` committaa `es3:nation`iin.
- [x] **Lippu omilla heksoilla** — `CELL_FLAG_LAYER` symbol-layer `CELL_BUILDING_LAYER`in
      mallilla, `text-offset [0, 1.1]`, `opacity 0.7`. `cellProperties.flag = mine &&
      !cell.building ? '◈' : ''` — harva kynnys (ei rakennuksen solulle). **Ei riipu
      nation-tilasta:** yksi merkki = "minun", täysi banneri on Keepissä.
- [x] Renderöinti on **yksi Geometric Shapes -merkki** (`◈`, `FLAG_GLYPH`), ei rasteria —
      `BRDC-ART-002`:n opetus. Täysi banneri-SVG vain Keepissä / valitsimessa.
- [x] Testit: `banners.test.ts` — `resolveBannerId` tuntematon → `vesica`, `displayName`
      oletukset, 6 uniikkia id:tä. `territoryFeatures.test.ts` — `flag` omalla
      rakennuksettomalla solulla `◈`, rakennuksella/rivaalilla/vapaalla `''`.
- [~] **Kartan lippu kentällä:** jos `◈` joka omalla rakennuksettomalla solulla on
      meluisa 360 px:llä, se on yksi `filter`-muutos (esim. vain reunasolut) tai poisto.
      Todennetaan ulkona.

## Ei tässä

- Pelaajan itse piirtämä lippu / vaakuna-editori. Esivalitut riittävät.
- Rivaalin lippu kartalla — se on vihollisen puna (`claude.md` §13, BRDC-MAP-002), ei
  banneri. Rivaalin banneri näkyy vain heidän detail-dialogissaan (`BRDC-WAGER-JSON-004`).
