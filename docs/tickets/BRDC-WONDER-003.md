# BRDC-WONDER-003 — A wonder's own bonus finally reaches the pouch

| | |
|---|---|
| **Alue** | `rules/wonder.ts`, `rules/harmalaWonder.ts`, `data/wonderStore.ts`, `data/pouch.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-001` (taulukko), `BRDC-WONDER-002` (Härmälän 9) |
| **Lähde** | `BRDC-WONDER-002`in oma jatkotyölista: *"Jokainen oma tikettinsä, halvimmasta kalleimpaan"* — tämä on se ensimmäinen |

## 🔴 RED — mitattu, ei arvattu

**Yksikään löydetyn ihmeen `bonus`-kenttä ei koskaan maksa mitään.** Luettu koodista:

- `rules/wonder.ts`in 12 ihmeellä on jo `bonus: Partial<ResourcePool>` jokaisella
  (esim. R'lyeh: `{mana: 6, culture: 3}`) — taulukossa vuodesta `BRDC-WONDER-001` asti
- `data/wonderStore.ts`in `findWonderAt` **ei koskaan lue tätä kenttää.** Se kirjoittaa
  vain `{h3, at}` — kuka löysi minkä ja mistä — ja lokirivin. Ei kutsua `settleResources`iin,
  ei riviä `pouch.ts`ssa
- `BRDC-WONDER-001`in oma GREEN sanoo tämän jo ääneen: *"[~] Perusvaikutus (bonus) ja
  aluevaikutus (aura) taulukossa"* — rivi 22, merkitty osittaiseksi jo silloin
- Sama pätee `HARMALA_WONDERS`in yhdeksään: jokaisen `effect`-tekstin ensimmäinen lause on
  aina jokin "+N resurssia/h" — kahdeksalla yhdeksästä (ei Drowned Eyellä)

**Seuraus:** jokainen tästä eteenpäin kirjoitettava ihme-tiketti (`BRDC-WONDER-004`…`-012`)
tarvitsisi tämän saman langan erikseen, ellei sitä tehdä kerran tässä.

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] `wonderBonus(cells, finds, now)` (`rules/wonder.ts` tai oma pieni tiedosto):
      sama muoto kuin `landmarkBonus`/`buildingBonus` — käy läpi pelaajan omat löydöt
      (`WonderFinds`), ja jokaisesta jonka hexi on yhä pelaajan oma ja hereillä
      (`DORMANT_AFTER_MS`, sama sääntö kuin kaikella muullakin tuotolla), lisää sen
      `bonus`in pouchiin. `HARMALA_WONDERS`in kahdeksalla flat-osalla (kaikilla paitsi
      Drowned Eyellä) sama funktio toimii sellaisenaan, kun niiden oma "+N/h" on
      poimittu `effect`-tekstistä rakenteelliseksi kentäksi (seuraava kohta)
- [ ] `HarmalaWonder`ille rakenteellinen `bonus: Partial<ResourcePool>` erilleen
      `effect`-proosasta — sama jako kuin `Wonder`illa jo on. Ei poisteta `effect`-tekstiä,
      se on yhä UI:n lähde; `bonus` on se osa josta sääntö laskee
- [ ] `pouch.ts`in `perHourBonus`-ketjuun uusi lähde, samaan tapaan kuin `landmarkBonus`
      ja `buildingBonus` jo ovat siellä rinnakkain
- [ ] Testit: yksi löydetty ihme maksaa oikean summan, nukkuva (ei kävelty 48h) ei maksa
      mitään — sama sopimus kuin jokaisella muullakin tuotolla
- [ ] **Sivutuote:** `BRDC-WONDER-001`in rivi 22 sulkeutuu — sama korjaus toimii sekä
      alkuperäiselle 12:lle että Härmälän 9:lle, koska molemmat käyttävät samaa
      `Partial<ResourcePool>`-muotoa

## Päätös Infiniteltä

- Onko ihmeen bonus **sen oman hexin** tuotto (pitää kävellä sinne pysyäkseen hereillä,
  sama sääntö kuin rakennuksilla) vai **koko realmin** passiivinen bonus riippumatta
  viimeisimmästä käynnistä? `Dagon Spire`in oma teksti sanoo nimenomaan "realm-wide" —
  jos tämä on tarkoituksellista yhdelle ihmeelle mutta ei muille, se on eri sääntö
  jokaiselle, ei yksi funktio

## Ei tässä

- Aluevaikutus (`aura`) — `resourceAura` lukee jo `BUILDINGS`ia; ihmeen oma aura on
  sama kysymys toisessa taulukossa, ei tämän tiketin
- Härmälän 9:n omat kertoimet, ehdolliset bonukset ja uudet mekaniikat — jokainen oma
  tikettinsä alla
