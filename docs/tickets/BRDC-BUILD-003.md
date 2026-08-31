# BRDC-BUILD-003 — Vaikutusalueen rakennukset ja uskollisuus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-HEX-001, BRDC-DWELL-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.3, §2.1, §6 (R3) |

## 🔴 RED

Jokainen rakennus vaikuttaa vain omaan soluunsa. Mikään ei tee alueesta enempää kuin
osiensa summan — paitsi `NEIGHBOUR_BONUS`, joka on **näkymätön kaikkialla muualla**
kuten `BRDC-INSPECT-001` jo huomautti.

Ja **temppelit eivät tee mitään.** `BRDC-DWELL-001` paljastaa ne vietetystä ajasta, ja
suunnittelumuistiinpanot esittivät kysymyksen, johon ei ole vastattu:

> *"Avoin kysymys: mitä Temppelit tekevät pelillisesti pidemmällä tähtäimellä?"*

Suunnitelman Kirjasto ja Temppelilehto ovat vastaus: temppeli on **rakennuspaikka**,
jonka peli antoi sinulle siitä että elit siinä. Sitä ei voi ostaa.

## 🟢 GREEN

- [ ] Suunnitelman viisi: Linnoitus, Majakka, Kirjasto, Temppelilehto, Kauppareitti
- [ ] Vaikutus **säteellä 1–2 heksaa**, ja säde on rakennuksen dataa
- [ ] Päällekkäiset vaikutukset **lasketaan yhteen kattoon asti** — kuten
      `NEIGHBOUR_BONUS_CAP` jo tekee. Ilman kattoa tiheä rakentaminen räjähtää
- [ ] Kirjasto ja Temppelilehto vaativat **temppelin viereisyyden** — ensimmäinen kerta,
      kun dwell-aika ostaa jotain, mitä resurssit eivät osta
- [ ] Kauppareitti sitoo **kaksi solua** ja on siksi ainoa rakennus, joka ei asu yhdessä
- [ ] **Uskollisuus**: Monumentti ja temppelit hidastavat rappeutumista viereisissä
      soluissa. Hidastavat — eivät pysäytä
- [ ] Vaikutusalue **näkyy kartalla** kun rakennus on valittuna, ei pelkkänä tekstinä
- [ ] Puhtaat funktiot, testattuna myös päällekkäisillä vaikutusalueilla

## Toteutus

**Uskollisuus on kerroin rappeutumiseen, ei uusi kello.** `decay.ts` laskee jo
kulumisen `lastVisitedAt`istä; uskollisuus muuttaa nopeutta. Yksi luku, yksi paikka,
ja `BRDC-CLAIM-004`:n testit kertovat heti jos tasapaino kaatuu.

**Yläraja on tässä tärkeämpi kuin muualla.** Aluevaikutukset kertautuvat neliöllisesti:
kymmenen linnoitusta viiden solun alalla antaisi ilman kattoa +20 puolustusta joka
ruudulle. Katto lukitaan yhtä aikaa vaikutusten kanssa, ei jälkikäteen tasapainotuksena.

**Majakka on rehellisyyskoe.** Se antaa *"+1 liikkumisnopeus viereisillä vesialueilla"*,
ja tässä pelissä liikkumisnopeus on **pelaajan omat jalat**. Sitä ei voi nostaa
rakennuksella. Majakka joko tekee jotain muuta (näkyvyys vedelle, kalastusbonus) tai se
jätetään pois — mutta se ei saa jäädä taulukkoon lupaamaan jotain, mitä peli ei tee.

## Ei tässä

- Mana ja loitsut, jotka temppeli myös tuottaa → `BRDC-MANA-001`
- Kaupunkivaltioiden kauppareitit → `BRDC-CITY-001`
