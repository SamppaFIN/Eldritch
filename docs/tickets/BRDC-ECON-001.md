# BRDC-ECON-001 — Talouden perusta: kymmenen resurssia ja tuotannon katto

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-TERRAIN-001, BRDC-WARD-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1 (hinnat ja tuotot) |

## 🔴 RED

`ResourcePool` on `{ water, wood, gold }`. Kehityssuunnitelman rakennustaulukot vaativat
**puuta, kiveä, rautaa, ruokaa, kultaa, viisautta, manaa, kulttuuria ja tokeneita** —
ja jokainen rakennus, loitsu, teknologia ja ihme viittaa niihin. Yksikään suunnitelman
rivi ei ole toteutettavissa ennen kuin poolissa on oikeat kentät.

Tämä on koko suunnitelman pohjatyö: `ward.ts`, `spoils.ts`, `wager.ts`, `terrain.ts`,
`MockRepository`, HUD ja `CellPanel` koskevat kaikki pooliin. Jos tämä tehdään vasta
rakennusten jälkeen, ne kirjoitetaan kahdesti.

## 🟢 GREEN

- [ ] `ResourcePool` kattaa suunnitelman **kymmenen** resurssia
- [ ] `water` on korvattu **`food`**illa: järvi antaa kalaa, ei vettä — se on suunnitelman
      oma malli (Kalastuslaituri) ja se poistaa yhden merkityksettömän luvun HUDista
- [ ] `EMPTY_POOL`, `canAfford`, `spend` ja `trickle` toimivat kentistä johdettuna,
      **eivät käsin lueteltuina** — yhdenkään uuden resurssin lisääminen ei saa vaatia
      kymmentä muokkausta
- [ ] `SAVE_VERSION` = 2. Vanha tallennus **hylätään ja resetoidaan** näkyvästi;
      `es3:*` ei kanna kahta poolin muotoa (`BRDC-PERSIST-001`:n koko idea)
- [ ] **Sama versionosto kuljettaa myös solun avainmuodon**, jos `BRDC-SCALE-001`:n
      alueperusteinen kysely on silloin tekeillä: `cell:${h3}` → `cell:${regionOf(h3)}:${h3}`.
      Kaksi resetoivaa versionostoa peräkkäin ilman syytä olisi tarpeetonta kipua —
      tarkista `BRDC-SCALE-001`:n *"Avain ei osaa sitä mitä tämä tiketti aiemmin väitti"*
      ennen tätä kohtaa
- [ ] Kaikki 415 nykyistä testiä vihreinä muutoksen jälkeen
- [ ] **Tuotantokatto** ja **lepotila** toteutettuna ja testattuna — ks. alla

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

- [ ] `settleResources` kunnioittaa kattoa eikä koskaan ylitä sitä
- [ ] Solu, jota ei ole käyty 48 h:iin, **ei tuota** — testattu kelatulla kellolla
- [ ] Kävely herättää solun, ja se näkyy pelaajalle sanoina, ei pelkkänä lukuna
- [ ] Täysi varasto **kerrotaan** ("Varasto täynnä — tuotanto seisoo"), ei hukata hiljaa

## Toteutus

Resurssit ovat **taulukkodataa, eivät luokkia**. Golden rule 3: `packages/core` on puhtaita
funktioita. Suunnitelman §8.2 `class BuildingSystem` toteutetaan `RESOURCES`-taulukkona ja
funktioina sen ympärillä — sama semantiikka, testattavissa ilman instansointia.

`gold` säilyy nimensä; `wood` säilyy. Vain `water` → `food` vaihtuu, ja se on ainoa
kohta, jossa vanha data ei käänny — siksi versio nousee eikä migraatiota kirjoiteta.

## Ei tässä

- Rakennukset. Ne ovat `BRDC-BUILD-001`. Tämä tiketti tekee vain lompakon, jota ne käyttävät
- Maastotyypit, jotka uudet resurssit vaativat (vuori → rauta, mäki → viini).
  Ne ovat `BRDC-TERRAIN-002`, ja nämä kaksi tehdään peräkkäin samana työnä
- Väestö ja asumiskapasiteetti. Suunnitelman Aitta lupaa *"+2 asumiskapasiteettia"*,
  mutta pelissä ei ole väestöä. Ratkaistaan `BRDC-BUILD-001`:ssä
