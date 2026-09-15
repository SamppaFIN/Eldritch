# BRDC-QUEST-006 — Seikkailu heksan parametrina

| | |
|---|---|
| **Alue** | `data/questSites.ts`, `features/map/useBoot.ts`, siemen (`HexSeed.quest`), `QuestMarkers.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` — syy mitattu |
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

- [ ] **Seedatulla alueella seikkailu on heksan parametri** (`HexSeed.quest { chain, node, item }`),
      aiempien vahvistettujen koordinaattien heksoilla. Ei ankkurointia
- [ ] **Pikakorjaus ennen siementä:** kun Keep on Härmälän alueella, ankkuria ei aseteta ja paikat ovat
      `QUEST_SITES`issa. Testi: Keep 100 m patsaasta → `siteCell('statue') === cellAt(QUEST_SITES.statue)`,
      ja se epäonnistuu vanhalla koodilla
- [ ] **Väärät tallennetut kiinnitykset hylätään kerran** (avaimen versio), ei hiljaista jäämistä. Testi
- [ ] Alueen ulkopuolella `BRDC-QUEST-004`:n ankkurointi säilyy (päätös D12)
- [ ] *What Sleeps at the Shore*: 5 solmua + 3 välimuistia heksan parametreina — koordinaatit
      vahvistetaan ennen siementä (`BRDC-SEED-001` tai Infiniten pitkä painallus)
- [ ] Tehtävätaulu listaa ketjut (`BRDC-TAVERN-001`)

## Päätös Infiniteltä

- **D12** (`BRDC-SEED-000`): alueen ulkopuolella seikkailu ankkuroidaan Keepiin kuten nyt?
  (Suositus: kyllä — muuten muualla asuva ei voi pelata sitä)
- Elävätkö Fuming Lake ja What Sleeps at the Shore rinnakkain?

## Ei tässä

- Tehtävien sisältö ja dialogit
