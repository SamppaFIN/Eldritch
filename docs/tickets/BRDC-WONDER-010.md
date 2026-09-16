# BRDC-WONDER-010 — Y'ha-nthlei's Bell

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `rules/terrain.ts` (kertoimen koukku), `data/spellStore.ts`in `survey`-kuvio |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään), `BRDC-WONDER-007`in kertoimen malli |
| **Lähde** | `worldseed.ts` (`sunken_bell`), `rules/harmalaWonder.ts`in `yhanthlei-bell` |

## 🔴 RED — mitattu, ei arvattu

Dokumentti: *"+6 mana/h. Marsh and water cells you hold yield double. Reveals every
cache within 1 km."* Kolme osaa, kolme eri koukkua:

1. **+6 mana/h** — `BRDC-WONDER-003`in `wonderBonus` kantaa tämän suoraan
2. **"Marsh and water cells you hold yield double"** — sama kuvio kuin
   `BRDC-WONDER-007`in kulttuurin tuplaus, mutta kahdella maastolajilla yhden sijaan:
   kaikki mitä `marsh`/`lake`/`coast`-solu tuottaa (maasto + bounty + rakennus)
   kaksinkertaistuu
3. **"Reveals every cache within 1 km"** — "cache" on todennäköisesti seikkailun
   löytöesineet (`SECRET_SITES`: trinket, staff, wisdom — `questSites.ts:157`), ei
   yleinen sumun poisto. Näillä on jo kiinteät koordinaatit (`QUEST_SITES`) — "paljasta
   1 km säteellä" tarkoittaisi käytännössä "näytä nämä kolme jos ne sattuvat olemaan
   säteellä", ei uutta löytöjärjestelmää

**Mittaamaton riski, kirjattu eikä arvattu:** jos "cache" tarkoittaakin fyysistä sumun
poistoa (kuten Dagon Spiren "reveal every water hex"), tämä ihme jakaa saman
skaalautuvuuskysymyksen — ks. `BRDC-WONDER-011`in oma RED. 1 km on pienempi säde
(~20 rengasta, ~1 260 heksaa `cellsWithin`illa) kuin Dagon Spiren 2 km, mutta samaa
`survey()`-kuviota (`spellStore.ts:126`, per-heksa `await store.get`/`store.set`,
ei toistaiseksi vietävissä joukkokirjoitukseksi) ei ole mitattu tälläkään koolla.

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+6 mana/h**, kun ihme on löydetty ja hereillä (`BRDC-WONDER-003`)
- [ ] Marsh/lake/coast-solujen tuoton tuplaus samalla tavalla kuin `BRDC-WONDER-007`
      ehdottaa kulttuurille — yksi kertolasku pouchin koonnissa, ei erikseen jokaisessa
      lähteessä
- [ ] **Ennen "reveal every cache" -osaa: vahvista Infiniteltä tarkoittaako "cache"
      `SECRET_SITES`-esineitä vai sumun poistoa.** Jos esineitä: yksinkertainen tarkistus
      (`haversine(wonderHex, questSiteAt(id)) <= 1000`) jokaiselle `SECRET_SITES`ille,
      paljastetaan jos sisällä. Jos sumua: sama arkkitehtuurikysymys kuin
      `BRDC-WONDER-011`illa, eikä tätä osaa toteuteta ennen sitä

## Päätös Infiniteltä

- **Mitä "cache" tarkoittaa** — ks. yllä, ratkaisee onko tämä osa S vai L
- Tuplaako myös vieressä olevan Bell-heksan oman bonuksen (jos se itse on marsh/water) —
  sama kysymys kuin `BRDC-WONDER-007`illa maamerkin omasta heksasta

## Ei tässä

- Sumun poisto isolla säteellä, jos "cache" tarkoittaa sitä — silloin tämä nojaa
  `BRDC-WONDER-011`in ratkaisuun eikä toteuta sitä uudelleen
