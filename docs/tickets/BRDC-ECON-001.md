# BRDC-ECON-001 — Talouden perusta: yhdeksän resurssia ja tuotannon katto

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-TERRAIN-001, BRDC-WARD-001 |
| **Status** | `done` — ks. *Toteutettu*, kolme kohtaa siirretty erikseen perustelluista syistä |
| **Valmius** | 95 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1 (hinnat ja tuotot) |

## 🔴 RED

`ResourcePool` on `{ water, wood, gold }`. Kehityssuunnitelman rakennustaulukot vaativat
**puuta, kiveä, rautaa, ruokaa, kultaa, viisautta, manaa, kulttuuria ja tokeneita** —
ja jokainen rakennus, loitsu, teknologia ja ihme viittaa niihin. Yksikään suunnitelman
rivi ei ole toteutettavissa ennen kuin poolissa on oikeat kentät.

Tämä on koko suunnitelman pohjatyö: `terrain.ts`, `pouch.ts`, `MockRepository`, HUD ja
`CellPanel` koskevat kaikki pooliin. *(Korjaus omaan aiempaan tekstiin: `spoils.ts` ja
`wager.ts`/`wagerBattle.ts` eivät koske — tarkistettu koodista, kumpikaan ei viittaa
`ResourcePool`iin lainkaan. `ward.ts` koskettaa vain nimellisesti, `wood`-kentän kautta,
joka ei muutu.)* Jos tämä tehdään vasta rakennusten jälkeen, ne kirjoitetaan kahdesti.

## 🟢 GREEN

- [x] `ResourcePool` kattaa suunnitelman resurssit — **yhdeksän, ei kymmentä**: laskettu
      suunnitelman omista rakennustaulukoista (puu, kivi, rauta, ruoka, kulta, viisaus,
      mana, kulttuuri, tokenit), eikä kymmenettä löytynyt. Otsikko korjattu vastaamaan
- [x] `water` on korvattu **`food`**illa: järvi antaa ruokaa, ei vettä
- [x] `RESOURCE_KINDS`-taulukko yhdessä paikassa (`terrain.ts`); `EMPTY_POOL`,
      `canAfford`, `spend` ja `trickle` kaikki johdettu siitä — yhdenkään uuden
      resurssin lisääminen ei vaadi kuin yhden rivin sinne
- [x] Kaikki nykyiset testit vihreinä muutoksen jälkeen — **434/434**, plus 12 uutta
      tälle tiketille (katto, lepotila, väärän muotoinen pooli)
- [x] **Tuotantokatto** ja **lepotila** toteutettuna ja testattuna — ks. alla
- [x] ~~`SAVE_VERSION` = 2~~ **väärä korjaus väärään paikkaan — ei tehty, ja tässä on
      miksi ei**: ks. *Sivulöytö: pooli ei koskaan ollutkaan `SAVE_VERSION`:n takana*
- [ ] *(siirretty `BRDC-SCALE-001`:een)* Solun avainmuodon vaihto `cell:${h3}` →
      `cell:${regionOf(h3)}:${h3}`. Ei ollut ajankohtainen: alueperusteinen kysely ei
      ollut tekeillä, joten oma ehtonsa yllä ei täyttynyt

## Lukittava päätös: tuotanto ei saa tehdä tästä idle-peliä

Suunnitelmassa on ~20 rakennusta, ja lähes jokainen tuottaa **"+X / tunti"**. Nykyinen
`TRICKLE_PER_HOUR` on 2 per tuottava solu. Sahalaitos yksin on +8/t, ja viidenkymmenen
solun läänissä rakennuksia on kymmeniä.

`ward.ts` sanoo tämän jo ääneen omassa dokumentaatiossaan:

> *"Advancing the clock here would quietly turn a walking game into an idle one, which
> is the single change most likely to hollow this out."*

Sama vaara, isompana. Jos tuotanto juoksee rajatta, **paras strategia on olla
kävelemättä** — odota viikko, palaa rikkaana. Se on ulkoilupelin kuolinsyy.

**Kaksi sääntöä, ja molemmat käyttävät jo olemassaolevaa mekaniikkaa:**

1. **Varastokatto.** Tuotanto kertyy kattoon asti ja pysähtyy siihen. Perustaso on
   pieni; suunnitelman oma **Varasto (+50 kapasiteettia)** on se, joka nostaa sitä.
   Näin suunnitelman rakennus saa oikean merkityksen sen sijaan että olisi koriste
2. **Lepotila.** Solu tuottaa vain kun se on hereillä. Se nukahtaa `DECAY_GRACE_HOURS`
   (48 h) käymättömyyden jälkeen — **sama kello kuin rappeutumisessa**, ei uutta
   ajastinta eikä uutta viritettävää lukua

