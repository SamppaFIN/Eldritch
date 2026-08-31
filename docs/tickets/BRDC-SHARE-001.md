# BRDC-SHARE-001 — Jaettu maailma ilman palvelinta: cron ja `world.json`

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WAGER-JSON-001 |
| **Status** | `in_progress` — formaatti, luku ja skripti tehty; cron-Action ajamatta |
| **Valmius** | 80 % |
| **Lähde** | Infinite 2026-08-31: *"tietojen jakaminen tapahtuu esim cron jobilla, joka päivittää tekstitiedoston, mikä tietää kaiken datan"* |

## 🔴 RED

Moninpeli on tällä hetkellä käsin kannettu: `exportChallenge` tuottaa JSONin, pelaaja
liittää sen WhatsAppiin, kaveri tuo sen sisään. Se toimii kaksinpelinä ja lakkaa
toimimasta kolmella pelaajalla — jokainen pari joutuu vaihtamaan datansa erikseen,
eikä kukaan näe koko maailmaa.

Supabase ratkaisisi tämän, mutta se on siirretty tilausmallin dataan ja chattien
persistointiin. Väliin tarvitaan jotain, joka ei ole palvelin.

## 🟢 GREEN

- [x] **`world/<res6>.json`**: julkinen tila lohkoina alueittain, ei yhtenä tiedostona
      (Infiniten "sharding res 6:lla heti" -linjaus). `world.ts#WorldShard`,
      `buildShards`, `apps/game/public/world/`
- [x] Peli **lukee sen** viewportin alueille (`useWorld` → `fetchWorldShards` →
      `regionsCoveringBBox`) ja näyttää muut kartalla tuotuina soluina. *(Selaimessa
      todentamatta — automaattikattavuus: `worldSource.test.ts`, `world.repo.test.ts`)*
- [~] Kirjoituspolku **olemassa ja dokumentoitu**: `worldSubmissionUrl` avaa esitäytetyn
      issuen (`world-submission`-label). Näkyvä "julkaise alueeni" -nappi jää pieneksi
      jatkoksi — funktio ja polku ovat valmiit
- [~] **GitHub Action** `.github/workflows/world.yml` kirjoitettu: cron 30 min +
      `workflow_dispatch`, kokoaa avoimet issuet, `node scripts/build-world.mjs`, commit +
      push, sulkee issuet. **Ei ajettu** — cron käy vain `main`illa, ja tämä on haaralla.
      Sen kutsuma merge-logiikka on `world.ts`:ssä ja testattu
- [x] Jokainen lähetys **tarkistetaan checksumilla** — `WorldSubmission` on allekirjoitettu
      kirjekuori, `parseSubmission` torjuu `damaged`in samalla FNV-1a:lla kuin `challenge.ts`
- [x] Tuntematon versio **hylätään nimeltä** — `parseWorld`/`parseSubmission` →
      `{ ok: false, fault: 'wrong-version' }`, ei hiljaista ohitusta
- [x] Koko **rajattu ja testattu** — `MAX_SHARD_CELLS`, `parseWorld`/`parseSubmission`
      torjuvat `too-large`n; `world.test.ts` todentaa rajan vakiosta, ei literaalista
- [x] Peli toimii **ilman yhtään lohkoa** — `fetchWorldShards` nielee 404:n ja verkkovirheen,
      `useWorld` ei koskaan nosta virhettä
- [x] Vanhentunut maailma näkyy **ikänä** — `worldAgeMs` + `MapView`-rivi "Other realms
      last stirred N h ago"
- [x] **Tuotu solu ei rappeudu paikallisesti** — `Cell.imported`, `projectCell` palauttaa
      sen koskemattomana; `sweepDecay` ei koskaan heikennä tai vapauta sitä
- [x] Testi: tuotu solu ei muutu viikossakaan — `decay.test.ts` (`projectCell` 30 vrk,
      `sweepDecay` 90 vrk) ja `world.repo.test.ts` (`runDecay` +30 vrk, `getCells` +60 vrk)

## Toteutettu 2026-08-31

