# BRDC-QUEST-001 — Seikkailut: järvenpuhdistus ja graafinen dialogi

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-EVENT-001, BRDC-ART-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (S1–S2) |

## 🔴 RED

Pelillä ei ole ääntä. Mikään ei puhu pelaajalle, mikään ei pyydä häneltä mitään,
eikä mikään pääty. Lääni kasvaa ja kuluu, ja se on koko kaari.

v2:n paras aineisto — Fuming Lake, kohtaamiset, hahmot — on `docs/backlog/`issa
odottamassa mekaniikkaa, johon se voidaan asettaa. Golden rule 6 pitää sen siellä
kunnes runko kestää sen. `BRDC-EVENT-001` on se runko.

## 🟢 GREEN

- [ ] **Seikkailu on JSON-tiedosto**: vaiheet, ehdot, valinnat, palkinnot
- [ ] Ensimmäinen seikkailu on **järvenpuhdistus** — se sitoo maaston, resurssit ja
      kävelyn yhteen tarinaan, ja se on suunnitelman oma esimerkki
- [ ] **Graafinen dialogi**: puhuja, muotokuva, valinnat
- [ ] Dialogi on **luettavissa liikkeessä**: alle 20 sanan virkkeet käyttöliittymässä,
      lore-teksti erikseen ja keskeytettävissä (`claude.md` §14)
- [ ] Seikkailu **ei estä peliä**: sen voi jättää kesken ja palata
- [ ] Edistyminen säilyy reloadin ja resetin yli oikein — reset **poistaa** sen
- [ ] Seikkailun kulku on puhdas funktio tilasta ja valinnasta; testattu haaroineen

## Toteutus

**JSON, koska sisältöä tulee lisää eikä sen kirjoittaminen saa vaatia kääntämistä.**
Tämä on suoraan suunnitelman ehdotus (*"JSON-pohjaiset tarinat"*) ja se on oikea:
v2:n virhe ei ollut sisällön määrä vaan se, että sisältö oli koodissa.

Skeema validoidaan **latausaikana ja testissä**, ei ajonaikaisella `any`-kikalla.
Rikkinäinen tarina on sisältövirhe, joka pitää löytyä ennen julkaisua.

## Ei tässä

- Taistelu osana seikkailua. `BRDC-WAGER-BATTLE-001` on PvP:tä; PvE-taistelu on oma
  päätöksensä, eikä sitä ole pyydetty
- Ääninäyttely ja TTS. `docs/backlog/`, Vaihe 6