Yhdessä: viikonlopun poissaolo ei rankaise, viikon poissaolo pysäyttää talouden, ja
kävely käynnistää sen uudelleen. Kävely pysyy pelin selkärankana.

- [x] `settleResources` kunnioittaa kattoa (`BASE_STORAGE_CAP = 500`) eikä koskaan ylitä
      sitä — testattu sekä pitkällä kelauksella että lähtien melkein täydestä poolista
- [x] Solu, jota ei ole käyty 48 h:iin, **ei tuota** — testattu kelatulla kellolla,
      erikseen `trickle`in ja `settleResources`in tasolla
- [x] Kävely herättää solun **eikä vaadi erillistä "herätys"-askelta** — dormanssi
      luetaan `lastVisitedAt`ista jokaisella kutsulla, joten tuore käynti on jo tuore
      `lastVisitedAt`, testattu (*"pays again the moment a stale cell is walked"*)
- [x] `HearthPanel` sanoo levolla olevat solut sanoina: *"N more are resting — walk them
      to wake them"* — `dominion.ts`:n uusi `resting`-kenttä erottaa levolla-olevan
      tuottamattomasta, koska ne ovat eri tosiasioita eivätkä samaa lukua
- [x] Täysi varasto **kerrotaan** ("Storage is full — production has stalled"), ei
      hukata hiljaa

## Toteutus

Resurssit ovat **taulukkodataa, eivät luokkia**. Golden rule 3: `packages/core` on puhtaita
funktioita. `RESOURCE_KINDS`-taulukko (`terrain.ts`) korvaa suunnitelman §8.2:n
`class BuildingSystem`in — sama semantiikka, testattavissa ilman instansointia.

`gold` säilyy nimensä; `wood` säilyy. Vain `water` → `food` vaihtuu, ja se on ainoa
kohta, jossa vanha data ei käänny.

## Sivulöytö: pooli ei koskaan ollutkaan `SAVE_VERSION`:n takana

Tämän tiketin oma alkuperäinen suunnitelma ("nosta `SAVE_VERSION` kahteen") olisi
korjannut väärän tiedoston. `SAVE_VERSION` (`persist/save.ts`) suojaa **vain
`localStorage`a** — muutamaa pientä arvoa kuten kotimerkintää ja avauszoomia.
Resurssipooli asuu **IndexedDB:ssä** `KeyValueStore`in kautta, eikä sillä puolella ole
**yhtään** version tarkistusta, ei tälle eikä millekään muullekaan kentälle.

Ilman erillistä korjausta palaava pelaaja olisi lukenut vanhan `{water,wood,gold}`
poolinsa **luotettuna** uudeksi yhdeksän kentän muodoksi — puuttuvat kentät
`undefined`ina, ja ensimmäinen `canAfford`/`spend`-kutsu olisi laskenut
`undefined + number`illa. Pooli olisi alkanut hiljaa täyttyä `NaN`:lla, täsmälleen
samaa lajia hiljainen korruptio kuin v2:n taso-118-bugi.

**Korjattu suoraan siellä missä data oikeasti asuu**: `pouch.ts#read` tunnistaa nyt
onko tallennettu pooli nykyistä muotoa (`isCurrentShape`, jokainen `RESOURCE_KINDS`-kenttä
numero), ja jos ei, aloittaa tyhjästä `EMPTY_POOL`ista — sama "resetoi äläkä arvaa"
-periaate kuin `SAVE_VERSION`illa, vain kirjoitettuna sinne missä se oikeasti vaikuttaa.
Testattu: `resources.test.ts`, *"resets a pre-BRDC-ECON-001 pool instead of trusting it
as the new shape"*.

**Yleisempi ongelma avattu omaksi tiketikseen: `BRDC-PERSIST-002`.** IndexedDB:llä ei
ole minkäänlaista skeemaversiota minkään sen kantaman datan osalta — solut, kotipesä,
linna, puolustus, kaikki. Tämä tiketti korjasi vain resurssipoolin, koska se on ainoa
muoto joka juuri nyt muuttui; seuraava kenttä, joka vaihtaa muotoaan, kohtaa saman
riskin ellei `BRDC-PERSIST-002` ole silloin tehty.

## Ei tässä

- Rakennukset. Ne ovat `BRDC-BUILD-001`. Tämä tiketti tekee vain lompakon, jota ne käyttävät
- Maastotyypit, jotka uudet resurssit vaativat (vuori → rauta, mäki → viini).
  Ne ovat `BRDC-TERRAIN-002`, ja nämä kaksi tehdään peräkkäin samana työnä
- Väestö ja asumiskapasiteetti. Suunnitelman Aitta lupaa *"+2 asumiskapasiteettia"*,
  mutta pelissä ei ole väestöä. Ratkaistaan `BRDC-BUILD-001`:ssä
