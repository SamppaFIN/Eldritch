# BRDC-BUILD-001 — Rakennusjärjestelmän ydin ja perusrakennukset

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-TERRAIN-002, BRDC-TECH-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.1, §6 (R1), §8.2 |

## 🔴 RED

Resursseilla voi tehdä **yhden asian**: vahvistaa solua 25 puulla (`BRDC-WARD-001`).
`BRDC-INSPECT-001` päättyy riviin *"Rakennukset. Paneeli kertoo mitä maa antaa; mitä
sillä rakennetaan on oma tikettinsä."*

Tämä on se tiketti.

## 🟢 GREEN

- [ ] **`BUILDINGS`-taulukko**: tunnus, hinta, vaikutus, sallittu maasto, avaava teknologia
- [ ] `canBuild(player, building, cell)` on **puhdas funktio**, joka vastaa
      *miksi ei* eikä vain *ei*: väärä maasto, puuttuva teknologia, ei varaa,
      ei sinun, paikka varattu — jokainen erikseen nimettynä arvona
- [ ] `build()` veloittaa poolista ja kirjoittaa rakennuksen soluun; epäonnistuessa
      **mikään ei muutu**
- [ ] Solu kantaa rakennuksensa; yksi solu, yksi rakennus
- [ ] Suunnitelman **neljä perusrakennusta**: Aitta, Monumentti, Varasto, Tori
- [ ] **Varasto nostaa tuotantokattoa** — se on `BRDC-ECON-001`:n lukitun päätöksen
      toinen puoli, ei koriste
- [ ] Purkaminen on mahdollista ja **palauttaa osan hinnasta**; muuten väärä sijoitus
      on pysyvä rangaistus kartalla, jota ei voi valita uudelleen
- [ ] Jokainen sääntöfunktio testattu; ei satunnaisuutta, ei kelloa ilman `now`ia

## Toteutus

Suunnitelman §8.2 esittää `class BuildingSystem`in. Golden rule 3 sanoo, että
`packages/core` on puhtaita funktioita ilman Reactia, DOMia ja verkkoa. **Semantiikka
otetaan, luokka ei**: `BUILDINGS` on vakiotaulukko ja säännöt ovat funktioita sen yli.
Sama sisältö, testattavissa ilman instansointia ja siirrettävissä SQL:ksi Vaiheessa 3.

`ward()` on jo tämän muotoinen — kieltäytymiset ovat arvoja, eivät poikkeuksia:

> *"Refusals are values, not exceptions: 'not yours', 'already full' and 'cannot afford'
> are all things the interface has to be able to say out loud to the player."*

Rakentaminen noudattaa samaa mallia. Se on myös syy, miksi `WARD_COST` ei katoa:
**vahvistaminen on rakentamisen erikoistapaus**, ei kilpailija sille.

## 🔴 Ratkaistava: asumiskapasiteetti

Suunnitelman Aitta antaa *"+1 ruokaa, +2 asumiskapasiteettia"*. Pelissä ei ole väestöä
eikä mitään, mitä kapasiteetti rajoittaisi. Kolme vaihtoehtoa:

1. **Pudota kapasiteetti.** Aitta antaa ruokaa. Yksinkertaisin, eikä mitään menetetä
2. **Kapasiteetti rajoittaa rakennusten määrää** läänissä — kevyt, ja antaa Aitalle roolin
3. **Oikea väestö**, joka kasvaa ruoasta ja kuluttaa sitä. Oma järjestelmänsä, iso

Suositus: **2**. Se maksaa yhden luvun ja tekee suunnitelman omasta rivistä toden ilman,
että peliin syntyy simulaatiota, jota kukaan ei pyytänyt.

## Ei tässä

- Aluekohtaiset parannukset ja ketjut → `BRDC-BUILD-002`
- Vaikutusalueen rakennukset ja uskollisuus → `BRDC-BUILD-003`
- Teknologiapuu, joka avaa nämä → `BRDC-TECH-001`. Ilman sitä kaikki on auki alusta,
  mikä on kelvollinen välitila mutta ei lopullinen
- 3D-näkymä rakennuksista. Suunnittelumuistiinpanojen Three.js-huomio pätee yhä:
  ei ennen kuin peli on hyvä 2D:nä