Malli suoraan `challenge.ts`:stä: versioitu kirjekuori, jaettu `checksum` (FNV-1a),
nimetyt faultit, `*ToCells` joka päivää tuonnit `now`:iin.

- **`packages/core/src/data/world.ts`** — `WorldShard` (yksi res 6 -alue), `buildShards`
  (nippu alueittain, katto `MAX_SHARD_CELLS`), `parseWorld`, `worldToCells` (merkkaa
  `imported: true`), `worldAgeMs`. Lisäksi `WorldSubmission` + `buildSubmission` /
  `parseSubmission` — allekirjoitettu viesti *maailmaan sisään*.
- **`Cell.imported?: boolean`** — additiivinen, ei `SCHEMA_VERSION`-nostoa (puuttuva =
  paikallinen). `projectCell` palauttaa tuodun solun koskemattomana. Tämä on
  `BRDC-SCALE-001`:stä siirretty kohta, nyt kun "tuotu solu" on käsite.
- **`GameRepository.importWorld`** + `MockRepository` — yhdistää lohkon, ohittaa solun
  jonka paikallinen pelaaja omistaa (riita ratkaistaan Wagerilla), palauttaa määrät ja
  `generatedAt`. Idempotentti.
- **`scripts/build-world.mjs`** — ohut fs-kääre: `parseSubmission` per issue-body,
  `buildShards`, kirjoittaa `apps/game/public/world/<region>.json`. Kaikki validointi on
  `world.ts`:ssä ja testattu.
- **`.github/workflows/world.yml`** — cron, `[~]` ei ajettu (käy vain `main`illa).
- **Client:** `apps/game/src/data/worldSource.ts` (`fetchWorldShards` 404-sietoinen,
  `worldSubmissionUrl`), `features/territory/useWorld.ts` (hakee + yhdistää viewportin
  alueille), `MapView`-rivi ikää varten. `MapView` ylitti 400 riviä → `useWorld`
  eriytettiin (sama jako-sääntö).

**Jäljellä:** cron-Actionin oikea ajo (`main`illa), näkyvä julkaisunappi, ja `seed.ts`:n
tekonaapureiden suhde oikeaan dataan (oma tikettinsä). `MockRepository.ts` on 391/400 —
seuraava metodi vaatii jaon.

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

## ✅ Ratkaistu — `BRDC-CASTLE-001`

**Julkinen tiedosto ei saa sisältää oikeiden ihmisten kotihexoja.** `world.json` on
avoimessa URLissa, ja Hearth on määritelmän mukaan se ruutu, jossa pelaaja asuu. Res 11
-solu on ~46 m leveä: se on osoite.

Tämän tiketin ensimmäinen versio esitti kolme vaihtoehtoa (karkeampi resoluutio, Hearth
pois viennistä kokonaan, tai hyväksytään koska "peli on kavereiden kesken"). Kaikki
kolme olivat vääriä kysymyksiä: ongelma ei ole *tarkkuus* vaan se, että Hearth itsessään
ei saa koskaan olla julkaistava arvo, riippumatta resoluutiosta.

**Oikea ratkaisu on erillinen sijainti, ei karkeampi sama sijainti** — `BRDC-CASTLE-001`,
tehty ja testattu: `getCastle()` arvotaan kerran laitteella `assignCastle`illa, ei ole
johdettavissa Hearthista, ja se on ainoa asia, jonka `exportChallenge` julkaisee jo nyt
(ks. sen oma *Sivulöytö*: sama vuoto oli olemassa Wagerissakin ennen korjausta). Kun
`world.json` rakennetaan, sen on luettava `getCastle()`, ei `getHome()`ia — sama sääntö.

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

Kaksi tarkkuustasoa jää voimaan **alueelle**, mutta talon sijainti ei vaihtele
kummallakaan rivillä — se on aina Linna:

| Kenelle | Alue | Talo | Missä |
|---|---|---|---|
| Julkisesti kaikille | Linna + alue res 8 | Linna | `world.json` |
| Sille, jonka haastat | Koko lääni res 11 | **Linna, ei koskaan Hearth** | `exportChallenge`, käsin lähetetty |

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
