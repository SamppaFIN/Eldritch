# BRDC-DIPLO-002 — City states and the tale, reachable from wherever you live

| | |
|---|---|
| **Alue** | `rules/cityState.ts`, `data/cityStateStore.ts`, `features/quest/questCell.ts` |
| **Status** | `done` — 2026-09-24 (v0.6.61) |

## 🔴 RED

Infinite 2026-09-24 kenttätestistä: seikkailu ei aktivoitunut Fuming Lakella (kaverilla
onnistui, ja tarina meni "heti läpi"), ja *"city statejen kanssa ei kanssa pystynyt
toimimaan"*; kaverin iPhone piirsi paikat eri sijaintiin.

Löydetty koodista:
- **Tarinan paikat ovat pelaajakohtaisia.** `anchorQuestSites` siirtää ne oman Hearthin
  ympärille (`BRDC-QUEST-004`), joten kaverin puhelin piirtää ne *hänen* Hearthinsä
  viereen — tarkoitus, ei bugi. Ei erillistä koordinaatistoa, vaan eri kotipiste
- **Ainoa city state oli yksi kiinteä kalastajakylä Härmälänrannassa (Tampere)** —
  sama vika, jonka tarina sai korjauksen `QUEST-004`:ssä. Kukaan Tampereen
  ulkopuolinen ei voinut koskaan kohdata sitä
- **"Seisot paikalla" vaati täsmälleen oikean heksan** (~46 m). GPS on 5–30 m päästä,
  joten Fuming Lake -vaihe oli lukossa vaikka seisoi kohteessa

## 🟢 GREEN

- [x] `anchorCityStates(home)` / `cityStates()`: kylä kannetaan pelaajan Hearthille
      samalla suunnalla ja etäisyydellä kuin tarina (270 m patsaasta), Härmälän sisällä
      oleva Hearth jättää oikean sataman paikalleen. `placeCityStates` ja `cityAtDoor`
      lukevat ankkurin tallennetusta `K.home`sta, joten sijoitus, haku ja kauppa eivät
      voi olla eri mieltä; `useBoot` asettaa saman ankkurin käynnistyksessä
- [x] `atSite(site, standingOn)`: "paikalla" = kohteen heksa tai sen rengas (~90 m) —
      tarinan vaihe, patsaan aloitus ja nappi. Salaiset löydöt (kävele päälle) ennallaan
- [x] Testit: 2 kylän ankkuroinnille (Oulu → kylä Hearthin vieressä, Härmälä → ennallaan),
      3 GPS-toleranssille

## Ei ratkaistu

- **"Dialogi meni heti läpi" kaverilla** — en löytänyt siihen syytä koodista: valinnat
  lukitaan jokaisessa vaiheessa `atStageHex`illa, eikä mikään ohita vaiheita. Todennäköisin
  selitys on että kaverin tarina oli jo pidemmällä tai että vaihe ei vaatinut kävelyä
  (epäonnistumissilmukoilla ei ole paikkaa). Tarvitsee toistettavan tapauksen
- Kylän ja tarinan paikka voi osua veteen tai yksityismaalle toisessa kaupungissa; ne on
  kirjoitettu Tampereen puistoon, ei kartan päälle
- **`diplomacy.spec.ts` mobile-360 kaksi testiä epäonnistuu — myös ilman tämän tiketin
  muutoksia** (todennettu ajamalla ne muutokset sivuun pantuna). Syynä opetuskortti
  ("Understood · +10 wisdom") joka peittää kartan, sekä heksan napautuksen tarkkuus
  mobiilissa. Lisättiin kortin ohitus `tapTheQuay`hin; desktop läpi, mobiili yhä auki
