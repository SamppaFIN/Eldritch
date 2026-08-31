# 🎫 Toteutustiketit — Eldritch Sanctuary v3

Lähde: `files/MASTERPLAN.md` · `files/CLAUDE.md` · `files/EXTRACTION.md` · `files/PROMPTS.md`
Luotu: 2026-08-26

**Tämä on tikettien totuuden lähde.** `claude.md` (repon juuri) on projektin
työskentelysääntöjen totuuden lähde. Ne on yhdistetty 2026-08-26 — ristiriitoja ei ole,
ja jos sellainen syntyy, se korjataan heti eikä kirjata muistiin.

---

## Rajaus: ensin GitHub-hostattava versio

Vaiheet **0–2** tuottavat pelattavan pelin, joka toimii **staattisena sivuna GitHub
Pagesissa ilman backendia**. Ei Supabasea, ei tilejä, ei verkkoa. Kaikki tila selaimessa
(IndexedDB + localStorage).

> **Vaiheen 2 hyväksymisportti on projektin tärkein hetki:**
> kävele korttelin ympäri → alue täyttyy. Kävele sama reitti huomenna → alue vahvistuu.
> Kelaa aikaa 20 vrk → alue vapautuu. **Peli on olemassa.**

Vaihe 2 on läpi selaimessa, ja Infinite avasi jatkon 2026-08-31: **4X-sisältö ennen
Supabasea.** Vaihe 3 on nyt Sivilisaatio — rakennukset, teknologia, mana, ihmeet — ja se
ajetaan yhä ilman backendia. Datan jako hoidetaan cronilla ja `world.json`illa
(`BRDC-SHARE-001`). Supabase kutistuu tilausmallin dataan ja chattien persistointiin,
ja se on nyt Vaihe 5.

Ennen sitä on yksi portti, joka ei ole neuvoteltavissa: **`BRDC-MOBILE-001`.** Peli on
todennettu selaimessa ja simuloidulla GPS:llä, eikä kukaan ole vielä kävellyt korttelia
puhelin taskussa. 15 viikkoa sisältöä sellaisen rungon päälle on täsmälleen v2:n virhe.

---

## Tiketit

### ⏸️ Jäissä

| ID | Nimi | Effort | Riippuvuudet | Huom |
|---|---|:---:|---|---|
| [BRDC-SEC-000](BRDC-SEC-000.md) | Vuotaneiden avainten rotaatio | S | — | ⏸️ **siirretty Vaiheeseen 3** — Vaiheet 0–2 eivät käytä yhtään avainta |

### 🧱 Vaihe 0 — Perustus (GitHub Pages pystyyn)

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-SETUP-001](BRDC-SETUP-001.md) | Monorepo, pnpm workspaces, TS strict | M | — |
| [BRDC-SETUP-002](BRDC-SETUP-002.md) | Design-tokenit ja fontit — yksi tiedosto | M | SETUP-001 |
| [BRDC-SETUP-003](BRDC-SETUP-003.md) | `GameRepository`-rajapinta ja tyypit | S | SETUP-001 |
| [BRDC-SETUP-004](BRDC-SETUP-004.md) | Aloitusnäkymä — "Begin the Awakening" | S | SETUP-002 |
| [BRDC-SETUP-005](BRDC-SETUP-005.md) | GitHub Pages -deploy (CI) | S | SETUP-004 |
| [BRDC-PERSIST-001](BRDC-PERSIST-001.md) | `es3:*`-nimiavaruus ja `SAVE_VERSION` | S | SETUP-003 |

**Portti V0:** ✅ **läpi** — https://samppafin.github.io/Eldritch/

### 🗺️ Vaihe 1 — Kartta ja ley-line

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-GEO-001](BRDC-GEO-001.md) | Geometriaydin: haversine, nopeus, suodatus | M | SETUP-001 |
| [BRDC-SIM-001](BRDC-SIM-001.md) | GPS-simulaattori ja reittifixturet | M | GEO-001 |
| [BRDC-MOCK-001](BRDC-MOCK-001.md) | `MockRepository` — IndexedDB + siemendata | M | SETUP-003, PERSIST-001 |
| [BRDC-MAP-001](BRDC-MAP-001.md) | MapLibre, tumma karttatyyli | M | SETUP-002 |
| [BRDC-TRAIL-001](BRDC-TRAIL-001.md) | Sijainnin seuranta ja jäljen tallennus | M | GEO-001, MOCK-001, MAP-001 |
| [BRDC-TRAIL-002](BRDC-TRAIL-002.md) | Ley-linen renderöinti hehkulla | S | TRAIL-001 |
| [BRDC-HUD-001](BRDC-HUD-001.md) | HUD: taso, XP, matka, GPS-tarkkuus | S | TRAIL-001 |

