# BRDC-CODEX-001 — Codex of Dominion: missä sinä olet, ei kuka voitti

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 11 |
| **Effort** | L (päivä) |
| **Riippuvuudet** | BRDC-SHARE-003 (Worker + KV), BRDC-NATION-001 (`population`), BRDC-TRAIL-003 (`paths`) |
| **Status** | `done` — 2026-09-10 (v0.5.57) |
| **Valmius** | 95 % — koodi valmis ja testattu; **Worker on deployattava** ennen kuin taulukko täyttyy |
| **Lähde** | Infinite 2026-09-10: *"global leaderboard seuraavaksi.. haluan, että se on niinkun Demographics Civilisation pelistä. Rankkaa pelaajat alueen, layline pituuden ja levelin mukaan esim.. voit keksiä muitakin tunnuslukuja, jos löytyy helposti."* |

## 🔴 RED

**Peli ei osannut vastata kysymykseen "miten mulla menee".**

Maailmassa oli jo dataa jokaisesta pelaajasta — Worker pitää `player:<id>`-tiedostoa ja
kävelee ne läpi joka julkaisulla — mutta ainoa tapa nähdä toisia oli katsoa heidän
solujaan kartalla siinä kohtaa mihin kamera sattui osumaan. Ei vertailua, ei sijoitusta,
ei mitään lukua joka kertoisi onko seitsemän heksaa paljon vai vähän.

Ja kaksi asiaa joita Infinite nimenomaan pyysi eivät kulkeneet langan yli lainkaan:
**taso** ja **ley-linen pituus**. `WorldSource` kantoi nimen, lipun, Keepin ja solut —
ei kumpaakaan näistä.

## 🟢 GREEN

### Miksi taulukko eikä pistelista

Tämä on tiketin tärkein päätös. **Ranking-lista kertoo kuudelle seitsemästä kaverista
että he hävisivät.** Civilizationin Demographics-ruutu tekee toisin: joka rivi on yksi
mittari, ja sillä on *sinun lukusi, sijoituksesi, paras, keskiarvo ja huonoin*. Sama data,
mutta kysymys on "missä minä olen" eikä "kuka voitti" — ja kolmantena maa-alassa oleva voi
olla ensimmäinen ley-linessä, ja molemmat näkyvät.

- [x] **Seitsemän mittaria.** Kolme pyydettyä ja neljä jotka olivat jo datassa:

| Mittari | Mistä | Miksi juuri se |
|---|---|---|
| **Land** | `totalAreaM2` | Todellinen pinta-ala — heksat eivät ole samankokoisia |
| **Ley-line** | `leyLineM(paths)` | **Erillistä** maata, ei askelmittari |
| **Consciousness** | `profile.level` | Pyydetty |
| **Population** | `population(solut, Workit)` | Mittari jonka `nation.ts` osasi jo |
| **Works** | `cells[].b.length` | Langalla ennestään |
| **Provinces** | erilliset res-6-alueet | Leveys, ei pinta-ala |
| **Footfall** | `cells[].d` summattuna | **Ainoa jota ei saa yhdessä iltapäivässä** |

- [x] **Ley-line on erillistä maata, ei kumulatiivista matkaa.** `paths`-kartassa on yksi
      merkintä per kuljettu pätkä riippumatta siitä montako kertaa se on ylitetty, joten
      sata lenkkiä saman korttelin ympäri mittaa yhden korttelin. Se on rehellinen luenta
      kysymykseen "kuinka paljon maailmaa olet kävellyt" — ja ainoa jota kannattaa
      rankata, koska askelmittarisumma palkitsee juoksumatosta.
- [x] **Tasapeli jakaa sijoituksen.** Kaksi realmia samalla luvulla ovat molemmat toisia ja
      seuraava on neljäs. Taulukkojärjestyksen mukaan 2. ja 3. keksisi eron jota luvuissa
      ei ole, ja väärälle puolelle jäänyt olisi oikeassa valittaessaan.
- [x] **Puuttuva kenttä luetaan pohjalukemaksi, ei ohiteta.** Ennen tätä tikettiä
      julkaistu realm ei kanna tasoa eikä ley-lineä. Jos se putoaisi noilta riveiltä,
      sijoitukset olisivat eri riveillä eri kokoisia — "3 / 7" yhdellä rivillä ja "3 / 5"
      seuraavalla, samasta taulukosta. Taulukko joka on ristiriidassa itsensä kanssa on
      pahempi kuin taulukko joka on jäljessä.
- [x] **Yksi kysely, ei yksi per alue.** Worker rakentaa taulukon kirjoituksella
      (`rebuild` kävelee jo joka pelaajan tiedoston) ja tarjoilee sen yhdellä KV-luvulla:
      `GET /demographics`. Ilman tätä "global" olisi tarkoittanut "ne pelaajat joiden maata
      satut katsomaan".
