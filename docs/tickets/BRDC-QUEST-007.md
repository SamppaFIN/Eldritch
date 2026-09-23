# BRDC-QUEST-007 — The troll's hoard is re-hidden every week

| | |
|---|---|
| **Alue** | `packages/core/src/data/questSites.ts`, `apps/game/src/features/map/useBoot.ts` |
| **Status** | `done` — 2026-09-24 (v0.6.62), **paikallinen commit, ei pushattu** (viikon julkaisukielto) |

## 🔴 RED

Infinite 2026-09-23 (todo 16): *"trollin aarteet arvotaan viikoittain"*. Kysyttäessä mitä
"aarteet" ovat pelissä: **salaiset löydöt** — Shiny Trinket, Ancient Staff ja Wisdom Stone,
joilla pääsee Troll Bridgen ohi ja jotka löytyvät kävelemällä heksalle.

## 🟢 GREEN

- [x] `pinWeeklySecrets(week, stored)`: vain nämä kolme haetaan uuteen paikkaan joka viikko,
      100–400 m patsaasta (tai pelaajan Hearthilta), viikon `weekOf` (maanantai–sunnuntai)
      hajautuksesta. Tarinan polku (statue, lake, hermit, troll, deep) **ei liiku**
      (`QUEST-005`: käyty paikka pysyy paikallaan)
- [x] Viikon paikat kirjoitetaan muistiin (`quest-secrets-v1`) ja luetaan takaisin saman viikon
      aikana, joten Hearthin uudelleenasetus kesken viikon ei heiluta niitä
- [x] `useBoot` kutsuu sitä pinnauksen jälkeen
- [x] 6 Vitest-testiä (`questWeekly.test.ts`, oma tiedosto koska viikko on moduulitilaa):
      viikon vaihtuminen maanantaina, etäisyysrajat, pysyvyys viikon sisällä, uudelleenarvonta,
      polku koskematon, Oulun Hearth

## Omat valintani (ei erikseen kysytty)

- Jo löydetty esine pysyy löydettynä (`questFinds` on pysyvä) — arvonta koskee vain
  löytämättömiä. Jos "viikoittain" tarkoitti että samat kolme voi löytää joka viikko uudelleen,
  se on eri ominaisuus
- Etäisyyskaista 100–400 m on arvaus; vanha käsin kirjoitettu 200–400 m
