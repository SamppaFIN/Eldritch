# BRDC-BUILD-002 — Aluekohtaiset parannukset ja päivitysketjut

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-TERRAIN-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.2, §6 (R2) |

## 🔴 RED

Perusrakennukset voi pystyttää minne tahansa. Mikään ei vielä palkitse siitä, että
kotikulmilla **sattuu olemaan** metsä, järvi tai kallio — eli siitä ainoasta asiasta,
jota pelaaja ei voi valita ja joka tekee jokaisesta läänistä erilaisen.

## 🟢 GREEN

- [ ] Suunnitelman seitsemän parannusta: Puusaha, Sahalaitos, Kaivos, Louhos,
      Viljapelto, Kalastuslaituri, Viinitarha
- [ ] Jokainen sitoo **maastonsa** ja kieltäytyy muualla nimetyllä syyllä
- [ ] **Ketjut**: Sahalaitos vaatii Puusahan, Louhos vaatii Kaivoksen. Riippuvuus on
      datassa, ei koodissa
- [ ] Päivitys **korvaa** edeltäjänsä eikä pinoa tuottoja päällekkäin
- [ ] Kalastuslaiturin *"+1 token/päivä"* on **päiväkohtainen, ei tuntikohtainen** —
      sama kalenteripäivälogiikka kuin `DAY_VISIT_BONUS`illa (`rules/day.ts`)
- [ ] Tuotto noudattaa `BRDC-ECON-001`:n kattoa ja lepotilaa — parannus ei ole
      poikkeus siihen
- [ ] Solupaneeli kertoo **mitä tähän voi rakentaa ja miksi ei muuta**

## Toteutus

Nämä ovat pelkkää dataa `BUILDINGS`-taulukossa: `requiredTerrain` ja `requires`.
Jos tämä tiketti tarvitsee uutta koodia `BRDC-BUILD-001`:n päälle, ydin on rakennettu
väärin — se on tämän tiketin oikea hyväksymiskoe.

**Ketjun mielekkyys tulee hinnasta, ei tuotosta.** Sahalaitos maksaa 80 puuta ja
30 rautaa tuottaakseen +8 siinä missä Puusaha tuottaa +5 neljälläkymmenellä. Rauta
tulee vuorelta, jota metsäläänissä ei ole — eli päivitys pakottaa laajentamaan
maastoa, ei vain odottamaan. Se on kävelyä, ja se on oikea suunta.

## Ei tässä

- Kauppareitti kahden heksan välillä. Se on aluevaikutus → `BRDC-BUILD-003`
- Erikoisresurssit ihmeistä → `BRDC-WONDER-001`
