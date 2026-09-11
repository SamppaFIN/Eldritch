# BRDC-WONDER-001 — Cthulhu-mytologian ihmeet

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-REVEAL-001, BRDC-TERRAIN-002, BRDC-SPELL-001 |
| **Status** | `in_progress` — 2026-09-12 (v0.5.75): taulukko, sijoitus ja löytäminen tehty; loitsu, jako ja menetys jäljellä |
| **Valmius** | 65 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §5 (I1–I12) |

## 🔴 RED

Peli on lovecraftilainen sanastoltaan ja tyhjä sisällöltään. Kartalla ei ole yhtään
paikkaa, jonka löytäminen olisi tarina — vain soluja, jotka eroavat toisistaan luvuiltaan.

## 🟢 GREEN

- [x] **12 ihmettä** taulukkona: nimi, maasto, harvinaisuus, tuntibonus, aura, lore.
      Maastovastineet **leivottu taulukkoon**, ei kerrokseksi sen päälle — mitään ihmettä
      ei voi pyytää maastolta jota täällä ei ole, ja testi vahtii sitä
- [~] Perusvaikutus (`bonus`) ja **aluevaikutus** (`aura`) taulukossa. **Uniikki loitsu
      puuttuu** — 12 uutta merkintää `SPELLS`iin on oma työnsä, ja se tehdään
      `BRDC-SPELL-002`:n rinnalla jolloin koulukunnat ovat valmiit
- [x] Sijainti on **deterministinen**: rajattu argmax, `WONDER_SET_VERSION` osana hashia
- [~] **Ainutkertaisuuden laajuus on harvinaisuuden mukaan** — ks. "Ratkaistu 2026-09-12"
      alla. Viisi legendaarista on yksi per maa, kuten tiketti vaatii; pienemmät ovat
      yksi per res-3 / res-4 / res-5 -alue. Ilman tätä kukaan ei löytäisi koskaan mitään
- [x] Löytäminen on **pelin suurin tapahtuma**: Metatronin kuutio, 13 solmua ja 78 viivaa,
      `stroke-dasharray`illa piirtyvä (§12). Sidottu **paljastukseen**, koska se on pelin
      ainoa tahallinen "katso tätä heksaa tarkkaan" -teko
- [ ] Ihme kulkee `world.json`issa (`BRDC-SHARE-001`) — **jäljellä**
- [x] Lore-teksti jokaiselle, kaksi virkettä
- [ ] Ihmeen menettäminen valtauksessa — **jäljellä**

## 🔴 Ratkaistava: kolme ihmettä on Tampereella tavoittamattomissa

Suunnitelma sitoo jokaisen ihmeen maastoon. Kotikaupungissa, jolle tämä peli
rakennetaan, ei ole **valtamerta, tundraa eikä aavikkoa**:

| Ihme | Vaatii | Tampereella |
|---|---|---|
| R'lyeh ⭐⭐⭐⭐⭐ | Valtameri | ei ole |
| The Temple (Atlantis) ⭐⭐⭐⭐⭐ | Valtameri | ei ole |
| The Nameless City ⭐⭐⭐⭐⭐ | Aavikko | ei ole |
| Hyperborea ⭐⭐⭐⭐ | Tundra | ei ole |

**Kolme viidestä legendaarisesta ihmeestä olisi saavuttamattomissa** ainoalle pelaajalle.
Tämä on sama virhe, jonka `BRDC-WARD-001` teki kerran ja korjasi: *"a cost that demands
terrain the player has no way to acquire is not a difficulty curve, it is a locked door."*

**Suositus: vastineet, ja ne kirjataan taulukkoon näkyviin.**

| Vaadittu | Vastine | Perustelu |
|---|---|---|
| Valtameri | Iso järvi | Näsijärvi ja Pyhäjärvi. Fuming Lake on jo Tampereella (`MASTERPLAN` §8, päätös 5) |
| Tundra | Suo tai avokallio | Sama kylmä tyhjyys, ja sitä on |
| Aavikko | Sorakuoppa, ratapiha, teollisuusalue | Autio ihmisen tekemänä on lovecraftilaisempaa kuin hiekka |

