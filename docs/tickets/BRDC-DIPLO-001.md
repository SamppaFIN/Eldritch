# BRDC-DIPLO-001 — Kaupunkivaltio Härmälässä, ja kauppa sen laiturilla

| | |
|---|---|
| **Vaihe** | 3 → PIVOT-2026-09-09 |
| **Effort** | L (päivä) |
| **Riippuvuudet** | BRDC-TERRAIN-003 (Härmälän kartoitus), BRDC-CLAIM-003 (piiritys), BRDC-ECON-006 (pussi) |
| **Status** | `done` — 2026-09-11 (v0.5.67) |
| **Valmius** | 95 % — ydin ja seami täysin testattu; kaupan **käyttöliittymävuoro** ei e2e-katteessa, syy alla |
| **Lähde** | Infinite 2026-09-10: *"haluan siis että esim tuossa kartassa härmälässä on esiasetettu kaupunkivaltio, kalastuskylä.. mutta siellä on yksi heksa, mistä pystyy tekemään diplomatiaa.. alkuun vain kaupankäynti, voi vaihtaa omia resursseja toiseen jollain pienellä hävikillä."* |

## 🔴 RED

**Kartalla ei ollut mitään mikä olisi *siellä* eikä generoitu.**

Naapurit olivat kolme siemenrivaalia joiden sijainti lasketaan pelaajan ensimmäisestä
fixistä (`seed.ts`: *"never hard-coded — the game has to work in Tampere, in Turku, and on
a test rig in a different hemisphere"*). Se on oikea sääntö generoidulle sisällölle, mutta
se tarkoitti ettei mikään paikka ollut oikeasti paikka.

Ja resurssit olivat umpikuja: pussissa saattoi olla 500 kiveä ja nolla ruokaa, eikä
niiden välillä ollut mitään.

## 🟢 GREEN

### Kaupunkivaltio

- [x] **`rules/cityState.ts`** — taulukko. Härmälänranta, kalastuskylä, 19 heksaa
      rannalla jonka kartoitus jo kutsuu `coast`iksi.
- [x] **Se ei rapistu eikä vaihda omistajaa kävelemällä.** `projectCell` tunnistaa
      kaupunkivaltion omistajastaan. **Ei `imported`-lippua**, vaikka se olisi antanut
      koskemattomuuden ilmaiseksi: se lippu saa `getCells`in palauttamaan solun
      *näkymästä riippumatta*, mikä on oikein Wagerilla saadulle rivaalille ja väärin
      kylälle — Tampereen kylä olisi piirtynyt Australiassa. **Testit nappasivat tämän.**
- [x] **Maa on vahvaa:** `MAX_STRENGTH` koko kylässä. Se on briefin puolustustornit
      ilmaistuna sillä luvulla jota piiritysmalli jo lukee, ei uutena rakennuksena jota
      kukaan ei voi rakentaa.
- [x] **Se ei ole rivaali.** `isCityState` on olemassa juuri tätä varten, ja
      `MockRepository.test.ts` väittää sen nyt ääneen: kolme rivaalia ovat kolme rivaalia,
      ja kylä ei ole neljäs.
- [x] **Ei maananastusta.** `placeCityStates` kirjoittaa vain sinne missä ei ole solua —
      sama kanta jonka `mergeWorld` ottaa `world.json`iin. Kylä on naapuri.
- [x] **Ajetaan joka käynnistyksellä**, ei kerran: kyliä voi lisätä versioiden välissä, ja
      koska se ei ota mitään, palaava pelaaja saa uuden kylän menettämättä maata.

### Laituri

- [x] **Yksi heksa.** Diplomatia tapahtuu satamassa, ei valikosta — kaupunkivaltion luo
      *kävellään*.
- [x] **Kauppa: parcel 20, hävikki 25 %** — 20 sisään, 15 ulos. Neljännes, koska hävikin
      pitää tuntua olematta rangaistus: **edestakainen vaihto jättää vähemmän kuin
      aloitit**, ja se on koko syy miksi kauppapaikka on valinta eikä nappi jota painetaan
      silmukassa. Testattu erikseen.
- [x] **Torjunta ennen ottamista.** Kauppa jota ei voi tehdä jättää pussin täsmälleen
      ennalleen — testattu, koska se on ainoa tapa jolla tämä voisi hiljaa varastaa.
- [x] Kortti **nimeää kylän** (*Härmälänranta*) geneerisen *"Held by another"*in sijaan, ja
      sanoo **"Held for good — the Void has no claim here"** eikä valheellista lähtölaskentaa.

### Ja se mitä tämä paljasti

- [x] **Kylässä on 19 heksaa ja laituri on yksi niistä.** Ilman vihjettä ovi on
      etsimistä — sama muoto kuin `BRDC-UI-002`, `-UI-003` ja `BUILD-010`. Jokainen kylän
      heksa kertoo nyt kylän nimen ja **kuinka monen heksan päässä laituri on**.
      Huomasin sen vasta kun e2e ei löytänyt sitä; pelaaja ei olisi löytänyt myöskään.

### Rivirajan pakottamat jaot

- [x] `MockRepository` 416 → kylvön runko `seed.ts`:n `seedWorldAt`iin.
- [x] `useSelection` 402 → `useSpells.ts` (riittien tila) ja `useDiplomacy.ts`.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1160**) + `pnpm build` vihreä.
- [x] `cityState.test.ts` (11): taulukon muoto · **täysi vahvuus** · omistaja-id jota
      yksikään pelaaja ei voi saada · haku id:llä ja omistajalla · kauppa ottaa
      neljänneksen · **edestakainen vaihto häviää** · torjuu ennen ottamista · ei vaihda
      asiaa itseensä · tyhjä parcel torjutaan · kokonaisluvut · annettuun pussiin ei kosketa.