**Portti V1:** ⏳ **odottaa** — kävele ulkona 10 min **lentokonetilassa**. Jälki seuraa ja
säilyy reloadin yli. *Tätä ei voi ajaa koneelta: se vaatii puhelimen ja ulko-oven.*
Kaikki seitsemän tikettiä on koodattu ja todennettu siltä osin kuin selain voi todentaa.

### 🔷 Vaihe 2 — Aluevaltaus

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-CLAIM-001](BRDC-CLAIM-001.md) | Lenkin tunnistus (`loopDetection`) | L | GEO-001, SIM-001 |
| [BRDC-CLAIM-002](BRDC-CLAIM-002.md) | Polygoni → H3-solut (res 11) | S | CLAIM-001 |
| [BRDC-CLAIM-003](BRDC-CLAIM-003.md) | Valtaus ja piiritysmalli (`capture`) | L | CLAIM-002 |
| [BRDC-CLAIM-004](BRDC-CLAIM-004.md) | Rappeutuminen ja vapautuminen (`decay`) | M | CLAIM-003 |
| [BRDC-CLAIM-005](BRDC-CLAIM-005.md) | `MockRepository`: closeLoop, getCells, aikakelaus | M | CLAIM-004, MOCK-001 |
| [BRDC-CLAIM-006](BRDC-CLAIM-006.md) | Heksojen renderöinti kartalle | M | CLAIM-005, MAP-001 |
| [BRDC-HUD-002](BRDC-HUD-002.md) | HUD: omistetut solut, vahvin alue | S | CLAIM-006, HUD-001 |

**Portti V2:** ✅ **läpi selaimessa** — kortteli täyttyy (`claim.spec.ts`), huominen
vahvistaa ja 16 vrk vapauttaa (`decay.spec.ts`, kellon kelauksella). **Peli on olemassa.**
Ulkona kävelty todennus on yhä tekemättä, kuten V1:kin.

### 🔀 Vaihe 2.5 — suunnanmuutos (`PIVOT-2026-08-27.md`)

Uusista suunnittelumuistiinpanoista ja ensimmäisestä ulkotestistä. Perustelut ja
hylätyt vaihtoehdot: [PIVOT-2026-08-27.md](PIVOT-2026-08-27.md).

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-HEARTH-001](BRDC-HEARTH-001.md) | Seikkailu alkaa kotipesän hyväksymisestä | M | GROW-001, DWELL-001 |
| [BRDC-GROW-001](BRDC-GROW-001.md) | Vierekkäisyyskasvu: alue laajenee askelittain | M | CLAIM-003, CLAIM-005 |
| [BRDC-DWELL-001](BRDC-DWELL-001.md) | Vietetty aika → Ankkurikivi ja temppelit | M | GROW-001 |
| [BRDC-VIGIL-001](BRDC-VIGIL-001.md) | Vigil: raja pysyy totena taskussa | M | GROW-001, DWELL-001 |
| [BRDC-AWAKEN-001](BRDC-AWAKEN-001.md) | Sulkeutuminen on tapahtuma: ilmoitus + heksojen paljastus | S | CLAIM-006 |
| [BRDC-TERRAIN-001](BRDC-TERRAIN-001.md) | Maasto → resurssit → alueen kehitys | L | GROW-001 |
| [BRDC-WARD-001](BRDC-WARD-001.md) | Resurssien käyttö: solun vahvistaminen | M | TERRAIN-001, CLAIM-004 |
| [BRDC-WAGER-JSON-001](BRDC-WAGER-JSON-001.md) | Haasta kaveri: moninpeli ilman palvelinta | M | CLAIM-005, HEARTH-001 |
| [BRDC-WAGER-BATTLE-001](BRDC-WAGER-BATTLE-001.md) | Taistelu clientillä · muuri vai örkit | M | WAGER-JSON-001 |
| [BRDC-INSPECT-001](BRDC-INSPECT-001.md) | Maan tieto: heksan popup ja klikattava kotipesä | M | WARD-001, TERRAIN-001 |

### 📱 Vaihe 2.6 — Mobiili ja jaettu maailma