Ja **varasääntö**: jos maastoa ei löydy koko pelialueelta, ihme siirtyy harvinaisimpaan
solmuun, joka on löytynyt. Kukaan ei jää ilman legendaa siksi, että asuu väärässä maassa.

## Ratkaistu 2026-09-12: harvinaisuus määrää ainutkertaisuuden laajuuden

Tiketin sääntö on *"yksi ihme enintään kerran maailmassa"*. Kirjaimellisesti kaikkiin
kahteentoista sovellettuna se on **12 paikkaa 3 626 res-5-maakunnasta** — eli Tampereessa
kävelevä pelaaja ei näkisi ikinä yhtäkään, samaan aikaan kun Vaihe 3:n oma portti sanoo
*"löydä ihme"*. Ristiriita on tiketin sisäinen, ei toteutuksen.

Ratkaisu on Civilizationin oma jako maailmanihmeiden ja kansallisten ihmeiden välillä:

| Harvinaisuus | Yksi per | Karkeasti |
|---|---|---|
| legendary (5 kpl) | koko maa | kohtalo, ja huhu jonka voi kertoa kaverille |
| rare (3 kpl) | res-3-solu | viidesosa maata |
| uncommon (2 kpl) | res-4-solu | maakuntaryhmä |
| common (2 kpl) | res-5-solu | 253 km², se kaupunginosa jota oikeasti kävelet |

**Se lause jota tiketti suojeli — *"toinen R'lyeh naapurikorttelissa ei ole ihme"* — pitää
yhä täsmälleen siellä missä sillä on merkitystä:** viisi legendaarista ovat yksi per maa.

## Ratkaistu 2026-09-12: paikka valitsee, kun paikka on niukka

Ensimmäinen sijoitusalgoritmi kävi ihmeet taulukon järjestyksessä ja kukin otti parhaan
vapaan maakunnan. Se toimii vain niin kauan kuin maakuntia on enemmän kuin ihmeitä.
Common-tasolla scope **on** yksi maakunta, joten taulukon ensimmäinen otti ainoan paikan
joka kerta: **`dunwich-stones` ei ollut yhdessäkään kuudestakymmenestä kaupunginosasta.**

Löytyi mittaamalla, ei lukemalla. Nyt jokainen (ihme, maakunta) -pari heitetään ja parit
otetaan korkein ensin, joten paikka valitsee kun paikka on niukka — 32/28 samalla
kuudellakymmenellä. Molemmat faktat ovat nyt testejä.

## Kesken jäänyt, tietoisesti

- **Uniikit loitsut.** 12 merkintää `SPELLS`iin; tehdään `BRDC-SPELL-002`:n kanssa
- **`world.json`.** Löydöt eivät vielä kulje pelaajien välillä
- **Menetys valtauksessa.** Vaatii että ihme on ensin jaettu, eli edellisen jälkeen
- **Kansallinen joukko on laatikko, ei rannikko.** Tiketin oma yksityiskohta #2. Useampi
  legendaarinen osuu Pohjanlahdelle: R'lyehille täydellistä, Arkhamille ei. Oikea
  monikulmio on muutama kilotavu käsin piirrettyä geometriaa eikä osta mitään ennen kuin
  joku pelaa rannikolla. Versioitu `WONDER_SET_VERSION`illa, joten vaihto siirtää kaikki
  kerralla ja avoimesti

## Todennus

- `pnpm test` 1270 (22 sijoituksesta, 8 löytämisestä), `tsc -b`, `check-line-limit`, build
- desktop `opening` + `tutor` 11/11, mobile-360 `standards` 8/8
- Tampereen maakunnassa **on** ihme — testi `seated()` vaatii sen, ja kaatuu jos tasot
  joskus liukuvat niin ettei ole

## Ei tässä

- Achievementit löydöistä → `BRDC-ACHIEVE-001`
- Ihmeisiin liittyvät tarinaketjut → `BRDC-EVENT-001`

## Ratkaistu — Infinite 2026-08-31

> *"järvihän on tuossa mun sijainnin vieressä Härmälässä"*

