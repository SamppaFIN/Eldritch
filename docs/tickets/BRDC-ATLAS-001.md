# BRDC-ATLAS-001 — Koko Suomi: kaupungit, rajat ja laajeneminen yhdellä ruudulla

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-SHARE-001, BRDC-CASTLE-001, BRDC-CLAIM-006 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-08-31: *"tarkoitus on että lopulta näemme koko Suomen eri kaupungit ja niiden laajenemisen.. tavallaan niin kuin pelaisit Civilization vitosta kavereiden kanssa"* |

## 🔴 RED

Kartta on aina yhdessä mittakaavassa: res 11 -heksat sen ympärillä, missä seisot. Se on
oikea näkymä kävelijälle ja **väärä näkymä sille, mitä tästä on tulossa**.

Civilizationissa on kaksi näkymää: maailmankartta, jolla näet valtakuntien rajat, ja
kaupunkinäkymä, jolla näet ruudut. Tässä pelissä on vain jälkimmäinen. Kysymykseen
*"mitä Suomessa tapahtuu"* ei ole mitään tapaa vastata.

Ja res 11 ei voi vastata siihen. **Suomi on 157 miljoonaa res 11 -solua** (mitattu:
`getHexagonAreaAvg(11) = 2 150 m²`, Suomi 338 455 km²; Suomen leveysasteella soluja on
lähemmäs 200 miljoonaa, koska ne ovat siellä pienempiä — Tampereella 1 622 m²).

## 🟢 GREEN

- [ ] **Kolme mittakaavaa**, ja kartta vaihtaa niiden välillä zoomin mukaan
- [ ] Kansallinen näkymä piirtää **kaupungit ja niiden rajat**, ei soluja
- [ ] Laajeneminen näkyy **ajassa**: sama kaupunki viikko sitten ja nyt
- [ ] Siirtymä mittakaavojen välillä on **jatkuva**, ei kahden erillisen näytön vaihto
- [ ] Kansallinen näkymä latautuu **yhdestä pienestä tiedostosta** eikä vaadi koko maailmaa
- [ ] Piirtomäärä mitattu jokaisella tasolla; ei arvioitu
- [ ] Toimii 360 px:llä — se on peli, jota katsotaan puhelimesta

## Toteutus — mitattu resoluutiotaulukko

`h3-js` 4.5.0, ajettu tässä repossa 2026-08-31:

| Res | Solun ala | Soluja Suomen yli | Mitä se on | Käyttö |
|---:|---:|---:|---|---|
| 4 | 1 770 km² | 191 | maakunta | liian karkea |
| **5** | **253 km²** | **1 338** | kunta | **kansallinen näkymä** |
| **6** | **36 km²** | **9 368** | kaupunginosa | **`world.json`:n sharding-avain** |
| 7 | 5,2 km² | 65 576 | kortteliryhmä | välitaso |
| **8** | **0,74 km²** | **459 029** | kortteli | **julkinen tarkkuus** (`BRDC-CASTLE-001`) |
| 9 | 0,11 km² | 3,2 M | maaston klusteri | `terrainOf` käyttää tätä jo |
| 11 | 2 150 m² | 157 M | omistus | oma lääni, lähizoomi |

**Res 6 on jo `constants.ts`:ssä** nimellä `H3_RES_REGION`, kommentoituna *"realtime
channel shard"*. Se osoittautuu oikeaksi luvuksi myös ilman realtimea: 9 368 mahdollista
lohkoa koko Suomen yli, joista **vain asutut ovat olemassa**. Sadalla pelaajalla
epätyhjiä on kymmeniä, ei tuhansia.

Kolme mittakaavaa:

| Zoom | Piirretään | Mistä |
|---|---|---|
| Koko maa | linnat + kaupunkien rajat res 5:llä | `atlas.json`, yksi pieni tiedosto |
| Kaupunki | alueet res 8:lla | `world/<res6>.json`, vain näkyvät lohkot |
| Lähellä | omat solut res 11:llä | IndexedDB, oma data |

## Miksi yksi `world.json` ei riitä, mitattuna

`Cell` nykymuodossaan on **145 tavua JSONina** (mitattu `JSON.stringify`illä oikealla
solulla). Taulukkomuotoisena karsittuna 39 tavua.

| Pelaajia | Soluja (2 000 / pelaaja) | Yksi `world.json` |
|---:|---:|---:|
| 10 | 20 000 | 0,8 MB |
| 100 | 200 000 | 7,8 MB |
| 1 000 | 2 000 000 | 78 MB |
| 10 000 | 20 000 000 | 780 MB |

**Sadan pelaajan kohdalla yksi tiedosto lakkaa olemasta ladattavissa puhelimella.**
Se ei ole kaukainen ongelma: se on toinen kaupunki. Siksi `BRDC-SHARE-001` shardataan
res 6:lla samalla kun se rakennetaan, ei sen jälkeen — jälkikäteen se on migraatio,
etukäteen se on hakemistorakenne.

`atlas.json` on eri asia: se on **aggregaatti**, ei solulista. 1 338 res 5 -solua,
joissa kussakin omistajajakauma. Muutama kymmenen kilotavua koko maasta, riippumatta
pelaajamäärästä.

## Ei tässä

- Realtime. Cron riittää; kaupungit eivät laajene sekunneissa
- Vieraiden pelaajien solutason data. Se on `BRDC-CASTLE-001`:n kahden tarkkuustason
  julkinen puoli, ja tarkoituksella karkea
- Suomen ulkopuoli. Rajaus on Suomi, koska pelaajat ovat Suomessa. Mikään yllä ei
  kuitenkaan sido maahan — H3 on globaali, ja `atlas.json` kasvaa vain asutuilla soluilla
