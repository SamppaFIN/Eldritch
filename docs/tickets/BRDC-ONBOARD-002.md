# BRDC-ONBOARD-002 — Kirjan luvut I–II: maa ja Työt

| | |
|---|---|
| **Alue** | `rules/charter.ts` (askeleet), *Show me* -linkit |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | S–M |
| **Riippuvuudet** | BRDC-ONBOARD-001 |
| **Lähde** | Infinite 2026-10-13: *"esim pystytä vartiotorni, kasvata puuttuvan resurssin saantia jne."* |
| **Status** | `in-progress` |

## 🔴 RED

Uusi pelaaja ei tiedä, että askel valtaa, että maa tuottaa, että Työ tarvitsee kädet eikä
että Lore avaa rakennuksia — kaikki nämä kerrotaan nyt erillisinä kortteina tai ei lainkaan.

## 🟢 GREEN

- [x] **Luku I — Maa:** astu viereiseen heksaan · pidä 12 heksaa · paljasta heksa. *Kerää pussi*
      jätettiin pois: sille ei ole tilaa josta lukea, ja Collect-nappi on Today-välilehdellä joka tapauksessa
- [~] **Luku II — Työt:** opiskele Lookouts · rakenna Vartiotorni · lähetä kansalainen töihin —
      tehty; puuttuva resurssi siirtyi ONBOARD-003:een
- [~] *Show me*: paljastamaton heksa, Vartiotornille sopiva heksa (kukkula/tasanko, ei Työtä),
      tornin heksa, Research. Kävelyaskeleilla ei ole mitä näyttää. Heksan valinta testattu
      yksikkötestissä; e2e ei vielä paina *Show me*:tä
- [x] Palkinnot ketjussa: jokainen antaa seuraavan askeleen tarpeen (Lore-viisaus, tornin hinta…)
- [x] Testit: jokainen askel kuittautuu tilasta; veteraanitila kuittaa luvut I–II kerralla
- [~] e2e 360 px: askel 1 → 2 todennettu (`charter.spec.ts`); koko luvut I–II läpi kävelemättä

## Ei tässä

Luvut III–V (ONBOARD-006).
