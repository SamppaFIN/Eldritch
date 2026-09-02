# BRDC-KEEP-003 — Keep löytyy, ja Rites sen mukana

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-KEEP-002, BRDC-CASTLE-002, BRDC-TECH-001, BRDC-MANA-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä, kaksi kertaa: *"mistä voi tutkia teknologioita ja mistä löytää riittejä?"* ja
*"Keep details dialogissa ei ole nyt tabirakennetta"*, ja lopuksi *"nyt tosiaan on
mahdoton tutkia teknologioita ja saada manaa"*.

Tarkistettu koodista: **välilehdet ovat olemassa.** `HearthPanel.tsx` rakentaa
`TABS = [Mana · Rites · Buildings · Train]` ja `BRDC-KEEP-002` on `done` 100 %. Ne eivät
siis puutu — **niitä ei löydä.** Paneeli aukeaa `inspect.sanctum`ista, ja pelaaja joka
napauttaa kartalla näkyvää Keep-merkkiä päätyy johonkin muuhun.

Tämä ei ole puuttuva ominaisuus vaan reitti, jota kukaan ei löydä. Se on pahempi:
teknologiapuu, mana ja rakennusvalikko ovat kaikki valmiina ja pelin kannalta
näkymättömiä. Kokonainen Vaihe 3:n osa on olemassa ilman ovea.

## 🟢 GREEN

- [ ] **Keep-merkin napautus vie välilehdelliseen paneeliin.** Yksi selvä reitti kartalta
      siihen paneeliin, jossa Mana / Rites / Buildings / Train ovat. Jos kansakuntanäkymä
      (`BRDC-CASTLE-002`) on eri asia, se on *sen sisällä* välilehtenä tai linkkinä — ei
      kilpaileva umpikuja.
- [ ] **Reitti on löydettävissä ilman karttamerkkiä.** Kun pelaaja ei ole Keepin lähellä,
      jokin pysyvä kohta (footer tai valikko) vie samaan paikkaan. Tutkimusta ei saa
      joutua etsimään kävelemällä kotiin.
- [ ] Ensimmäinen avaus kertoo mitä välilehdet ovat — yksi rivi kussakin, ei opasta.
      Linkki kirjaan (`rite`, `mana`) sieltä missä sana ensin esiintyy.
- [ ] **Todennus on kysymys, ei koodi:** anna peli jollekulle joka ei ole nähnyt sitä ja
      pyydä tutkimaan yksi Riitti. Jos hän ei löydä perille ilman apua, tiketti ei ole valmis.
- [ ] Testi: paneeli renderöi kaikki neljä välilehteä ja jokainen vaihtaa sisällön.

## Ei tässä

- Teknologiapuun sisältö tai tasapaino — `BRDC-TECH-001`.
- Uusi rakennusvalikko. Se on olemassa; tämä tiketti tekee siitä löydettävän.
