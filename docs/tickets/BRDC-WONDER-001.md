# BRDC-WONDER-001 — Cthulhu-mytologian ihmeet

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-REVEAL-001, BRDC-TERRAIN-002, BRDC-SPELL-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §5 (I1–I12) |

## 🔴 RED

Peli on lovecraftilainen sanastoltaan ja tyhjä sisällöltään. Kartalla ei ole yhtään
paikkaa, jonka löytäminen olisi tarina — vain soluja, jotka eroavat toisistaan luvuiltaan.

## 🟢 GREEN

- [ ] Suunnitelman **12 ihmettä** taulukkona: nimi, maasto, vaikutus, harvinaisuus
- [ ] Ihme antaa **perusvaikutuksen, uniikin loitsun ja aluevaikutuksen**
- [ ] Sijainti on **deterministinen** (`BRDC-REVEAL-001`) — ihme on paikassa, ei onnessa
- [ ] Yksi ihme **enintään kerran maailmassa**; toinen R'lyeh naapurikorttelissa ei ole ihme
- [ ] Löytäminen on **pelin suurin tapahtuma**: se on se hetki, jolle pyhä geometria
      on `claude.md` §12:ssa varattu
- [ ] Ihme kulkee `world.json`issa — muiden löydöt näkyvät (`BRDC-SHARE-001`)
- [ ] Lore-teksti jokaiselle; se on `docs/backlog/`in aineiston oikea käyttö
- [ ] Ihmeen menettäminen valtauksessa on mahdollista ja **kerrotaan molemmille**

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
