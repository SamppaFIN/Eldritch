# BRDC-TECH-001 — Teknologiapuu ja aikakaudet

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1 (Avausteknologia-sarake), §2.1, §2.2 |

## 🔴 RED

Suunnitelman jokaisessa rakennustaulukossa on sarake **Avausteknologia** — Varhainen
maanviljely, Metsätalous, Kaivostekniikka, Linnoitustekniikka, Merenkulku. Yhtäkään
niistä ei ole olemassa. Ilman puuta kaikki 16 rakennusta ovat auki ensimmäisestä
minuutista, eikä pelissä ole mitään opittavaa.

Ja `claude.md` §10 rajaa tason 20:een hyvästä syystä (v2:n taso 118 korruptoi tallennuksen).
Taso on tällä hetkellä ainoa etenemisen mitta, ja se mittaa vain XP:tä.

## 🟢 GREEN

- [ ] **`TECHS`-taulukko**: tunnus, hinta viisaudessa, edeltäjät, avattavat rakennukset
- [ ] Teknologia maksaa **viisautta** — resurssi, jota ei saa kävelemällä vaan
      rakentamalla ja tutkimalla. Se on toinen etenemisakseli tason rinnalle
- [ ] Puu on **suunnattu asyklinen graafi ja se testataan sellaiseksi** — sykli
      taulukossa on tyhmä bugi, joka lukitsee pelin hiljaa
- [ ] Rakennuksen avaava teknologia luetaan `BUILDINGS`-taulukosta, **ei kirjoiteta kahdesti**
- [ ] **Aikakaudet** (esihistoria → antiikki → keskiaika) johdetaan tutkitusta,
      ei erillisenä laskurina
- [ ] Aikakauden vaihtuminen on **tapahtuma**: ilmoitus, pyhä geometria, sanat
      (sama kohtelu kuin `BRDC-AWAKEN-001`:n sulkeutumisella)
- [ ] Puu on **katettu** kuten tasokäyräkin — viimeinen aikakausi on viimeinen
- [ ] Tutkimattoman rakennuksen paneeli kertoo **mikä sen avaa**, ei vain että se on lukossa

## Toteutus

Puu on dataa, ja **`canBuild` kysyy siltä yhden kysymyksen**. Se on ainoa kytkös
`BRDC-BUILD-001`:een, ja siksi nämä kaksi voidaan tehdä kummassa järjestyksessä
tahansa: ilman puuta `hasTech` palauttaa aina `true`.

Humankindin **erikoistuminen** (kauppias, soturi, tutkija) on sama taulukko eri
juurella. Sitä ei rakenneta nyt, mutta puun muoto ei saa estää sitä — yksi juuri
per haara, ei yhtä lineaarista listaa.

## Ei tässä

- Kulttuurillinen erikoistuminen valintana. Rakenne sallii sen, tiketti ei toteuta
- Tutkimusloitsu, joka nopeuttaa puuta → `BRDC-SPELL-001`
