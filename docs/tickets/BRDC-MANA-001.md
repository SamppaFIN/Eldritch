# BRDC-MANA-001 — Mana ja temppelin laajennus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-DWELL-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (M1–M2) |

## 🔴 RED

Temppeli on tunnustus ilman seurausta. `BRDC-DWELL-001` paljastaa sen, kun paikassa on
vietetty 90 minuuttia, ja sitten se on merkki kartalla. `placesWithHome` osaa järjestää
ne, `CellPanel` osaa näyttää ne, eikä mikään käytä niitä mihinkään.

Manaa ei ole olemassa, vaikka koko suunnitelma — loitsut, ihmeet, Temppelilehto —
lepää sen päällä.

## 🟢 GREEN

- [ ] **Mana on temppelien resurssi**, eikä sitä saa mistään muualta perustasolla
- [ ] Tuotto skaalaa temppelin **arvoon**: `revealPlaces` järjestää ne jo dwell-ajan
      mukaan, ja se järjestys on ansaittu — käytetään sitä
- [ ] **Temppelin laajennus** kuluttaa resursseja ja nostaa manatuottoa askelittain
- [ ] Ankkurikivi (koti) on **vahvin manan lähde** — se on paikka, jossa oikeasti eletään
- [ ] Mana noudattaa `BRDC-ECON-001`:n kattoa; ilman kattoa loitsut ovat ilmaisia viikossa
- [ ] Manan määrä ja lähteet näkyvät HUDissa; **mistä se tulee** on luettavissa
- [ ] Puhtaat funktiot, testattuna kelatulla kellolla

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