Infiniten linjaus 2026-08-31: *"tällä hetkellä tärkeintä on saada mobiilikokemus
täydelliseksi"*. Tämä vaihe menee kaiken 4X-sisällön edelle.

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-MOBILE-001](BRDC-MOBILE-001.md) | Mobiilikokemus täydelliseksi | L | koko Vaihe 2.5 |
| [BRDC-SHARE-001](BRDC-SHARE-001.md) | Cron ja `world.json` — jaettu maailma ilman palvelinta | M | WAGER-JSON-001 |
| [BRDC-CASTLE-001](BRDC-CASTLE-001.md) | Linna: julkinen kasvo, joka ei ole kotiovi | M | HEARTH-001, SHARE-001 |
| [BRDC-ASCII-001](BRDC-ASCII-001.md) | Kartta ASCII-merkkeinä | M | TERRAIN-002, SHARE-001 |
| [BRDC-SCALE-001](BRDC-SCALE-001.md) | Lukupolku on täysi skannaus — korjaus ennen jakamista | L | MOCK-001, CLAIM-005, CLAIM-006 |

**Portti V2.6:** ⬜ kävele kortteli ympäri oikealla GPS:llä, näyttö välillä pois, ja
kirjaa mitattu akunkulutus. Tämä on Vaiheiden 1 ja 2 ulkoportti, jota ei ole vielä ajettu.

### 🏛️ Vaihe 3 — Sivilisaatio

Lähde: **Infiniten kehityssuunnitelma 2026-08-31** (Eldritch 4X). Jokainen suunnitelman
osio on alla tikettinä; suunnitelman omat tunnukset (R1–R3, M1–M4, …) on merkitty
tikettien `Lähde`-riveille, jotta mitään ei katoa matkalla.

**Perusta** — nämä ensin, tai kaikki muu kirjoitetaan kahdesti:

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-ECON-001](BRDC-ECON-001.md) | ✅ Yhdeksän resurssia ja tuotannon katto | L | TERRAIN-001, WARD-001 |
| [BRDC-TERRAIN-002](BRDC-TERRAIN-002.md) | 🔨 Maastokirjo 4 → 7, ja oikea data vektoritiilistä | L | TERRAIN-001, ECON-001 |
| [BRDC-HEX-001](BRDC-HEX-001.md) | ✅ Heksan muisti: löytäjä, historia, päivittäinen omistajuus | M | CLAIM-003, INSPECT-001 |

**Rakentaminen ja eteneminen:**

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-TECH-001](BRDC-TECH-001.md) | 🔨 Teknologiapuu ja aikakaudet | M | ECON-001 |
| [BRDC-BUILD-001](BRDC-BUILD-001.md) | 🔨 Rakennusjärjestelmän ydin ja perusrakennukset | L | ECON-001, TERRAIN-002, TECH-001 |
| [BRDC-BUILD-002](BRDC-BUILD-002.md) | Aluekohtaiset parannukset ja päivitysketjut | M | BUILD-001, TERRAIN-002 |
| [BRDC-BUILD-003](BRDC-BUILD-003.md) | Vaikutusalueen rakennukset ja uskollisuus | M | BUILD-001, HEX-001, DWELL-001 |

**Mystiikka:**

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-MANA-001](BRDC-MANA-001.md) | Mana ja temppelin laajennus | M | ECON-001, DWELL-001 |
| [BRDC-SPELL-001](BRDC-SPELL-001.md) | Loitsut: tutkimus, valta, esto, suoja | L | MANA-001, WAGER-JSON-001 |

**Maailma ja löytäminen:**

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-REVEAL-001](BRDC-REVEAL-001.md) | Heksan paljastus: sumu, kortti, harvinaisuus | M | AWAKEN-001, TERRAIN-002, HEX-001 |
| [BRDC-WONDER-001](BRDC-WONDER-001.md) | Cthulhu-mytologian 12 ihmettä | M | REVEAL-001, TERRAIN-002, SPELL-001 |
| [BRDC-CITY-001](BRDC-CITY-001.md) | Kaupunkivaltiot, kauppa ja liittoutumat | L | TERRAIN-002, ECON-001, HEX-001 |
| [BRDC-EVENT-001](BRDC-EVENT-001.md) | Tapahtumaketjut, anomaliat, pimeät ajat | M | REVEAL-001, HEX-001 |
| [BRDC-QUEST-001](BRDC-QUEST-001.md) | Seikkailut: järvenpuhdistus ja dialogi | M | EVENT-001, ART-001 |
| [BRDC-ATLAS-001](BRDC-ATLAS-001.md) | Koko Suomi: kaupungit, rajat ja laajeneminen | L | SHARE-001, CASTLE-001, SCALE-001 |

