# BRDC-FX-001 — Kun jotain tapahtuu, ruutu näyttää sen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-007, BRDC-ACHIEVE-001, BRDC-ART-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"lisäksi todo listalle efektit mitä piirretään ruudulle kun pelaaja saavuttaa
jotain."*

Peli on visuaalisesti vaatimaton juuri niinä hetkinä, jotka sen pitäisi omistaa. Valtaus
saa kilahduksen ja lyhyen välähdyksen; tason nousu, saavutus, Riitin valmistuminen, ihmeen
löytäminen ja seikkailun päätös eivät saa mitään. `claude.md` §12 on kirjoitettu tätä
varten — pyhä geometria **hetkinä**, ei taustakuvana — eikä sitä ole vielä käytetty
mihinkään muuhun kuin sigileihin.

## 🟢 GREEN

- [ ] **Yksi efektikerros, ei viittä.** Yksi komponentti joka osaa soittaa nimetyn efektin
      (`levelUp`, `achievement`, `riteComplete`, `wonderFound`, `questEnd`), ja yksi jono
      joka estää kahta soimasta päällekkäin.
- [ ] **Inline-SVG, stroke, ei fillia**, animoituna `stroke-dasharray`lla — `claude.md` §12.
      Ei rasteria, ei kuvatiedostoja, ei kirjastoa.
- [ ] **Kesto on lyhyt ja ohitettavissa.** Alle kaksi sekuntia, napautus ohittaa. Pelaaja
      kävelee; mikään ei saa jäädä ruudulle odottamaan.
- [ ] `prefers-reduced-motion: reduce` → efekti näytetään staattisena, ei ohiteta kokonaan.
      Tieto ei saa kadota liikkeen mukana.
- [ ] **Kuria:** efekti on hetki, ei koriste. Jos jokin näkyy ruudulla jatkuvasti, se ei
      kuulu tänne. Katto per minuutti, jotta pitkä lenkki ei muutu ilotulitukseksi.
- [ ] Testit ovat rajallisia (tämä on visuaalinen): jono ei päällekkäistä · katto pitää ·
      reduced-motion valitsee staattisen haaran.

## Ei tässä

- Ääni. `BRDC-CLAIM-007` avasi proseduraalisen äänen **yhteen hetkeen** (valtauksen
  kilahdus) ja `claude.md` §6 sääntö 6 pitää loput jäissä. Efektit ovat kuvaa, eivät ääntä.
- Loitsuefektit kartalla (`BRDC-ART-001`).
- Uudet saavutukset. Tämä piirtää ne jotka on jo olemassa (`BRDC-CHAR-001`).
