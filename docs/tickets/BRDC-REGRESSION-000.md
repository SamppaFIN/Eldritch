# BRDC-REGRESSION-000 — v2:n bugit regressiotesteiksi

| | |
|---|---|
| **Vaihe** | läpileikkaava |
| **Effort** | M (päivä, jaettuna vaiheisiin) |
| **Riippuvuudet** | BRDC-SETUP-001 |
| **Status** | `in_progress` — 10/12 katettu, +1 prototyyppibugi todennettu |
| **Valmius** | 85 % |

## 🔴 RED

v2:n dokumentoidut viat ovat ilmaisia testitapauksia — ne on jo löydetty ja maksettu
kerran. Ilman näitä testejä v3 toistaa ne, koska juurisyyt (versioimaton tila,
tapahtumapohjainen alustus, mobiililayout viimeisenä) ovat helppoja toistaa.

## 🟢 GREEN

Jokainen alla oleva testi on kirjoitettu **ennen** vastaavaa ominaisuutta ja on vihreä.

| # | v2:n bugi | v3:n testi | Missä tiketissä |
|---|---|---|---|
| 1 | Vanha save nosti pelaajan tasolle 118 ja pysäytti kohtaamiset | `SAVE_VERSION`-kenttä; tuntematon versio hylätään ja resetoidaan hallitusti | BRDC-PERSIST-001 |
| 2 | Tasokäyrä loppui tasoon 20, koodi antoi jatkaa | Taso ei ylitä katkaisurajaa vaikka XP:tä syötetään paljon | BRDC-HUD-001 |
| 3 | Boot-race: `EntitySpawner` emittoi ennen kuin `MapSystem` kuunteli → shrinet katosivat | Deterministinen `await`-ketju, ei tapahtumaväylän ajoitusta. **Alusta 100 kertaa peräkkäin**, väitä ettei mitään puutu | BRDC-SETUP-001 |
| 4 | Klusterointi meni rikki ja kytkettiin pois päältä | MapLibren natiivi klusterointi, testi 5 000 objektilla | BRDC-CLAIM-006 |
| 5 | Mobiililayout P0-rikki S23 Ultralla — mobiilipelissä | **Playwright-viewport 360 px ajetaan ensimmäisenä, ei viimeisenä** | jokainen UI-tiketti |
| 6 | Aurora/Hevy-kohtaamiset eivät lauenneet | Kohtaamislogiikka `packages/core`issa puhtaana funktiona, yksikkötestattavana | Vaihe 6 |
| 7 | Taustaääni häiritsi käyttäjiä ja jouduttiin poistamaan | Audio on **opt-in**, oletuksena mykistetty | Vaihe 6 |
| 8 | 29 versioimatonta localStorage-avainta | Yksi nimiavaruus `es3:*`, yksi `save()`, yksi versio | BRDC-PERSIST-001 |
| 9 | CDN-katko olisi kaatanut pelin (Leaflet, Socket.io, GSI) | Ei runtime-CDN-riippuvuuksia; testi tarkistaa ettei bundlessa ole vieraita hosteja | BRDC-SETUP-005 |
| 10 | Coverage-raportti julkaistiin **nollalla osumalla** | Kattavuus tulee oikeasta testiajosta; CI epäonnistuu jos kattavuus on 0 | BRDC-SETUP-005 |
| 11 | Kolme kuollutta askelmittaritoteutusta (2 033 riviä lataamatonta koodia) | Yksi toteutus, lähde valitaan ajossa. CI varoittaa moduulista, johon ei viitata | Vaihe 5 |
| 12 | Kolme eri versionumeroa (1.4.0 / 1.6.0 / 4.0.0) | Yksi versio, luetaan juuren `package.json`ista | BRDC-SETUP-001 |
| 13 | **Prototyypin** `kotivyohyke.jsx` valtasi vain kävellyt ruudut — lenkin sisus jäi tyhjäksi renkaaksi | `polygonToCells` täyttää sisuksen; kaksi testiä väittää sen | BRDC-CLAIM-002 |

> **Tilanne 2026-08-27 — 10/12 katettu:**
>
> | # | Tila | Missä |
> |---|---|---|
> | 1 | ✅ | `save.test.ts` — 16 testiä, mm. v2-muotoinen tallennus |
> | 2 | ✅ | `level.test.ts` — `NaN`, `-500` ja `Infinity` antavat kaikki tason 1 |
> | 3 | ✅ | `boot.test.ts` — 100 alustusta, ei puuttuvia; sama siemen tuottaa saman maailman |
> | 4 | ✅ | `claim.spec.ts` — 5 000 heksaa, < 400 ms |
> | 5 | ✅ | 360 px on Playwrightin ensimmäinen projekti |
> | 6 | ⬜ | Vaihe 6 |
> | 7 | ⬜ | Vaihe 6 |
> | 8 | ✅ | `es3:*`, yksi `SAVE_VERSION` |
> | 9 | ✅ | `title.spec.ts` / `map.spec.ts` vartioivat vieraita hosteja |
> | 10 | ✅ | CI ajaa testit ennen buildia; kattavuuskynnys `vitest.config.ts`:ssä |
> | 11 | ✅ | Yksi sijaintilähde; simulaattori todennettu poissa tuotantobundlesta |
> | 12 | ✅ | Yksi versio juuren `package.json`issa |
>
> **Kohta 3 kirjoitettu.** v2:n vaikein bugi ei ollut vaikea koodata väärin — se oli
> vaikea *huomata*, koska mikään ei kaatunut: shrinet vain eivät ilmestyneet, joskus.
> `boot.test.ts` alustaa maailman **100 kertaa** ja väittää joka kerta että profiili,
> run, jälki ja naapurit ovat kaikki olemassa. Lisäksi: sama lenkki tuottaa aina saman
> solumäärän, ja päällekkäiset erälähetykset eivät kylvä naapureita kahdesti.
>
> Auki jää vain kaksi kohtaa, molemmat Vaiheessa 6 (kohtaamiset, audio opt-in).