- [x] **Yksiköt sen mittakaavan mukaan johon kävelijä yltää.** Maa on m² kunnes on
      neliökilometri näytettävänä — seitsemän heksan realm on 11 353 m², ja "0,01 km²"
      ei kerro uudelle pelaajalle mitään. Ley-line metreinä alle kilometrin, footfall
      päivinä.
- [x] **Sijoitus sanotaan sijoituksena:** "2nd of 3", ei "rank: 2".
- [x] Tyhjä maailma saa lauseen joka kertoo miten taulukko täyttyy — ei spinneriä,
      ei virhettä, ei nollien taulukkoa.
- [x] Reitti sisään: **☰ → Codex of Dominion**. Ei kuudetta nappia HUD:iin; footerin viisi
      haamunappia kääriytyvät jo 360 pikselillä.

### Rivirajan pakottama jako

- [x] `world.ts` osui **405 riviin**. Jaettu, ei nostettu: `worldMerge.ts` sai
      `PlayerFile`-käsittelyn, `mergePlayerFiles`in ja `buildShards`in — **sen puolen jota
      vain Worker ajaa**. Peliklientti ei kutsu niistä yhtäkään. `world.ts` 287,
      `worldMerge.ts` 138.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1090**) + `pnpm build` vihreä.
- [x] `demographics.test.ts` (11): joka realm on joka rivillä · paras/huonoin/keskiarvo ·
      **vanha julkaisu ei putoa riveiltä** · provinssit ovat alueita eivät soluja ·
      Workit lasketaan yli solujen · väestö maasta ja rakennuksista · footfall summaa
      päivät · tyhjä maailma on nollataulukko eikä kaatuminen · **tasapeli jakaa
      sijoituksen** · tuntematon realm ei ole taulukossa.
- [x] `figures.test.ts` (8): m² → km² vasta kilometrin kohdalla · metrit → km ·
      footfall yksikössä day/days · **11., 12. ja 13.** eivät ole "11st" · joka
      mittarilla on nimi ja alle 90 merkin selitys.
- [x] e2e `dialogs.spec.ts` +2 desktopilla: tyhjä maailma sanoo miten se täyttyy ja **ESC
      sulkee**; ja täysi taulukko syötettynä `page.route()`lla **oikealla paikallisella
      id:llä** — oma luku omassa yksikössään, "2nd of 3", ja rivin avaus nimeää johtajan.
- [x] mobile-360 `standards.spec.ts` (axe, WCAG 2.2 AA) 8/8.
- [~] **Workerilla ei ole testejä.** Sen osuus on kaksi riviä (`demographicsOf` + yksi
      KV-kirjoitus) ja `demographicsOf` on täysin testattu. Worker-testiharness on oma
      työnsä eikä sitä pystytetä tämän mukana.
- [ ] **Deploy.** `GET /demographics` on olemassa vasta kun Worker on julkaistu, ja avain
      kirjoittuu vasta seuraavalla `/submit`illa. Siihen asti klientti saa 204 ja näyttää
      tyhjän tilan — oikein, mutta ei sama asia kuin toimivaksi todettu. *(Infinite ajaa
      `wrangler deploy`n.)*
- [ ] Kenttä: kaksi laitetta julkaisee → taulukossa on kaksi realmia ja sijoitukset pitävät.

## Mitä tämä ei todista

Taulukko on niin rehellinen kuin sen syöte. Worker ei voi erottaa valehtelijaa rehellisestä
pelaajasta — se on sama kompromissi jonka `BRDC-SHARE-003` kirjasi auki, ja Codex perii sen
sellaisenaan. Auktoriteetti tulee Vaiheessa 5. Tähän asti Codex on **mitä muut sanovat
omistavansa**, ja se kannattaa sanoa ääneen jos joku ihmettelee.

## Ei tässä

- **Kartalle lentäminen realmia napauttamalla** — `BRDC-ATLAS-001`. Codex vastaa
  kysymykseen "miten mulla menee", Atlas kysymykseen "missä he ovat". Ne ovat eri ruutuja.
- **Aikasarja** ("olit viime viikolla neljäs"). Vaatisi Workerin säilyttämään historiaa,
  ja se on eri tietorakenne kuin yksi avain joka kirjoitetaan yli.
- **Kerätty viisaus ja löydetyt Ihmeet** — PIVOT §11 merkitsi ne itsekin harkittaviksi;
  Ihmeitä ei ole vielä olemassa.
- **Peliin käytetty aika.** PIVOT pyysi sen, mutta mitään kelloa ei tallenneta tänään, ja
  sellaisen lisääminen pelkkää listaa varten olisi uusi mekaniikka. **Footfall** vastaa
  samaan kysymykseen paremmin: se mittaa palaamista, ei ruudun tuijottamista.