**Pelaajalle näkyvä:**

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-ART-001](BRDC-ART-001.md) | Lovecraft-grafiikka: heksat, liput, loitsuefektit | L | REVEAL-001, TERRAIN-002 |
| [BRDC-STATS-001](BRDC-STATS-001.md) | Tilastot ja tuotantoennuste | M | ECON-001, BUILD-002, INSPECT-001 |
| [BRDC-WIKI-001](BRDC-WIKI-001.md) | Pelinsisäinen tietokirja | M | BUILD-001, TECH-001 |
| [BRDC-TUTOR-001](BRDC-TUTOR-001.md) | Asteittainen opetus | M | BUILD-001, REVEAL-001, WIKI-001 |
| [BRDC-ACHIEVE-001](BRDC-ACHIEVE-001.md) | Saavutukset ja ilmoitukset | S | HEX-001, WONDER-001 |

**Portti V3:** ⬜ rakenna saha kotimetsään, tutki teknologia, löydä ihme, ja **selitä
kaikki kolme pelistä käsin** ilman että kukaan lukee koodia.

#### Suunnitelman sprintit tikkeiksi

Infiniten §7 antaa seitsemän sprinttiä. Alla sama järjestys, kaksi muutosta:
**Sprint 0** on lisätty (mobiiliportti ensin), ja **perusta on siirretty Sprint 1:een**,
koska talous ja maasto ovat kaiken muun alla.

| Suunnitelman sprintti | Tiketit | Muutos |
|---|---|---|
| — | MOBILE-001, SHARE-001 | **lisätty:** ulkoportti ja jako ennen sisältöä |
| 1 · B1, H1–H2 | ECON-001, TERRAIN-002, HEX-001 | **B1 poistettu — bugia ei ole**, ks. REGRESSION-000 #13. Tilalle talouden ja maaston perusta |
| 2 · R1–R3, M1–M2 | TECH-001, BUILD-001…003, MANA-001 | ennallaan, + teknologiapuu joka avaa rakennukset |
| 3 · P1–P3, G1–G2 | REVEAL-001, ART-001 | ennallaan |
| 4 · C1–C4, M3–M4 | CITY-001, SPELL-001 | ennallaan |
| 5 · I1–I12, A1–A2 | WONDER-001, ACHIEVE-001 | ennallaan |
| 6 · S1–S2, W1–W2 | EVENT-001, QUEST-001, WIKI-001 | + tapahtumarunko, jota seikkailut tarvitsevat |
| 7 · T1–T3 | STATS-001, TUTOR-001 | opetus viimeisenä, koska se opettaa kaiken edellisen |

#### Päätökset — kaksi ratkaistu 2026-08-31, yksi auki

| Kysymys | Missä | Tila |
|---|---|---|
| Kolme legendaarista ihmettä vaatii maastoa, jota Tampereella ei ole | `BRDC-WONDER-001` | ✅ **Vastineet.** Pyhäjärvi Härmälässä ajaa valtameren virkaa — R'lyeh on kävelymatkan päässä |
| `world.json` julkaisisi oikeiden ihmisten kotiosoitteet | `BRDC-CASTLE-001` | ✅ **Linna.** Arvotaan kerran laitteella, koti ei poistu puhelimesta. Kaksi tarkkuustasoa |
| Tuottaako ~20 rakennusta "+X/tunti" idle-pelin? | `BRDC-ECON-001` | ✅ **Varastokatto + 48 h lepotila**, tehty ja testattu |
| Onko ASCII näkymä vai siirtomuoto? | `BRDC-ASCII-001` | 🔴 **auki.** Suositus: näkymä. Kuva ihmiselle, JSON pelille, samassa viestissä |
| Palvelinta ei tarvita ihmeiden ainutkertaisuuteen — miten? | `BRDC-WONDER-001` | ✅ **Rajattu argmax.** 12 ihmettä, 3 626 res 5 -solua, 107 ms, 0 törmäystä — mitattu |

Lisäksi kaksi pienempää: asumiskapasiteetti ilman väestöä (`BRDC-BUILD-001`) ja
Majakan liikkumisnopeus pelissä, jossa liikkuminen on omat jalat (`BRDC-BUILD-003`).

