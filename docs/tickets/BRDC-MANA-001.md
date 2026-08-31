# BRDC-MANA-001 — Mana ja temppelin laajennus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-DWELL-001 |
| **Status** | `done` — 2026-09-01 (HUD/panel `[~]` selaimessa todentamatta) |
| **Valmius** | 95 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (M1–M2) |

## 🔴 RED

Temppeli on tunnustus ilman seurausta. `BRDC-DWELL-001` paljastaa sen, kun paikassa on
vietetty 90 minuuttia, ja sitten se on merkki kartalla. `placesWithHome` osaa järjestää
ne, `CellPanel` osaa näyttää ne, eikä mikään käytä niitä mihinkään.

Manaa ei ole olemassa, vaikka koko suunnitelma — loitsut, ihmeet, Temppelilehto —
lepää sen päällä.

## 🟢 GREEN

- [x] **Mana on temppelien resurssi**, eikä sitä saa mistään muualta perustasolla
- [x] Tuotto skaalaa temppelin **arvoon**: `revealPlaces` järjestää ne jo dwell-ajan
      mukaan, ja se järjestys on ansaittu — käytetään sitä
- [x] **Temppelin laajennus** kuluttaa resursseja ja nostaa manatuottoa askelittain
- [x] Ankkurikivi (koti) on **vahvin manan lähde** — se on paikka, jossa oikeasti eletään
- [x] Mana noudattaa `BRDC-ECON-001`:n kattoa; ilman kattoa loitsut ovat ilmaisia viikossa
- [~] Manan määrä ja lähteet näkyvät HUDissa; **mistä se tulee** on luettavissa
      — HUD: manapisara + `· N temppeliä` / `· anchor`; solupaneeli: `Mana +N/h` per paikka.
      Renderöinti selaimessa todentamatta.
- [x] Puhtaat funktiot, testattuna kelatulla kellolla
- [x] **Kiertämisen esto testattu** (tiketin vaatimus): puhelin paikallaan yön yli saa
      `MAX_DWELL_GAP_MS` verran kredittiä per pingi, ei kelloaikaa — ei riitä edes
      Ankkuriin, saati manaan

## Toteutettu 2026-09-01

Kaksi committia. **1)** `submitTrail` + `closeLoop` ulos `MockRepository`:stä
(`data/walkFlow.ts`) — tila loppui (397/400), `expandTemple` tarvitsi rivit. Ei
käytösmuutosta, boot- ja claiming-testit todistavat.

**2)** MANA-001:
- `rules/mana.ts` (puhdas): `manaRate(place, expansion)` — Ankkuri 6/h, temppeli
  `4 - (rank-1)`, lattia 1; `× (1 + expansion·0.5)`, kokonaisluku. `manaBonus` —
  summa herätetyistä, omistetuista paikoista (sama 48 h lepotila kuin maastolla ja
  rakennuksilla). `expandTemple(level, pool)` — `ward`:n muoto, `at-max` /
  `cannot-afford`. `expansionCost(n) = { stone: 40n, gold: 30n }`. `placesWithMana`.
- Kytkentä ilman uutta parametria: `settlePouch` lukee jo storesta — se laskee nyt
  `placesWithHome` + `manaBonus` ja lisää sen `buildingBonus`:n rinnalle samaan
  tuntibonukseen. Mana kulkee `settleResources`:n läpi → sama katto (`BASE_STORAGE_CAP`).
- `data/templeStore.ts` (ohut sauma): `readExpansions`, `expandTempleAt` — vain
  `places`:n temppeli, Ankkuri ja tyhjä maa `not-a-temple`.
- `GameRepository.expandTemple`; `RevealedPlace` + `expansion?` + `manaPerHour?`
  (additiivinen, ei skeemanostoa); `getPlaces` kietoo `placesWithMana`:lla.
- UI: `useSelection` niputtaa `dwellMs`+`hasAnchor`+paikkatiedot yhteen `place`-
  bindaukseen (MapView pysyy 400:ssa: `<CellPanel>` −2 propsia, `<Hud>` +1). CellPanel
  näyttää `Anchor Stone` / `Temple · rank N` + `Mana +N/h` ja temppelille
  `Expand · 40 stone · 30 gold`. HUD: manapisara + lähdelaskuri.
- Testit: `rules/mana.test.ts` +16, `data/mana.repo.test.ts` +7, `hearth.test.ts`
  `toMatchObject`:ksi (paikka kantaa nyt kaksi lisäkenttää). **570 vihreää.**

## Toteutus

Tämä vastaa suunnittelumuistiinpanojen omaan avoimeen kysymykseen (*"mitä Temppelit
tekevät?"*) tavalla, joka ei riko `BRDC-DWELL-001`:n perusideaa: **temppeliä ei valita,
se paljastuu.** Manaa ei voi ostaa rakentamalla temppeli sinne, missä se olisi
strategisesti kätevin — se syntyy siitä, missä elämä oikeasti tapahtuu.

Se on myös luonteva syy, miksi kotoa ei kannata muuttaa: mana kasvaa siellä, missä
olet ollut pisimpään, eikä sitä siirretä.

**Dwell-ajan kattosääntö on tässä kriittinen.** `MAX_DWELL_GAP_MS` (40 min) estää jo
sen, että puhelin taskussa yön yli tekisi kodista temppelin. Mana antaa sille säännölle
rahallisen arvon ensimmäistä kertaa — eli ensimmäistä kertaa myös syyn yrittää kiertää
sitä. Kirjoita testi, joka yrittää.

## Ei tässä

- Loitsut → `BRDC-SPELL-001`. Tämä tuottaa polttoaineen, ei käyttöä sille
- Temppelilehto ja Kirjasto → `BRDC-BUILD-003`
