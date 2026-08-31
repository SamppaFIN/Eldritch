# BRDC-CASTLE-001 — Linna: julkinen kasvo, joka ei ole kotiovi

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-HEARTH-001, BRDC-SHARE-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-08-31: *"kotiosoitetta ei tarvi näyttää.. näytetään vain linna jossain lähellä"* |

## 🔴 RED

Ankkurikivi merkitsee kotipesän **täsmälleen siihen soluun, jossa pelaaja asuu**
(`PlaceMarkers.ts:43`). Res 11 -solu on Tampereella 1 622 m² eli noin 46 metriä
reunasta reunaan. Se on osoite.

Niin kauan kuin peli oli vain omalla puhelimella, se oli oikea ratkaisu: se on *sinun*
kotisi ja sinä sen näet. `BRDC-SHARE-001` muuttaa tilanteen — sama data menee julkiseen
tiedostoon, jonka kuka tahansa voi ladata.

## 🟢 GREEN

- [ ] **Linna on erillinen sijainti**, ei kotipesä. Se on ainoa asia, joka julkaistaan
- [ ] Linnan sijainti **arvotaan kerran laitteella** ja tallennetaan; kotipesä ei koskaan
      poistu puhelimesta
- [ ] Etäisyys on **satunnainen mutta rajattu**: tarpeeksi kaukana ollakseen väärä,
      tarpeeksi lähellä ollakseen sinun kulmasi
- [ ] Linna **ei liiku** kerran arvottuaan — vaihtuva sijainti olisi kohinaa, ja
      kahden otoksen keskiarvo paljastaisi todellisen kodin
- [ ] Linna renderöidään **omana merkkinään**, ei Ankkurikivenä. Omistaja näkee molemmat,
      muut vain linnan
- [ ] Pelaajalle **kerrotaan mitä julkaistaan** — yksi lause, ei asetussivu
- [ ] `exportChallenge` ja `world.json` sisältävät linnan, eivät kotipesää
- [ ] Sijainninvalinta on puhdas funktio siemenestä; testattu sillä, että sama siemen
      antaa saman linnan ja eri siemenet eri linnan

## Toteutus — miksi arvonta eikä laskettu siirtymä

Ensimmäinen ajatus on **deterministinen siirtymä kotipesästä**: hash kotisolusta antaa
suunnan ja etäisyyden. Se on väärä ratkaisu, ja syy on yksinkertainen: koko peli on
avointa lähdekoodia GitHubissa.

**Julkinen deterministinen funktio on käännettävissä.** Jos linna lasketaan kodista
kaavalla, joka on repossa, kuka tahansa laskee kodin linnasta kymmenessä rivissä. Se ei
ole yksityisyyttä vaan sen näköinen asia.

Siksi: **arvonta kerran, salaisuus jää laitteelle.** Linna tallennetaan `es3:*`-tilaan
kotipesän rinnalle. Julkiseen dataan menee vain linna. Kääntäminen vaatisi puhelimen.

Tämä on ainoa kohta koko projektissa, jossa `Math.random()` on **oikea** valinta.
Kaikkialla muualla se on kielletty (`BRDC-REVEAL-001`), koska determinismi on se, mikä
saa kaikki näkemään saman maailman. Tässä determinismi on juuri se, mitä ei haluta.
Sanottu ääneen, jotta tätä ei "korjata" myöhemmin hashiksi johdonmukaisuuden nimissä.

## Mitä tämä ei piilota, ja se sanotaan ääneen

Linna piilottaa **oven**. Se ei piilota **kaupunginosaa**, koska alue julkaistaan ja
alue on kasvanut sinne, missä kävelet. Kuka tahansa, joka katsoo läänisi muotoa, tietää
mistä korttelista on kyse.

Se on hyväksyttävä ja tarkoituksellinen — muuten koko jaettu kartta on tyhjä. Ratkaisu
on **kaksi tarkkuustasoa**, ei enemmän piilottelua:

| Kenelle | Tarkkuus | Missä |
|---|---|---|
| Kaikille, julkisesti | Linna + alue **res 8** -tarkkuudella (~0,56 km²) | `world.json`, `BRDC-ATLAS-001` |
| Sille, jonka haastat | Koko lääni **res 11** | `exportChallenge`, lähetetty käsin |

Julkisella kartalla näkyy kaupunki. Yksityiskohdat näkee se, jolle ne lähetit itse.
Se on sama malli kuin Civilizationissa: maailmankartalla näet rajat, kaupungin sisään
näet vasta kun olet tekemisissä sen kanssa.

## Ei tässä

- Linnan grafiikka ja tasot → `BRDC-ART-001`
- Linna rakennuksena, jolla on pelivaikutus. Tämä on **merkki, ei rakennus**;
  tukikohdan rakentaminen on `BRDC-BUILD-001`