### 🧪 Läpileikkaava

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-REGRESSION-000](BRDC-REGRESSION-000.md) | v2:n bugit regressiotesteiksi | M | SETUP-001 |
| [BRDC-PERSIST-002](BRDC-PERSIST-002.md) | ✅ IndexedDB:lle skeemaversio | M | PERSIST-001, MOCK-001 |

**Sääntö:** REGRESSION-000 ei ole erillinen työvaihe vaan **rekisteri**. Sen 12 testiä
kirjoitetaan niissä tiketeissä, jotka rekisteri nimeää — **ennen** vastaavaa ominaisuutta,
ei jälkeen.

**PERSIST-002 avattiin `BRDC-ECON-001`:n sivulöydöstä 2026-08-31, tehty samana päivänä.**
`SAVE_VERSION` suojaa vain `localStorage`a, ja IndexedDB — jossa suurin osa pelin tilasta
oikeasti asuu — ei ollut koskaan saanut vastaavaa. `schema.ts`:n `versioned()`-kääre antaa
sille oman `SCHEMA_VERSION`in; tunnistamaton versio tyhjentää storen ja `MapView` kertoo
sen. `pouch.ts#isCurrentShape` poistettu.

**PERSIST-002:n turvin `BRDC-SCALE-001`:n rajattu kysely tehtiin heti perään** (85 %):
avain on nyt `cell:${regionOf(h3)}:${h3}` (`SCHEMA_VERSION` 1 → 2), ja `getCells(bbox)`
lukee vain viewportin peittämät res 6 -alueet, ei koko storea. `getOwnedCells` ja
`claim.spec.ts`-perftesti jäivät tarkoituksella jäljelle.

---

## Vaiheet 4–6 — ei vielä auki kirjoitettuna

Uudelleennumeroitu 2026-08-31. **Supabase ei ole enää Vaihe 3** vaan kutistuu siihen,
mihin Infinite sen rajasi: *"tilausmallin datan ja chattien persistointiin"*. Kaikki
muu — alueet, rakennukset, jaettu maailma — hoituu ilman sitä (`BRDC-SHARE-001`).

| Vaihe | Sisältö | Tiketti | Avataan kun |
|---|---|---|---|
| **4** | Capacitor, foreground service, allekirjoitettu APK, `version.json` | `BRDC-ANDROID-004` | V3-portti läpi |
| **5** | Supabase: tilausmallin data, chat, tilien persistointi. Golden fixture -testit | `BRDC-MULTI-005` + `BRDC-SEC-000` | V4 tuotannossa |
| **6** | Lore takaisin: codex, löydöt, Fuming Lake, Anchor, teemat, audio | `docs/backlog/` | V5 tuotannossa |

**Vaihe 4 nousi Vaiheen 5 tilalle tarkoituksella.** APK ratkaisee taustaseurannan, ja
`BRDC-MOBILE-001` mittaa juuri sen, kuinka pitkälle selaimella pääsee. Jos vastaus on
"ei tarpeeksi pitkälle", APK on kiireellisempi kuin mikään 4X-sisältö — ja se tieto
saadaan Vaiheessa 2.6, ei vuoden päästä.

Vaiheen 6 sisältö on **jäissä**, ei peruttu. Se on `docs/backlog/`issa datana valmiina.
Tämä on ainoa asia, joka erottaa v3:n v2:sta rakenteellisesti — ja `BRDC-EVENT-001`
on ensimmäinen paikka, jossa sitä aineistoa saa käyttää: valmiiseen mekaniikkaan
sisältönä, ei ominaisuutena.

---

## Edistyminen 2026-08-31

| Vaihe | Tila | Tikettejä |
|---|---|---|
| **0** Perustus | ✅ portti läpi | 6/6 |
| **1** Kartta ja ley-line | 🔨 koodattu, ulkoportti odottaa | 7/7 |
| **2** Aluevaltaus | 🔨 portti läpi selaimessa, ulkoportti odottaa | 7/7 |
| **2.5** Suunnanmuutos | ✅ kaikki `done` | 10/10 |
| **2.6** Mobiili ja jaettu maailma | 🔨 SCALE-001 85 % · SHARE-001 80 % · CASTLE-001 90 %; MOBILE-001 ja ASCII-001 auki | 0/5 |
| **3** Sivilisaatio | ⬜ tiketit kirjoitettu, ei aloitettu | 0/18 |

