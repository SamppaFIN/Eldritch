# BRDC-SHARE-001 — Jaettu maailma ilman palvelinta: cron ja `world.json`

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WAGER-JSON-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-08-31: *"tietojen jakaminen tapahtuu esim cron jobilla, joka päivittää tekstitiedoston, mikä tietää kaiken datan"* |

## 🔴 RED

Moninpeli on tällä hetkellä käsin kannettu: `exportChallenge` tuottaa JSONin, pelaaja
liittää sen WhatsAppiin, kaveri tuo sen sisään. Se toimii kaksinpelinä ja lakkaa
toimimasta kolmella pelaajalla — jokainen pari joutuu vaihtamaan datansa erikseen,
eikä kukaan näe koko maailmaa.

Supabase ratkaisisi tämän, mutta se on siirretty tilausmallin dataan ja chattien
persistointiin. Väliin tarvitaan jotain, joka ei ole palvelin.

## 🟢 GREEN

- [ ] **`world.json` Pagesissa**: kaikkien pelaajien julkinen tila yhtenä tiedostona
- [ ] Peli **lukee sen käynnistyksessä** ja näyttää muiden alueet kartalla
- [ ] Kirjoituspolku on olemassa ja dokumentoitu — ks. *Toteutus*
- [ ] **GitHub Action ajaa cronilla**, kokoaa saapuneet lähetykset ja julkaisee tiedoston
- [ ] Jokainen lähetys **tarkistetaan checksumilla** ennen kuin se päätyy maailmaan
      (sama mekanismi kuin `CHALLENGE_VERSION`-datassa jo on)
- [ ] Lähetys, jonka versio on tuntematon, **hylätään nimeltä** — ei hiljaa ohiteta
- [ ] Tiedoston koko on **rajattu** ja raja on testattu, ei toivottu
- [ ] Peli toimii **täysin ilman `world.json`ia** — verkko on lisä, ei ehto
- [ ] Vanhentunut maailma näkyy pelaajalle ikänä ("viimeksi päivitetty 4 h sitten"),
      ei tuoreena

## Toteutus

**Kirjoituspolku on tämän tiketin oikea ongelma, ei lukupolku.** Cron voi julkaista
tiedoston, mutta se ei voi keksiä sen sisältöä: jonkun on toimitettava data. Ilman
palvelinta ja ilman avaimia klientillä vaihtoehtoja on kolme:

| Polku | Miten | Ongelma |
|---|---|---|
| **GitHub Issue -postilaatikko** | Peli avaa esitäytetyn issuen JSONilla, Action lukee avoimet issuet, yhdistää, sulkee ne | Vaatii GitHub-tilin pelaajalta |
| Gist per pelaaja | Pelaaja tallentaa gistin, Action lukee listan | Sama tili, enemmän käsityötä |
| Pull request | Pelaaja liittää tiedoston | Liian raskas puhelimella |

**Suositus: issue-postilaatikko.** Se on ainoa, joka toimii puhelimen selaimesta
yhdellä napautuksella (`https://github.com/…/issues/new?body=…`), ja Actionilla on
jo oikeus kirjoittaa repoon ilman että klientille annetaan yhtään avainta.

`world.json` on **luettava tila, ei totuus**. Se kertoo mitä muut väittävät
omistavansa. Riitatilanteet ratkaistaan Wagerilla, ei tiedostolla — sama tietoinen
kompromissi kuin `PIVOT-2026-08-27.md` §5:ssä tehtiin taistelun ratkaisusta.

## 🔴 Ratkaistava ennen toteutusta

**Julkinen tiedosto sisältää oikeiden ihmisten kotihexat.** `world.json` on avoimessa
URLissa, ja Hearth on määritelmän mukaan se ruutu, jossa pelaaja asuu. Res 11 -solu on
~46 m leveä: se on osoite.

Kolme vaihtoehtoa, ja tämä on Infiniten päätös:

1. **Julkinen data karkeammalla resoluutiolla** (res 8, ~0,7 km²). Alueen muoto näkyy,
   koti ei
2. **Hearth jätetään pois** julkisesta viennistä kokonaan
3. **Hyväksytään** — peli on kavereiden kesken, ja he tietävät jo missä asut

Kohta 3 on rehellinen valinta *kavereille* ja väärä valinta sillä hetkellä, kun peli
jaetaan eteenpäin. Suosittelen kohtaa 1: se ei maksa mitään nyt ja poistaa ongelman
ennen kuin se on olemassa.

## Ei tässä

- Realtime. Cron on minuutteja tai tunteja myöhässä, ja se riittää alueiden näyttämiseen
- Chat. Se on nimenomaan se, mihin Supabase tulee
- Palvelinvahvistettu taistelu. `PIVOT-2026-08-27.md` §5 pätee yhä

## Ratkaistu ja laajennettu — Infinite 2026-08-31

### Yksityisyys: linna, ei kotiovi

> *"kotiosoitetta ei tarvi näyttää.. näytetään vain linna jossain lähellä"*

Ratkaisu ei ole res 8 -karkeistus vaan **erillinen julkinen sijainti**, joka arvotaan
kerran laitteella eikä ole johdettavissa kodista → `BRDC-CASTLE-001`. Kotipesä ei
poistu puhelimesta koskaan.

Kaksi tarkkuustasoa jää voimaan sen rinnalle:

| Kenelle | Mitä | Missä |
|---|---|---|
| Julkisesti kaikille | Linna + alue res 8 | `world.json` |
| Sille, jonka haastat | Koko lääni res 11 | `exportChallenge`, käsin lähetetty |

### Sharding res 6:lla — heti, ei myöhemmin

Mitattu tässä repossa: `Cell` on **145 tavua JSONina**, karsittuna taulukkomuotoon 39.

| Pelaajia | Soluja | Yksi `world.json` |
|---:|---:|---:|
| 10 | 20 000 | 0,8 MB |
| 100 | 200 000 | 7,8 MB |
| 1 000 | 2 000 000 | 78 MB |

**Sadan pelaajan kohdalla yksi tiedosto ei enää lataudu puhelimeen.** Se ei ole kaukana:
se on toinen kaupunki. Tiedosto jaetaan `world/<res6>.json`-lohkoihin **rakennusvaiheessa**
— jälkikäteen se on migraatio, etukäteen hakemistorakenne. `H3_RES_REGION = 6` on jo
`constants.ts`:ssä ja se on oikea luku: 9 368 mahdollista lohkoa Suomen yli, joista vain
asutut ovat olemassa.

Kansallinen aggregaatti on eri tiedosto → `BRDC-ATLAS-001`.

### ASCII kulkee mukana

`BRDC-ASCII-001` tuottaa saman datan luettavana kuvana. Viesti sisältää molemmat:
**kuva ihmiselle, JSON pelille.** Mitattuna ASCII on pienempi kuin sama data
gzipattuna ja base64-koodattuna.