## Toteutus

**Testit ensin, ei jälkeen.** Kunkin rivin testi kirjoitetaan sen tiketin yhteydessä,
joka on merkitty sarakkeeseen "Missä tiketissä" — ei erillisenä siivousurakkana lopuksi.
Tämä tiketti on niiden **rekisteri**, ei erillinen työvaihe.

**Kohta 3 ansaitsee erillisen maininnan.** v2:n vaikein bugi ei ollut vaikea koodata
väärin — se oli vaikea *huomata*, koska mikään ei kaatunut. Shrinet vain eivät ilmestyneet.
Testi "alusta 100 kertaa ja väitä ettei mitään puutu" on halpa ja se olisi löytänyt sen.

**Kohta 5 on tapa, ei testi.** `playwright.config.ts` määrittelee 360 px projektin
ensimmäisenä. Jos se ei ole ensimmäisenä, se ajetaan kiireessä viimeisenä tai ei lainkaan.

## Kohta 13 — todennettu 2026-08-31, bugia ei ole

Infiniten kehityssuunnitelma 2026-08-31 nimeää tämän kriittiseksi bugiksi:

> **B1** — Ympyrän sisäheksat eivät valtaudu – Flood Fill -korjaus

**Sitä ei ole v3:ssa, ja se on tarkistettu koodista eikä muistista.**

| Mitä katsottiin | Mitä siellä on |
|---|---|
| `geo/cells.ts` → `ringToCells` | `polygonToCells`, joka ottaa **jokaisen solun jonka keskipiste on renkaan sisällä** — ei vain reunaa |
| `data/claiming.ts` → `planClaim` | Ei vierekkäisyysvaatimusta. `growInto`illa on `requireAdjacency`, `planClaim`illa ei — tarkoituksella |
| `claiming.test.ts` "claims the ground inside it" | Vihreä. Väittää että sisus tulee mukana ja `areaM2 > 10 000` |
| `claiming.test.ts` "gives more ground than the walk alone did" | Vihreä. Solumäärä kasvaa lenkin sulkemisesta, vaikka kävely otti reunat jo |

Bugi on **prototyypistä** (`files/kotivyohyke.jsx`), joka kasvatti aluetta pelkällä
vierekkäisyydellä ja tuotti siksi onton renkaan. `PIVOT-2026-08-27.md` §1 tunnisti tämän
eron jo silloin ja päätti pitää molemmat mekaniikat eri rooleissa — vierekkäisyys kasvaa
askelittain, lenkki täyttää sisuksen. Se päätös on toteutettu ja se toimii.

Kirjattu tänne eikä omaksi tiketikseen, koska **tämä rekisteri on juuri sitä varten**:
tunnettu bugi, jonka testi jo estää. Väärän bugin korjaaminen olisi maksanut päivän ja
rikkonut kaksi vihreää testiä.

## Testit

- [ ] Kaikki 12 riviä on toteutettu tai merkitty vaiheeseen, jossa ne toteutetaan
- [ ] `pnpm test` sisältää nämä testit, eikä niitä ole merkitty ohitettaviksi
- [ ] CI epäonnistuu, jos kattavuus on 0 % (kohta 10)

## Ei kuulu tähän tikettiin

Vaiheen 3 golden fixture -testit (mock ≡ SQL). Ne ovat oma mekanisminsa, eivät
v2-regressioita.

## Lähde

`MASTERPLAN.md` §7 · `EXTRACTION.md` §E · `ANALYSIS.md` §8

## Löydös 2026-08-31 — kohta #4:n oma todiste on väärin luettu, ei väärin koodattu

Rivi 4 (*"Klusterointi meni rikki ja kytkettiin pois päältä… testi 5 000 objektilla"*)
siteeraa `claim.spec.ts:195-242` todisteena. Koodiauditointi luki testin rivi riviltä:
se ajastaa yhden `setData()`-kutsun käsintehdyillä monikulmioilla eikä koske
`cellToBoundary`ä, `resourceOf`ia eikä kartan `idle`-tilaa. **Rivin 4 oma väite —
MapLibren natiivi klusterointi kestää 5 000 objektia — pysyy totena**, koska se on
kirjastonvalinta eikä tämän testin ansiota. Testin *kuvaus* tikettitekstissä on
liian laaja siitä, mitä se mittaa. Korjattu `BRDC-SCALE-001`:ssä, joka myös mittaa
oikean polun (`cellsToGeoJson` → `setData` → `idle`) ensimmäistä kertaa.