- [x] `cityState.repo.test.ts` (9): kylä ilmestyy täydessä vahvuudessa · idempotentti ·
      **ei ota omistettua maata** · **ei ole `imported`** · laituri vastaa vain laiturilla ·
      kauppa kirjoittaa · torjuu laiturin ulkopuolella eikä ota mitään · torjuu tyhjän
      pussin eikä ota mitään · repository löytää laiturin.
- [x] e2e `diplomacy.spec.ts` (2, desktop): kylä on kartalla, nimetty, eikä sillä ole
      lähtölaskentaa · kylän heksa kertoo missä laituri on. Vihreä myös kahdella workerilla.
- [x] `diplomacy` + `opening` + `lands` sarjassa **15/15**.
- [ ] Kenttä: kävele Härmälänrantaan ja vaihda puuta ruokaan. *(Infinite ajaa.)*

## Mitä ei ole katettu, ja miksi

**Kaupan käyttöliittymävuoro** — kaksi sirua ja nappi — ei ole e2e:ssä. Diplomatia
tapahtuu yhdessä heksassa yhdeksäntoista joukossa, ja synteettisen napautuksen osuminen
yhteen res-11-soluun ei ole tässä ympäristössä luotettavaa: kamera palaa pelaajaan ellei
sitä ole irrotettu aidolla raahauksella, raahaus ei aina purre, ja useampi selain samalla
koneella venyttää joka askeleen yli aikarajojensa. **Kolme eri muotoa kokeiltiin; jokainen
meni yksin läpi ja kaatui kuormassa, eri kohdista.**

Vilkkuva testi on pahempi kuin rehellinen aukko, joten vaihto on katettu siellä missä se
voidaan kattaa tarkasti — `cityState.repo.test.ts` ajaa sen oikean `MockRepository`n läpi.
Kattamatta jää kaksi sirua ja nappi.

## Ei tässä

- **Muut diplomatian muodot** — liittoutuminen, lahjat, sota. Infinite sanoi *"alkuun vain
  kaupankäynti"*.
- **Kylän oma merkki kartalla.** Laituri ansaitsisi ikonin, ja `cells-flag` on jo
  symbolitaso — mutta `BRDC-HEX-003` omistaa heksatasojen siivouksen, ja neljäs taso ilman
  omistajaa ennen sitä olisi velkaa.
- **Useampi kaupunkivaltio.** Taulukko on lista; toisen lisääminen on rivi dataa. Yksi
  riittää todistamaan mekaniikan, ja loput kuuluvat karttaeditorille (PIVOT §8).
- **Kaupan rajoittaminen** (päivittäinen katto, kylän oma varasto). Hävikki on tällä
  erää ainoa jarru. Jos 25 % osoittautuu liian halvaksi, se on tasapainotiketti.
