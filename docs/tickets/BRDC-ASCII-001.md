# BRDC-ASCII-001 — Kartta ASCII-merkkeinä

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-TERRAIN-002, BRDC-SHARE-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-08-31: *"mallinnetaan kartta ascii merkkeinä, jotta tiedetään mitä siellä on.. se on sitten helppo lähettää toiselle"* |

## 🔴 RED

Maailman tilaa ei voi **katsoa**. Se on IndexedDB:ssä ja MapLibren GPU-tasoissa, eikä
kummastakaan näe silmällä mitä siellä on. Kun maasto menee vikaan, klusterointi
tuottaa väärän jakauman tai naapurin alue on väärässä paikassa, ainoa tapa huomata se
on avata kartta ja tuijottaa.

Ja jakaminen on tällä hetkellä läjä JSONia. Sen voi lähettää, mutta sitä ei voi lukea:
kaveri liittää sen peliinsä ja luottaa. Kukaan ei näe mitä lähetti.

## 🟢 GREEN

- [ ] `toAscii(cells, origin)` on **puhdas funktio** `packages/core`issa
- [ ] Geometria on oikea kuusikulmioruudukko, ei neliöruudukko — ks. *Toteutus*
- [ ] Merkistö kattaa **maaston, omistajuuden ja kotipesän** yhdellä merkillä per solu
- [ ] **Selite kulkee kartan mukana** — muuten se on koodi eikä kartta
- [ ] Mahtuu yhteen viestiin: **koko lääni yhtenä WhatsApp-viestinä**, mitattuna
- [ ] Näkyy pelissä: *"katso mitä täällä on"* -näkymä, ei vain testityökalu
- [ ] Testattu snapshotilla — tunnettu solujoukko antaa tunnetun kuvan aina
- [ ] Toimii monospace-fontilla 360 px:llä ilman vaakavieritystä (leveysraja)

## Toteutus — geometria on jo ratkaistu ja todennettu

H3-solut ovat kuusikulmioita, eivät neliöitä, joten niitä ei voi ladella riveihin
sellaisenaan. `h3-js` 4.5.0:ssa on tähän valmis vastaus, ja se on tarkistettu tässä
repossa olevan version kanssa:

```
h3.cellToLocalIj(origin, cell) → { i, j }
```

Kuuden naapurin IJ-siirtymät origon suhteen mitattiin: `(1,1) (0,1) (-1,0) (-1,-1) (0,-1) (1,0)`.
Siitä seuraa koko muunnos, ja se on kaksi riviä:

```ts
const x   = i + j;   // vaakapaikka, kaksi merkkiä per solu
const row = i - j;   // rivi
```

Tarkistus: `(1,1)` liikuttaa `x`:ää kahdella eikä riviä lainkaan (vaakanaapuri);
neljä muuta liikuttavat `x`:ää yhdellä ja riviä yhdellä (vinonaapurit). Se on
täsmälleen pointy-top-kuusikulmioruudukko lomitetuin rivein. **Ei omaa
heksamatematiikkaa, ei akselimuunnoksia käsin** — `PIVOT-2026-08-27.md` §3 hylkäsi
oman hex-ruudukon juuri tästä syystä, ja sama perustelu pätee tässä.

## Todellinen tuloste

Ajettu tässä repossa: Härmälä, Pyhäjärven kupeessa (61,4674 / 23,7350),
`gridDisk` säde 7 (169 solua), maasto nykyisestä `terrainOf`ista,
oma alue säde 3.

```
       ~ ~ ~ ~ ~ . ~ ~
      ~ ~ ~ ~ ~ ~ ~ ~ ~
     ~ . ~ . . ~ . . ~ ~
    . ~ ~ ~ . ~ . . . ~ ~
   ~ . ~ ~ # # # # . . . .
  ~ . ~ ~ # # # # # . . . .
 ~ ~ ~ ~ # # # # # # . . . .
~ ~ ~ . # # # @ # # # . . . .
 ~ . . ~ # # # # # # . . . .
  . ~ . . # # # # # . . . .
   ~ . ~ . " " # # . . . .
    . ~ . . " . " " . . $
     . " . " " " " " $ .
      . " . " " " " $ $
       . " " " " . . .

@ kotipesä   # sinun   ~ vesi   " metsä   $ tori   . tasanko
```

Vesi luoteessa on Pyhäjärvi. Metsä etelässä ja tori kaakossa. **Se on oikean
näköinen kartta oikeasta paikasta**, ja se on 15 riviä tekstiä.

## Koko mitattuna — ASCII voittaa pakatun JSONin

`zlib.gzipSync`illä mitattu, sama solujoukko:

| Säde | Soluja | ASCII | JSON | JSON gzip | gzip + base64 |
|---:|---:|---:|---:|---:|---:|
| 3 | 37 | **~98 B** | 1 444 B | 174 B | 232 B |
| 6 | 127 | **~338 B** | 4 954 B | 424 B | 566 B |
| 12 | 469 | **~1 250 B** | 18 292 B | 1 451 B | 1 935 B |
| 20 | 1 261 | **~3 362 B** | 49 180 B | 3 885 B | 5 180 B |

ASCII on pienempi kuin sama data gzipattuna ja base64-koodattuna — **ja luettavissa
ilman peliä.** Noin 2,7 merkkiä per solu. WhatsAppin viestiraja on 65 536 merkkiä,
eli **noin 24 000 solua yhdessä viestissä**: 40 km² maata. Kenenkään lääni ei ole
lähelläkään sitä.

## 🔴 Ratkaistava: näkymä vai siirtomuoto

Kuva yllä kertoo maaston ja omistajuuden. Se **ei** kerro vahvuutta, käyntipäiviä,
rakennuksia eikä omistajan tunnusta — eli kaikkea sitä, mitä `exportChallenge` kantaa.

Kaksi vaihtoehtoa, ja tämä on päätettävä ennen kuin funktio kirjoitetaan:

1. **ASCII on näkymä.** Kaunis, luettava, häviöllinen. Siirto pysyy JSONina, ja
   viesti sisältää molemmat: kuva ihmiselle, JSON pelille. Yksinkertainen, ja
   kuva ei voi koskaan mennä epäsynkkaan koska se johdetaan samasta datasta
2. **ASCII on siirtomuoto.** Selite laajenee kantamaan vahvuuden ja rakennukset
   (esim. `#` = omistettu, `▪` = vahvistettu, isot kirjaimet = rakennus).
   Häviötön, mutta merkistö kasvaa nopeasti lukukelvottomaksi

**Suositus: 1.** Vaihtoehto 2 keksii oman tiivistysmuodon, joka on huonompi kuin
gzip ja rumempi kuin kuva — se yrittää olla molempia eikä onnistu kummassakaan.
Kuva ihmiselle ja JSON koneelle samassa viestissä maksaa yhteensä vähemmän kuin
lukukelvoton merkkihirviö, ja se on **testattavissa**: kuva on snapshot, JSON on data.

## Ei tässä

- Värit. ANSI ei selviä WhatsAppista, ja `claude.md` §14 kieltää värin ainoana
  tiedonkantajana joka tapauksessa. Merkki kantaa merkityksen
- Kansallinen mittakaava. 157 miljoonaa solua ei ole ASCII-kartta → `BRDC-ATLAS-001`
- ASCII-kartan **muokkaaminen** ja tuonti takaisin. Houkuttelevaa ja tarpeetonta
