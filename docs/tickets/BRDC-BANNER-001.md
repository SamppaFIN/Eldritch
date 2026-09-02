# BRDC-BANNER-001 — Esivalitut lippubannerit, ja lippu omilla heksoilla

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ART-002, BRDC-MAP-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Tämä lippu tulee pienellä sun mailles heksoihin, kuten building merkki.. tee
muutama esivalittu banneri, mikä on helppo piirtää svg grafiikalla."*

Rakennukset saivat karttamerkin `BRDC-ART-002`:ssa. Pelaajan **omalla maalla** ei ole
mitään joka sanoisi *kenen* se on ilman värin lukemista — ja väri ei `claude.md` §14:n
mukaan koskaan yksin kanna tietoa. Lippu on se merkki.

## 🟢 GREEN

- [ ] **6–8 esivalittua banneria**, jokainen puhdasta stroke-SVG:tä ilman fillia
      (`claude.md` §12): geometrinen kuvio + 1–2 väriä palettista. Nimetty
      (`bannerId`), piirretty samasta datasta kahdessa koossa: iso Keepin valitsimeen,
      pikkuruinen kartalle. Esim. *vesica*, *heptagram*, *split pale*, *chevron*,
      *eye*, *triquetra*.
- [ ] **Banneri­valitsin** `packages/ui`hin tai `features/nation`iin — ruudukko, valittu
      korostettu, `aria-pressed`, näppäimistöllä. Käyttää `BRDC-NATION-001`:n `es3:nation`ia.
- [ ] **Lippu omilla heksoilla** — uusi symbol-layer `buildingGlyphs`in mallilla
      (`CELL_BUILDING_LAYER`), oma offset ettei mene rakennusmerkin päälle. Piirretään
      vain omistetuille soluille; harva kynnys ettei jokaisessa heksassa ole lippua
      (esim. vain solut joilla ei ole rakennusta, tai vain alueen reunasolut — päätä
      kentällä kumpi lukee paremmin).
- [ ] Renderöinti on **font-glyfi tai yksi merkki**, ei rasteria — MapLibren symbol-layer
      piirtää bundlatun Noto Sansin, ja monimutkainen SVG ei sinne mene (`BRDC-ART-002`:n
      opetus: `⚒ ❋` eivät renderöityneet, Geometric Shapes -lohko renderöityi). Jos
      6–8 banneria ei mahdu siihen lohkoon, kartalla lippu on yksi geometrinen merkki
      pelaajan väreissä ja **täysi banneri näkyy vain Keepissä ja detail-dialogissa**.
- [ ] Testit: jokainen `bannerId` resolvoituu merkiksi ja väreiksi · valitsin vaihtaa
      `es3:nation`in · tuntematon `bannerId` putoaa oletukseen.

## Ei tässä

- Pelaajan itse piirtämä lippu / vaakuna-editori. Esivalitut riittävät.
- Rivaalin lippu kartalla — se on vihollisen puna (`claude.md` §13, BRDC-MAP-002), ei
  banneri. Rivaalin banneri näkyy vain heidän detail-dialogissaan (`BRDC-WAGER-JSON-004`).
