# BRDC-SIGIL-004 — Kahdeksantoista valtakuntamerkkiä, generoituna

| | |
|---|---|
| **Alue** | `features/nation/realmMarkGeometry.ts`, `realmMarks.ts`, `Banner.tsx`, `bannerSprites.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | done — 2026-09-14 (v0.5.86) |
| **Edeltäjä** | BRDC-SIGIL-001, BRDC-BANNER-001 |

## 🔴 RED

Design-dokumentti antaa 20 valtakuntamerkkiä, mutta ei 20 piirrosta — neljä
generaattoria (`ring`, `poly`, `chords`, `pairs`, `spiral`), joista jokainen merkki
lasketaan datana: ympyrämäärä, sointuaskel, kiertokulma. `BRDC-SIGIL-001` merkitsi tämän
halvimmaksi jäljellä olevaksi voitoksi juuri siksi — ei tarvitse piirtää mitään käsin.

Peli tarjosi tähän asti kuusi valmiiksi piirrettyä lippua (`BRDC-BANNER-001`).

## 🟢 GREEN

- [x] **Neljä generaattoria portattu puhtaana TypeScriptinä**: `ring`, `poly`, `chords`,
      `pairs`, `spiral`, plus `FRUIT_OF_LIFE` (Hedelmän kolmetoista ympyrää, jaettu monen
      merkin pohjaksi). 10 testiä geometrialle itselleen
- [x] **Kahdeksantoista kahdestakymmenestä**, ei kaikki. Kaksi jätetty tietoisesti:
      - *Vesica* pudotettu — käsinpiirretty `vesica`-lippu on jo sama kaksoisympyrä;
        dokumentin oma generoitu versio olisi sama muoto toiseen kertaan
      - *Drowned Knot* pudotettu — sen oma generaattori dokumentissa piirtää kaaren
        pisteestä pisteeseen 0,01 yksikön päähän, eli hiuksenohuen ympyrän, ei solmua.
        Luettu lähteen omaksi bugiksi, ei uskollisesti porrattavaksi muodoksi
- [x] **Kääntäjä pakottaa täydellisyyden.** `REALM_MARKS: Record<RealmMarkId, RealmMark>`
      — jos joku merkki jää joskus ilman kuvaa, koodi ei käänny
- [x] **Vanhat kuusi koskemattomina.** `HandDrawnBannerId` on oma tyyppinsä; tallennettu
      `bannerId` resolvoituu täsmälleen samaan taiteeseen kuin ennen
- [x] **Sama jako kuin väreissä koko istunnon ajan**: `MarkInk`-enum, jonka `Banner.tsx`
      lukee `var()`-muodossa ja `bannerSprites.ts` literaalina hexinä — sama syy kuin
      `RESOURCE_COLOUR`/`MAP_RESOURCE_COLOUR`: `Image` ei ratkaise custom propertyä
      dokumentin ulkopuolella
- [x] **Kaksi viewBox-avaruutta rinnakkain.** Dokumentin merkit ovat 100×100-tilassa,
      vanhat kuusi 48×48:ssa. Ratkaisu ei ole koordinaattien uudelleenskaalaus vaan
      `viewBox` valittuna `id`:n mukaan — `strokeWidth = box/24` pitää viivan yhtä
      paksuna kummassakin
- [x] **Saavutettavat nimet.** `bannerName(id)` palauttaa merkin oikean nimen
      (*"Metatron's Cube"*), ei raakaa id:tä (*"metatrons-cube"*) — kuultuna tyhjää.
      Käytetty sekä valitsimessa että Keepin lippunapissa
- [x] **Valitsin skrollautuu.** 24 vaihtoehtoa 3 sarakkeen ruudukossa olisi työntänyt
      kaiken alapuolisen pois puhelimen ruudulta; `.nation__picker` sai
      `max-block-size` + `overflow-y: auto`
- [x] Portti: 1355 vitest, desktop `nation` 3/3 (mukaan lukien uusi generoitu merkki
      kartan lippukerroksella asti), mobile-360 `standards` + `nation` 12/12

## Todennus

`realmMarks.test.ts`: geometria oikein · 18 merkkiä, ei Vesicaa eikä solmua · jokaisella
nimi, tarina ja jotain piirrettävää · ei kahta samaa kuvaa. `banners.test.ts` päivitetty
24:ään; olemassa oleva e2e (`nation.spec.ts`) korjattu käyttämään oikeaa nimeä raa'an
id:n sijaan, ja laajennettu todentamaan että generoitu merkki tavoittaa kartan atlaksen.

## Ei tässä

- 20 avataria (dokumentin oma erillinen "sigil"-konsepti "YOU"-ruudulle) — eri ominaisuus,
  ei vielä olemassa tässä pelissä
- Seitsemän ruutua, refraktiokerros — listattu `BRDC-SIGIL-001`:ssä
