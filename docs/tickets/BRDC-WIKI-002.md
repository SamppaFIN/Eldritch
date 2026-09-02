# BRDC-WIKI-002 — Kirja täyttyy kohdatessa, ja You näyttää vain nähdyn

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WIKI-001 (viipale 3), BRDC-CHAR-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä kaksi havaintoa, jotka ovat sama sääntö kahdesta suunnasta:

*"Älä näytä you sivulla levelien selityksiä, mitä ei ole nähty"* — hahmonäkymä listaa
kaikki Consciousness-tasot selityksineen, myös ne joita pelaaja ei ole saavuttanut. Se
kertoo lopun etukäteen ja tekee etenemisestä luettelon.

*"haluan myös, että ohjekirja täyttyy sitä mukaa kaikesta mihin törmää selityksellä"* —
Guide näyttää heti kaikki 17 sivua, myös mekaniikoista joita pelaaja ei ole nähnyt.
Kirja on täysi ennen kuin peli on alkanut.

Sama periaate: **peli näyttää vain sen minkä pelaaja on kohdannut.** `BRDC-WIKI-001`in
GREEN-listalla tämä on jo rivinä (*"Wiki päivittyy itsestään kun mekaniikka avautuu"*),
merkittynä `BRDC-TUTOR-001`in varaan. Kenttätesti nosti sen omaksi työkseen.

## 🟢 GREEN

- [ ] **Kohdattujen aiheiden rekisteri.** Yksi `es3:`-avain, joukko `HelpTopic`-tunnuksia.
      Kirjataan kun mekaniikka *tapahtuu* pelaajalle, ei kun se on teoriassa mahdollinen:
      ensimmäinen valtaus kirjaa `awakening`, ensimmäinen rappio `decay`, ja niin edelleen.
- [ ] **Guiden etusivu listaa vain kohdatut** + aina `how-to-play`, `first-walk`,
      `vocabulary` (ne ovat ohje, eivät palkinto). Ryhmä jossa ei ole yhtään kohdattua
      aihetta ei näy lainkaan.
- [ ] **Uusi sivu ilmoittaa itsestään** kerran, hillitysti: HUD-rivi *"The Guide has a new
      page: Corruption"*, joka avaa sen. Ei modaalia, ei ääntä.
- [ ] Syvälinkki voittaa rekisterin: jos lokirivi tai Vigil linkittää aiheeseen, se aukeaa
      vaikka sitä ei olisi vielä kirjattu — ja kirjataan samalla.
- [ ] **Hahmonäkymä näyttää vain saavutetut tasot** selityksineen; seuraava on nimetty
      mutta selittämätön (*"Level 6 — Awakening. Reach it to learn what it means."*),
      loput eivät näy.
- [ ] Testit: rekisteri kirjaa kerran eikä kahdesti · etusivu suodattuu oikein · kolme
      ohjesivua näkyvät aina · syvälinkki kirjaa aiheen.

## Ei tässä

- Opastus askel askeleelta (`BRDC-TUTOR-001`). Tämä ei opeta, se vain lakkaa näyttämästä
  sitä mitä pelaaja ei ole nähnyt.
- Taulukoista johdetut rakennus- ja Riitti-sivut — yhä `BRDC-WIKI-001`in iso GREEN.
- Hahmon nimen muokkauksen fokusbugi (kenttähavainto 2026-09-02: *"ruutu rupes nykiin
  tai kontrolli menetti fokusta"*). Infinite rajasi sen erikseen: korjataan
  hahmocustomoinnin yhteydessä, ei tässä.
