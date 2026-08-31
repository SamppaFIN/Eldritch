# BRDC-CITY-001 — Kaupunkivaltiot, kauppa ja liittoutumat

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-TERRAIN-002, BRDC-ECON-001, BRDC-HEX-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (C1–C4), §3 |

## 🔴 RED

Kartalla ei ole ketään. `MockRepository` siementää naapureita (`seed.ts`), mutta ne ovat
värillisiä alueita ilman toimijuutta — ne eivät puhu, kauppaa eivätkä reagoi mihinkään.

Yksinpelinä peli on pelaaja vastaan rappeutuminen. Se on toimiva jännite ja ainoa
jännite. Kaupunkivaltio antaa jotain, mitä ei tarvitse voittaa ollakseen hyödyllistä.

## 🟢 GREEN

- [ ] Kaupunkivaltiot ilmestyvät kartalle **deterministisesti** — sama malli kuin
      maastolla ja paljastuksella, ei arvontaa
- [ ] Jokaisella on **luonne ja erikoisuus**: kalastajakylä myy ruokaa, kaivoskylä rautaa
- [ ] **Kauppa**: resurssin vaihto kurssilla, joka on näkyvissä ennen hyväksymistä
- [ ] **Suhde** kasvaa käymisestä ja kaupasta, laskee laiminlyönnistä
- [ ] **Liittoutuma** vaatii suhteen kynnyksen ja antaa jatkuvan edun
- [ ] Kaupunkivaltion solua **ei voi vallata** — tai jos voi, se on sotatoimi, jolla on
      hinta. Tämä on peliratkaisu ja se päätetään ennen koodia
- [ ] Suhde ja varasto **kelautuvat kellosta** luettaessa, ei ajastimella
- [ ] Kaikki säännöt puhtaina funktioina

## Toteutus

**Sijainti on tämän tiketin ainoa oikea kysymys.** Kaupunkivaltion pitää olla paikassa,
joka tuntuu oikealta, ja pelillä on kaksi tapaa tietää mikä on oikein:

1. **Hash H3-indeksistä**, harvennettuna niin ettei kahta ole vierekkäin. Toimii heti,
   ei ole missään erityisessä
2. **Vektoritiilistä** (`BRDC-TERRAIN-002`): oikea kauppakeskittymä, kirkko, satama.
   Kylä on siellä, missä on kylä

Suositus: **2, ja 1 varalle.** Sama porrastus kuin maastolla, ja samasta syystä: kun
kaupunkivaltio on oikeassa lähikaupassa, peli lakkaa olemasta kartan päällä ja alkaa
olla kartassa. Se on koko ulkopelin lupaus.

**Kävelymatka on kauppahinta.** Kaupunkivaltion kanssa kauppa vaatii paikalla käymistä
— ei valikkoa kotoa. Se on ainoa mekanismi tässä tiketissä, joka lisää kävelyä eikä
korvaa sitä, ja siksi se ei ole neuvoteltavissa.

## Ei tässä

- Kaupunkivaltioiden väliset suhteet keskenään. Simulaatio, jota kukaan ei näe
- Valloitettavat kaupunkivaltiot sotilaallisena järjestelmänä
- Toisten pelaajien liittoutumat → Supabase, myöhemmin
