# BRDC-WIKI-003 — Tietokirja navigoitavaksi: johdetut sivut, haku, elävät tilat

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus (nostettu Vaihe 3:sta) |
| **Effort** | L |
| **Riippuvuudet** | BRDC-WIKI-001, BRDC-WIKI-002, BRDC-TEMPLE-003, BRDC-BUILD-007 |
| **Status** | `done` (2026-09-06, v0.5.40) |
| **Valmius** | 85 % — johdetut sivut, haku, elävät tilat valmiit; suora linkki build-valikosta ja karttahyppy jäävät jatkoon |
| **Lähde** | Infinite, kenttätesti 2026-09-06: *"suunnitellaan hieno infograafinen rakenne, mitä pystyy pelin sisällä liikkumaan kuin wikipediaa.. Riiteille oma sivu, mistä näkee riittien tilat.. joka pelin käsitteelle vastaava.. haku"* |

## 🔴 RED

`BRDC-WIKI-001` jätti auki juuri sen mitä kenttä pyysi: *"johdetaan samoista taulukoista"*,
*"jokaisella rakennuksella ja teknologialla on sivu"*, *"linkki joka toiminnosta"*,
*"haku"*. Runko (`HelpPanel`, `help.ts`) oli valmis; sisältöä ei.

## 🟢 GREEN

- [x] **`wikiPages.ts` — johdettu sivu jokaiselle.** `wikiEntry(ref, ctx)` rakentaa
      `{ title, body, see, status }` `BUILDINGS` / `TECHS` / `SPELLS`:istä ja
      `catalogue.tsx`:n copysta (`BUILDING_BLURB`, `buildingEffect`, `spellEffect`,
      `techUnlocks`, …). **Ei tekstiä kahdessa paikassa** — `wikiPages.test.ts` kaataa
      ajon jos rakennus jää ilman sivua.
- [x] **`HelpView` laajeni.** `WikiRef = HelpTopic | \`work:${BuildingId}\` |
      \`tech:${TechId}\` | \`rite:${SpellId}\``. `HelpPanel` resolvoi käsinkirjoitetun
      (`HELP`) tai johdetun (`wikiEntry`); `see`-linkit toimivat kummallekin,
      leivänmurupaluu "‹ Guide".
- [x] **Elävä tilarivi** (`status`): rakennus → "Held on N cells" / "None built yet";
      teknologia → "Researched" / "Ready to research" / "Locked"; riitti → "Yours to
      cast" / "Locked — research X" / "Running · N h left". `useMapAside` hakee
      `getOwnedCells` + `getResearched` + `getActiveSpells` kun kirja on auki.
- [x] **`HelpIndex.tsx` (uusi, `HelpPanel` jaettu).** Etusivu: käsinkirjoitetut aiheet
      ryhmiteltyinä (näkyy vain kohdatut, `WIKI-002`) **+ aina näkyvä "Reference"** —
      Works / Research / Rites, jokainen johdettu sivu listattuna.
- [x] **Haku.** `<input type=search>` etusivun päällä; `searchRows()` litistää
      käsinkirjoitetut ja johdetut → otsikko + ensimmäinen kappale, suodattuu kirjoittaessa.
- [x] **Testit.** `wikiPages.test.ts` (7): jokainen ref → titled page + body + status;
      ristiviittaukset olemassa oleviin; tilarivit muutamalla ctx-tilalla;
      Reference kattaa jokaisen refin kerran; hakurivit. `help.test.ts` ennallaan.
- [x] **e2e** `guide.spec.ts`: valikko → Guide → Reference → Sawmill-sivu (efekti +
      tilarivi) → ristilinkki Forestryyn → paluu → haku "fortress" suodattaa.
- [x] `pnpm test` (1001) `&& typecheck && lint:lines && build` vihreät; e2e `guide` +
      `standards` (a11y: h2→h3→h4, ei hyppyä) molemmilla projekteilla.

## Ei tässä (jatkoon)

- **Suora linkki build-valikon rivistä rakennuksen sivulle.** Vaatii `onWiki`-callbackin
  pujottamisen `BuildPanel` ← `CellPanel` ← `MapView`, ja molemmat ovat 400 rivissä —
  tiedoston jako ensin. Reference-osio + haku kattaa navigoinnin toistaiseksi.
- **"Show on map" -rivi rakennuksen sijaintikortilta.** Tilarivi kertoo montako; solun
  valinta kartalta on erillinen pujotus (`onShowCell`).
- Per-maasto-sivut. Maastoja on 7 ja niiden copy on hajallaan; oma pieni tikettinsä.
- Infograafit / SVG-diagrammit sivuille (`BRDC-ART-*`).

## Vaikutus

- `BRDC-WIKI-001` `Valmius` nousee ~85 %:iin; sen viimeiset avoimet kohdat (johdetut
  sivut, haku) on tässä. Käsinkirjoitettu `HELP` ei muuttunut.
