# BRDC-WIKI-001 — Pelinsisäinen tietokirja

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-TECH-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (W1–W2), §3 |

## 🔴 RED

Sääntöjä on jo enemmän kuin mahtuu muistiin — piiritysmalli, rappeutuminen, päiväbonus,
naapuribonus, dwell-kynnykset — eikä yksikään niistä ole luettavissa pelistä. Tämä
suunnitelma kolminkertaistaa määrän.

Ilman tietokirjaa jokainen luku on taikuutta, ja pelaaja lakkaa suunnittelemasta.

## 🟢 GREEN

- [ ] Tietokirja **johdetaan samoista taulukoista** kuin peli: `BUILDINGS`, `TECHS`,
      `SPELLS`, maastot, ihmeet, vakiot
- [ ] **Yksikään luku ei ole kirjoitettu käsin kahteen paikkaan.** Testi väittää, että
      jokaisella rakennuksella ja teknologialla on sivu, eikä yhtään orpoa sivua ole
- [ ] **Linkki joka toiminnosta**: solupaneelista, rakennusvalikosta, loitsusta,
      opetuksesta — aina samaan paikkaan kirjassa
- [ ] Avautuu ja sulkeutuu **yhdellä peukalolla**, ei estä karttaa pysyvästi
- [ ] Haku, koska sisältöä tulee satoja rivejä
- [ ] Saavutettavuus: otsikkohierarkia h1→h2→h3, ESC sulkee, fokus palaa (`claude.md` §14)
- [ ] Wiki **päivittyy itsestään** kun mekaniikka avautuu (`BRDC-TUTOR-001`) — uusi
      sivu ei ilmesty ennen kuin pelaaja on nähnyt asian kerran

## Toteutus

**Tämä on ainoa tapa pitää suunnitelma hallittavana.** Kuusitoista rakennusta,
teknologiapuu ja kaksitoista ihmettä ovat jo nyt enemmän sääntöä kuin `claude.md` §11
kantaa. Kun kirja lukee samoja taulukoita kuin sääntökoodi, dokumentaatio ei voi
vanhentua — ja se on täsmälleen se ongelma, joka tappoi v2:n 112 markdownia.

Kirja on siis **testi, ei vain käyttöliittymä**: sivun puuttuminen kaataa ajon.

## Ei tässä

- Lore-teksti kaikelle. Ihmeet saavat omansa (`BRDC-WONDER-001`); rakennuksille riittää
  se, mitä ne tekevät
- Ulkoinen wiki tai dokumentaatiosivusto. `claude.md` §5.1: statusdokumentteja ei luoda