**Vastine hyväksytty: iso järvi ajaa valtameren virkaa.** Pyhäjärvi on Härmälän vieressä,
eli R'lyeh ja The Temple ovat kävelymatkan päässä siitä, missä peliä oikeasti pelataan.
Se on paras mahdollinen lopputulos — kaksi legendaarista ihmettä lähijärvellä, ei
saavuttamattomana jossain toisessa maassa.

Taulukko lukitaan tähän muotoon:

| Suunnitelman maasto | Vastine | Missä Tampereella |
|---|---|---|
| Valtameri | Iso järvi (yli N solua yhtenäistä vettä) | Pyhäjärvi, Näsijärvi |
| Tundra | Suo tai avokallio | — |
| Aavikko | Sorakuoppa, ratapiha, teollisuusalue | — |

**"Iso" on mitattava, ei arvioitava.** Lammikko ei ole valtameri. Kynnys on solumäärä
yhtenäisessä vesiklusterissa, ja se ratkaistaan `BRDC-TERRAIN-002`:n vektoritiilidatasta
— sama ratkaisu tallennetaan kerran, kuten maastokin.

Suon ja sorakuopan vastineet jäävät voimaan mutta ovat toissijaisia: ne koskevat
ihmeitä, joiden maastoa ei ole vielä nähty pelialueella.

## Ratkaistu: miten tilaton hash takaa maailmanlaajuisen ainutkertaisuuden

`BRDC-REVEAL-001` vaatii, että kaikki on deterministinen hash — muuten kaksi pelaajaa
näkee eri maailman. Mutta **puhdas solukohtainen hash ei voi taata, että R'lyehiä on
vain yksi.** Jokainen solu heittää oman noppansa eikä tiedä muista.

Ratkaisu on **rajattu argmax**: kun joukko on äärellinen, "suurin" on laskettavissa
tilattomasti ja identtisesti joka laitteella.

Prototyyppi ajettu tässä repossa 2026-08-31:

```
Suomen bbox → 3 626 res 5 -solua
12 ihmettä, kullekin argmax hash("wonder:<nimi>:" + res5cell)
kesto: 107 ms
osumat: 12 / 12 eri solua
```

Eli: **ihmeen kotimaakunta on kohtalo**, laskettuna kerran käynnistyksessä, ilman
verkkoa, samaksi kaikilla. Res 5 -solu on 253 km² — maakunnan kokoinen alue, ei ruutu.

Kolme yksityiskohtaa, jotka on toteutettava oikein:

1. **Törmäys on mahdollinen** vaikkei sitä prototyypissä sattunut. Ihmeet käydään
   **kiinteässä järjestyksessä**, ja kukin ottaa parhaan solun, jota ei ole jo varattu.
   Deterministinen, ja kaksi ihmettä ei voi päätyä päällekkäin
2. **Rajaus on osa hashia.** Prototyyppi käytti Suomen bounding boxia, ja useampi osui
   Pohjanlahdelle. R'lyehille se on täydellistä; Arkhamille ei. Oikea joukko on
   **maapolygoni, ei laatikko** — ja jos joukko joskus muuttuu, ihmeet siirtyvät.
   Joukko on siis versioitava kuten `SAVE_VERSION`
3. **Tarkka solu res 5:n sisällä ei voi tulla hashista**, koska se vaatisi maastodataa
   jota kaikilla ei ole samaa (`BRDC-TERRAIN-002` antaa `source: 'tiles' | 'hash'`).
   Siksi hybridi:

| Taso | Mistä | Miksi |
|---|---|---|
| Maakunta (res 5) | Rajattu argmax, tilaton | Sama kaikille, offline, ikuisesti |
| Tarkka solu (res 11) | **Löytäjä rekisteröi** `world.json`iin | Vaatii maastoa, jota vain paikalla oleva on nähnyt |

Se on myös parempi peli kuin pelkkä hash: **maakunta on tiedossa, ovi ei.** Voit sanoa
kaverille "R'lyeh on Pohjanlahdella jossain" — ja se on totta, ja kumpikaan ei tiedä
missä. Ensimmäinen, joka kävelee sen löytääkseen, saa nimensä siihen.