**Ulkoportti on yhä auki.** Kaikki on todennettu selaimessa ja simuloidulla GPS:llä,
mutta kukaan ei ole vielä kävellyt korttelin ympäri puhelin taskussa. Se on Vaiheiden
1 ja 2 oikea hyväksymiskriteeri, eikä sitä voi ajaa koneelta — ja se on nyt oma
tikettinsä (`BRDC-MOBILE-001`) sen sijaan että se olisi alaviite.

Testejä: **541 yksikkö** (41 tiedostoa, ajettu 2026-08-31) + Playwright
(360 px ajetaan ensin). `pnpm typecheck` ja `pnpm lint:lines` vihreitä samalla ajolla.

**Valmiusasteet** — `[x]` vasta kun ajettu ja todennettu (`claude.md` §4.5):

```
100 %  SETUP-001..005 · GEO-001 · SIM-001 · MAP-001 · CLAIM-001..004
 95 %  MOCK-001 · TRAIL-001 · HUD-001 · CLAIM-005
 90 %  HUD-002
 90 %  PERSIST-001
 95 %  CLAIM-006 · PERSIST-002
 85 %  TRAIL-002 · SCALE-001
 80 %  SHARE-001
 90 %  HEX-001
 80 %  TECH-001
 80 %  BUILD-001
 75 %  TERRAIN-002
```

Auki jääneet kohdat on merkitty tiketteihin `[ ]` tai `[~]` perusteluineen — ei
piilotettu prosenttilukuun.

---

## Yhteenveto

```
Yhteensä 58 tikettiä
  Valmiit:       32   (Vaiheet 0, 1, 2, 2.5 · + ECON-001 · + PERSIST-002)
  Kesken:         4   (REGRESSION-000 10/12 · SCALE-001 85 % · CASTLE-001 90 % · SHARE-001 80 %)
  Jäissä:         1   (SEC-000 → Vaihe 5, kun Supabase kytketään)
  Vaihe 2.6:      5   (L×2, M×3, joista SCALE-001 ja CASTLE-001 jo liikkeellä)
  Vaihe 3:       17   (ECON-001 ✅ · HEX-001 ✅ · TERRAIN-002 75 % · TECH-001 80 % · BUILD-001 80 % · loput 12)
  Läpileikkaava:  2   (REGRESSION-000 · PERSIST-002 done 2026-08-31)
Arvio Vaiheelle 3: ~15 viikkoa (Infiniten §7 sprintit, +1 sprintti perustalle)
```

**Kriittinen polku Vaiheessa 3** — mikään rakennus ei ole toteutettavissa ennen kuin
lompakossa on oikeat kentät ja maastossa oikeat tyypit:

```
MOBILE-001 ──(ulkoportti)──┐
                           ▼
        ECON-001 → TERRAIN-002 ──┬─→ BUILD-001 → BUILD-002
             │         │          │       └────→ BUILD-003
             │         │          └─→ REVEAL-001 → WONDER-001
             ├─→ TECH-001 ────────────→ BUILD-001         ↑
             └─→ MANA-001 → SPELL-001 ────────────────────┘
   HEX-001 ─────→ BUILD-003 · REVEAL-001 · EVENT-001 · STATS-001
```

`ART-001`, `WIKI-001`, `TUTOR-001`, `ACHIEVE-001`, `CITY-001` ja `QUEST-001` ovat polun
ulkopuolella. `SHARE-001` on täysin riippumaton 4X-sisällöstä ja voi edetä rinnalla.

**Kaksi tiedossa olevaa jakoa ennen ensimmäistä ominaisuutta:** `MockRepository.ts` on
395/400 riviä ja `MapView.tsx` 359/400. Sääntö on jakaa, ei nostaa rajaa — ja se tehdään
etukäteen, ei siinä vaiheessa kun portti kaatuu kesken tiketin.

**Effort:** S = tunteja · M = päivä · L = 2–3 päivää

---

## Suhde muihin dokumentteihin

| Tiedosto | Rooli |
|---|---|
| `claude.md` | Työskentelysäännöt, stack, vakiot, design-tokenit, UI/UX-standardi |
| `docs/tickets/` | **Toteutussuunnitelma** — tämä hakemisto |
| `files/MASTERPLAN.md` | Strategia ja lukitut päätökset |
| `files/EXTRACTION.md` | Mitä v2:sta poimitaan ja mitä ei |
| `ANALYSIS.md` | v2:n mitattu tila — lähdeviite, ei suunnitelma |

Uusia status- tai yhteenvetodokumentteja **ei luoda**. Edistyminen merkitään tikettien
`Status`- ja `Valmius`-kenttiin.
