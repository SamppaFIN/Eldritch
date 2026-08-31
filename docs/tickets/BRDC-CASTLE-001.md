# BRDC-CASTLE-001 — Linna: julkinen kasvo, joka ei ole kotiovi

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-HEARTH-001, BRDC-SHARE-001 |
| **Status** | `in_progress` — tietokerros ja säännöt valmiit, kartta ja vienti auki |
| **Valmius** | 65 % |
| **Lähde** | Infinite 2026-08-31: *"kotiosoitetta ei tarvi näyttää.. näytetään vain linna jossain lähellä"* |

## 🔴 RED

Ankkurikivi merkitsee kotipesän **täsmälleen siihen soluun, jossa pelaaja asuu**
(`PlaceMarkers.ts:43`). Res 11 -solu on Tampereella 1 622 m² eli noin 46 metriä
reunasta reunaan. Se on osoite.

Niin kauan kuin peli oli vain omalla puhelimella, se oli oikea ratkaisu: se on *sinun*
kotisi ja sinä sen näet. `BRDC-SHARE-001` muuttaa tilanteen — sama data menee julkiseen
tiedostoon, jonka kuka tahansa voi ladata.

## 🟢 GREEN

- [x] **Linna on erillinen sijainti**, ei kotipesä. Se on ainoa asia, joka julkaistaan —
      `rules/castle.ts`, ei kosketa `K.home`ia
- [x] Linnan sijainti **arvotaan kerran laitteella** ja tallennetaan; kotipesä ei koskaan
      poistu puhelimesta — `data/castle.ts#assignCastle`, `K.castle` erillinen avain
- [x] Etäisyys on **satunnainen mutta rajattu**: `CASTLE_MIN_RADIUS_M`–`CASTLE_MAX_RADIUS_M`
      (300–900 m), testattu 200 otoksella
- [x] Linna **ei liiku** kerran arvottuaan, **kunhan kotipesä ei liiku** — ks. *Toteutus*,
      poikkeus on tarkoituksellinen ja perusteltu siellä
- [ ] Linna renderöidään **omana merkkinään**, ei Ankkurikivenä *(ei tehty — kartan puoli,
      `apps/game`)*
- [ ] Pelaajalle **kerrotaan mitä julkaistaan** — yksi lause, ei asetussivu *(ei tehty)*
- [ ] `exportChallenge` ja `world.json` sisältävät linnan, eivät kotipesää *(ei tehty —
      `world.json` ei ole vielä olemassa, `BRDC-SHARE-001`; `exportChallenge` ei ole
      vielä muutettu)*
- [x] Sijainninvalinta on puhdas funktio siemenestä; testattu sillä, että sama siemen
      antaa saman linnan ja eri siemenet eri linnan — `rules/castle.test.ts` (5 testiä),
      `data/castle.test.ts` (6 testiä)

## Toteutus — miksi arvonta eikä laskettu siirtymä

Ensimmäinen ajatus on **deterministinen siirtymä kotipesästä**: hash kotisolusta antaa
suunnan ja etäisyyden. Se on väärä ratkaisu, ja syy on yksinkertainen: koko peli on
avointa lähdekoodia GitHubissa.

**Julkinen deterministinen funktio on käännettävissä.** Jos linna lasketaan kodista
kaavalla, joka on repossa, kuka tahansa laskee kodin linnasta kymmenessä rivissä. Se ei
ole yksityisyyttä vaan sen näköinen asia.

Siksi: **arvonta kerran, salaisuus jää laitteelle.** Toteutus jakaa tämän kahteen osaan
tarkoituksella, ei suoraan `Math.random()`illa vaikka tekstin ensimmäinen versio
ehdotti sitä:

- **`rules/castle.ts#castlePosition(home, seed)`** — puhdas, deterministinen funktio
  siemenestä sijaintiin. Testattavissa tavallisella Vitestillä, kuten golden rule 3 vaatii
- **`data/castle.ts#assignCastle`** — kutsuu `castlePosition`in **tuoreella siemenellä**
  (`this.newId()`, sama `crypto.randomUUID()`-lähde kuin pelaajan ja juoksujen tunnuksilla)
  joka kerta kun `setHome` kutsutaan

Näin oikea satunnaisuus (siemen) ja testattavuus (puhdas muunnos siemenestä) eivät ole
ristiriidassa — `Math.random()` puhtaan funktion sisällä olisi tehnyt siitä testaamattoman.
Linna tallennetaan `es3:*`-tilaan omalla avaimellaan (`K.castle`), erillään kotipesästä.
Julkiseen dataan menisi jatkossa vain tämä. Kääntäminen vaatisi puhelimen.

Tämä on ainoa kohta koko projektissa, jossa **arvottu, ei-deterministinen** siemen on
oikea valinta. Kaikkialla muualla arvonta on kielletty (`BRDC-REVEAL-001`), koska
determinismi on se, mikä saa kaikki näkemään saman maailman. Tässä determinismi *julkisesta
syötteestä* olisi juuri se, mitä ei haluta. Sanottu ääneen, jotta tätä ei "korjata"
myöhemmin hashiksi kotisolusta johdonmukaisuuden nimissä.

### Poikkeus: linna vaihtuu, kun kotipesä vaihtuu

`BRDC-HEARTH-001`:n oma testi (*"moves when set again, which is what a deliberate
restart needs"*) osoittaa, että `setHome` kutsutaan uudestaan tarkoituksella kun
pelaaja aloittaa alusta uudesta paikasta. Linna **arvotaan tällöin uudestaan** eikä
jää roikkumaan vanhan, hylätyn kodin lähelle.

Tämä ei riko yllä olevaa yksityisyysperustelua: vaara oli, että *saman* kodin useampi
julkaistu linna keskiarvoistuisi kohti oikeaa osoitetta. Kun koti itse vaihtuu, vanha
linna ja uusi linna eivät suojaa samaa salaisuutta — niitä ei voi eikä tarvitse
keskiarvoistaa toisiaan vasten. `data/castle.test.ts` testaa molemmat: sama koti antaa
saman linnan joka kerta, eri koti antaa eri linnan.

### Sivulöytö: FNV-1a ja peräkkäiset siemenet

Testejä kirjoittaessa `hash("keep:bearing:seed-0")` … `hash("keep:bearing:seed-199")`
osuivat vain kahteen neljästä ilmansuuntaneljänneksestä — FNV-1a sekoittaa huonosti
pitkän yhteisen alun ja pienen peräkkäisen laskurin. Oikeilla `crypto.randomUUID()`-
siemenillä (2000 otosta) jakauma oli tasainen kaikkiin neljään neljännekseen eikä
suunnan ja etäisyyden välillä ollut korrelaatiota (mitattu: -0.0016). Tuotannossa ei
ole ongelmaa — siemen ei koskaan ole peräkkäinen laskuri — mutta testi kirjoitettiin
uudelleen sekoitetuilla siemenillä eikä `seed-0, seed-1, …`-muodolla, ja huomio on
kirjattu `rules/castle.ts`:n omaan kommenttiin niin ettei kukaan toista samaa virhettä.

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
