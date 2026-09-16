# BRDC-WONDER-004 — The Thousand Masks Road

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `rules/level.ts`, `data/stepStore.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään) |
| **Lähde** | `worldseed.ts` (`ten_thousand_steps`), `rules/harmalaWonder.ts`in `thousand-masks-road` |

## 🔴 RED — mitattu, ei arvattu

Dokumentin oma teksti: *"+3 to every resource per hour. Walking distance counts 1.5×
toward Consciousness."* Jälkimmäinen puolisko **ei sovi tähän peliin ollenkaan** —
mitattu, ei arvattu:

- Tietoisuus (XP) ei tule kävellystä matkasta tässä pelissä. Haettu koko koodikannasta:
  ainoa XP-lähde on `XP_PER_CELL_CLAIMED` (`stepStore.ts:59`, `spellStore.ts:188`) —
  **valtauksesta**, ei metreistä. Mitään "metri → XP" -kaavaa ei ole olemassa, ei edes
  poistettuna — sitä ei ole koskaan ollut
- Dokumentti oletti eri tietoisuusmallin kuin mikä on rakennettu. Sama tilanne kuin
  `BRDC-CARD-004`in elinikäiset luvut: peli ei mittaa sitä minkä dokumentti olettaa
  mitattavan

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+3 jokaiseen yhdeksään resurssiin/h**, kun ihme on löydetty ja hereillä
      (`BRDC-WONDER-003`in `wonderBonus` kantaa tämän jo, kun rakenteellinen `bonus`
      on `{wood:3, stone:3, iron:3, food:3, gold:3, wisdom:3, mana:3, culture:3, tokens:3}`)
- [ ] **"Walking distance ×1.5 toward Consciousness" korvattu lähimmällä todellisella
      vastineella: valtauksista saatu XP ×1.5.** `addXpTo(store, id, XP_PER_CELL_CLAIMED)`
      (`stepStore.ts:59`) saa kertoimen kun pelaaja on löytänyt tämän ihmeen — sama
      "onko tämä oikea korvaaja" -päätös jonka `BRDC-BUILD-013` teki jo Watchtowerin
      kanssa (ei arvattu hiljaa, kirjattu tähän)

## Päätös Infiniteltä

- **Onko "valtaus antaa 1,5× XP:tä" hyväksyttävä korvaaja dokumentin "matka ×1,5"
  -lupaukselle, vai halutaanko oikea etäisyyspohjainen XP-polku rakentaa tätä varten?**
  Jälkimmäinen olisi oma, isompi tikettinsä — uusi XP-lähde koko pelille, ei vain
  yhdelle ihmeelle — eikä tämä tiketti oleta kumpaakaan ilman vastausta
- Kertautuuko ×1,5 muiden XP-kertojien kanssa (ei tällä hetkellä yhtään olemassa, mutta
  `BRDC-CARD-004`in tuleva "peak cells" -tilastointi voisi tuoda niitä)

## Ei tässä

- Etäisyyspohjainen XP-järjestelmä, jos Infinite valitsee sen — oma tikettinsä
