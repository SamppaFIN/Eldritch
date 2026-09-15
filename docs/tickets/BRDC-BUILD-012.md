# BRDC-BUILD-012 — Fortifikaatio suojaa sen mitä se vartioi

| | |
|---|---|
| **Alue** | `rules/capture.ts`, `rules/build.ts`, `rules/aura.ts` |
| **Effort** | M |
| **Status** | `todo` — sääntömuutos, päätös Infiniteltä |
| **Lähde** | Infinite 2026-09-15: *"jos rakennat fortifiikaation niin sen haluan, että sitä resurssia ei voi toinen vallata."* |

## 🔴 RED

Tällä hetkellä mikään ei ole vallattavissa olevan ulkopuolella. Fortress antaa
puolustusauran (`BRDC-BUILD-004`: `defenceAura` vähentää saapuvaa vahinkoa), mutta se on
määrän säätöä — riittävän monta kävelyä ja solu vaihtaa omistajaa silti.

Infinite haluaa kovemman lupauksen: **se resurssi ei ole otettavissa**.

## Kysymykset, joihin vastaus ratkaisee mekaniikan

1. **Mikä on suojattu — solu vai resurssi?** Onko fortifikaation solu kokonaan ottamaton,
   vai menettääkö valloittaja vain sen **tuoton**? Jälkimmäinen on kiinnostavampi: maa
   vaihtaa omistajaa, mutta palkinto ei tule mukana.
2. **Voiko fortifikaation tuhota?** Jos ei, kartalle syntyy ikuisia saarekkeita. Jos voi,
   millä — piirityksellä, riitillä, ajalla?
3. **Rapistuuko se?** Ottamaton solu jonka omistaja ei koskaan kävele siellä on suoraan
   ristiriidassa sen kanssa mikä pitää kartan elävänä kahdella pelaajalla (§11).

## Miksi tämä on iso päätös eikä säätö

`claude.md` §11 sanoo piirityksestä: *"Do not simplify this back to a single comparison."*
Ottamattomuus ei ole yksinkertaistus vaan **poikkeus** — ja poikkeus juuri siihen
sääntöön joka pitää kartan liikkeessä. Se voi olla oikea; se pitää tehdä silmät auki.

Kytkeytyy `BRDC-CLAIM-016`:een ja `BRDC-WORLD-001`:een.
