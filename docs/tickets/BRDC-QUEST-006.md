# BRDC-QUEST-006 — Seikkailu heksan parametrina

| | |
|---|---|
| **Alue** | `data/questSites.ts`, `features/map/useBoot.ts`, siemen (`HexSeed.quest`), `QuestMarkers.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — pikakorjaus ajettu ja todennettu; `HexSeed.quest` ja *What Sleeps at the Shore* auki |
| **Riippuvuudet** | `BRDC-SEED-004` (lopullinen muoto); pikakorjaus mahdollinen ilman |
| **Lähde** | Infinite 2026-09-15: *"korjata nuo questit oikeille heksoille.. Nyt statue of boy on jostain syystä mun keepin paikalla, se alunperin oli tuolla harmatun täplän päällä.. Muuta seikkailut oikeille heksoille, siten että seikkailu on heksan parametri tms.. muut kaikki kohdat on täsmälleen saman verran vinossa alkuperäisestä paikasta"* · 2026-09-16: *"Seikkailun pisteet on hieman sinnepäin annettu, aiemmat lokaatio tiedot on oikein"* |

## 🔴 RED

**Syy, luettu koodista (`data/questSites.ts`, `useBoot.ts:88-111`):**

1. `useBoot` kutsuu `anchorQuestSites(cellCentre(castle))` — koko seikkailun muoto siirretään Keepille
   (`BRDC-QUEST-004`, jotta muualla asuva voi pelata)
2. Muoto on laskettu **patsaasta**: `SHAPE.statue` on 0 m, joten `questSiteAt('statue')` palauttaa
   **täsmälleen ankkurin** — patsas istuu Keepin heksalla
3. Jokainen muu paikka siirtyy **samalla vektorilla** (Keep − oikea patsas) — juuri Infiniten havainto
4. `BRDC-QUEST-005` kiinnitti ensimmäisellä käynnistyksellä **tämän siirretyn** tuloksen
   `es3:quest-cells`iin — väärät heksat ovat nyt tallessa ja pysyvät

Oikeat paikat ovat jo koodissa: `QUEST_SITES` (v2:n Härmälän koordinaatit) ja `HARMALA_STATUE`.
Uuden ketjun *"What Sleeps at the Shore"* koordinaatit ovat Infiniten mukaan suuntaa-antavia.

## 🟢 GREEN

- [x] **Pikakorjaus:** `anchorQuestSites` (`data/questSites.ts`) ei aseta ankkuria kun `home`
      on jo `SEED_BOX`in sisällä — patsas ja koko muoto pysyvät `QUEST_SITES`in omissa,
      oikeissa koordinaateissa. Testi: Keep 100 m ja 250 m patsaasta →
      `siteCell('statue') === cellAt(QUEST_SITES.statue)`, jokainen paikka täsmälleen
      kirjoitettuun koordinaattiin — molemmat epäonnistuvat vanhalla koodilla (todennettu:
      testi punaisena ennen korjausta)
- [x] **Alueen ulkopuolella ankkurointi säilyy** (D8): Helsinki-testi läpäisee muuttumattomana
- [x] **Väärät tallennetut kiinnitykset hylätään:** `useBoot.ts`in tallennusavain
      `quest-cells` → `quest-cells-v2`. Vanhan avaimen alla oleva (väärä) data ei enää
      koskaan tule luetuksi — ei poisteta, ei tarvitse, uusi avain riittää
- [ ] **Seedatulla alueella seikkailu on heksan parametri** (`HexSeed.quest { chain, node, item }`)
      — ei tehty. Pikakorjaus riittää nykyiselle *Fuming Lake* -tarinalle (`QUEST_SITES` on jo
      oikea), joten täysi `HexSeed.quest`-integraatio siirtyy siihen asti kun uusi ketju
      (*What Sleeps at the Shore*) oikeasti tarvitsee sen
- [ ] *What Sleeps at the Shore*: 5 solmua + 3 välimuistia heksan parametreina — koordinaatit
      vahvistetaan ennen siementä (`BRDC-SEED-001` tai Infiniten pitkä painallus)
- [x] Tehtävätaulu listaa ketjut (`BRDC-TAVERN-001`, tehty 2026-09-16: `questBoardEntries`
      listaa jokaisen käynnissä olevan seikkailun Tavernan omalla heksalla)

## Todennettu

- 3 uutta testiä (`questAnchor.test.ts`), kaikki 19 kysymystiedoston testiä vihreitä
- Portti: 1515 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät
- Versio nostettu, changelog kirjoitettu — korjaa juuri sitä mistä Infinite valitti.
  Kenttäkoe laitteella vahvistaa lopullisesti, mutta korjaus on todennettu yksikkötestein

## Päätös Infiniteltä

- **D8** (`BRDC-SEED-000`): alueen ulkopuolella seikkailu ankkuroidaan Keepiin kuten nyt?
  **Vastattu: kyllä, toistaiseksi.** Infinite: myöhemmin eri alueille tulee omat
  questimekaniikat — ei vielä tikettiä, uusi tarve kirjattu tähän kunnes se saa numeron
- Elävätkö Fuming Lake ja What Sleeps at the Shore rinnakkain? — auki

## Ei tässä

- Tehtävien sisältö ja dialogit
