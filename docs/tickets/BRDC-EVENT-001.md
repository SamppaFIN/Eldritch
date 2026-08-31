# BRDC-EVENT-001 — Tapahtumaketjut, anomaliat ja pimeät ajat

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-REVEAL-001, BRDC-HEX-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §2.3, §2.4 |

## 🔴 RED

Maailma ei tee mitään itsestään. Kaikki mitä tapahtuu, tapahtuu koska pelaaja käveli.
Sen jälkeen kun lääni on rakennettu, kartta on staattinen kuva, jota rappeutuminen
kalvaa — eikä mikään koskaan **yllätä**.

Suunnitelma nostaa kaksi vaikutetta, jotka korjaavat juuri tämän: Stellariksen
tapahtumaketjut ja Endless Legendin talvi.

## 🟢 GREEN

- [ ] **Anomaliat**: solu, jolla on jotain outoa. Tutkiminen maksaa ja kestää,
      ja palkinto on tiedossa vasta jälkeenpäin
- [ ] **Tapahtumaketjut**: monivaiheisia, valinnoilla, joilla on seuraus
      (*"Metsässä kuuluu outoa huminaa…"*)
- [ ] Ketjut ovat **dataa, eivät koodia** — JSON, jota voi kirjoittaa lisää ilman
      käännöstä. Sama malli kuin `docs/backlog/`in aineistolla
- [ ] **Pimeät ajat**: jaksot, joissa tuotanto laskee ja mystiset tapahtumat yleistyvät
- [ ] Pimeä aika on **maailmanlaajuinen ja ennustettava kalenterista** — johdettu
      päivämäärästä, ei arvottu. Kaikki pelaajat ovat samassa talvessa, ja se on
      ainoa tapa, jolla siitä voi puhua kaverille
- [ ] Pelaaja **näkee talven tulevan**. Yllätysrangaistus on huono peli; ennakoitava
      niukkuus on suunnittelua
- [ ] Kaikki tila johdettavissa kellosta ja hashista — ei ajastimia, ei taustaprosesseja

## Toteutus

**Pimeä aika on rappeutumisen serkku, ei uusi järjestelmä.** `decay.ts` laskee jo
kulumisen kellosta; talvi on kerroin tuotantoon samasta kellosta. Jos tämä tiketti
tarvitsee oman ajastimensa, se on toteutettu väärin.

**Ketju on tilakone, jonka tila asuu solussa** (`BRDC-HEX-001`). Se on myös syy tehdä
HEX-001 ensin: ilman solun muistia ketju ei voi olla monivaiheinen.

Tämä on ensimmäinen tiketti, jossa `docs/backlog/`in v2-aineisto pääsee takaisin peliin
— ei ominaisuutena vaan **sisältönä valmiiseen mekaniikkaan**. Se on tarkalleen se
järjestys, jonka golden rule 6 vaatii, ja se on syytä sanoa ääneen tässä.

## Ei tässä

- Seikkailut ja dialogi → `BRDC-QUEST-001`. Tämä on runko, se on tarina
- Satunnaiset tapahtumat, jotka rankaisevat poissaoloa. Peli rankaisee jo
  rappeutumisella; kaksi rangaistusta samasta asiasta on yksi liikaa
