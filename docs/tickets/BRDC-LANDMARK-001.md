# BRDC-LANDMARK-001 — Maamerkki: kartta kertoo mitä tässä oikeasti on

| | |
|---|---|
| **Alue** | `rules/landmark.ts`, `data/pouch.ts`, `features/territory/income.ts`, `CellOn.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — talous ja kortti tehty; kartan oma merkki auki |
| **Riippuvuudet** | `BRDC-SEED-002` (POI:t), `BRDC-SEED-001` (kohdistus) |
| **Lähde** | `worldseed.ts` (`STRUCTURES.landmark`), `seed.harmala.json` (`landmarks`), Worldseed §05 *Two new structures* |

## 🔴 RED

*"Statue of the Boy"* oli pelissä vain seikkailun paikan nimi — maamerkkijärjestelmää ei
ollut. `HexSeed.landmark` on jo olemassa datana (`BRDC-SEED-002`/`-004`, 14 heksaa
Härmälänrannassa), mutta mikään ei lukenut sitä: ei taloutta, ei korttia, ei karttaa.

## 🟢 GREEN

- [x] `landmarkOn(h3)` / `landmarkBonus(cells, now)` (`rules/landmark.ts`) — uusi, pieni
      sääntö `bounty.ts`in muotoa mukaillen. **Ei paljastusporttia**: patsas ei ole
      löydettävä salaisuus, se yksinkertaisesti on siellä heti kun heksa on hallussa
- [x] +2 culture/h hallitulla maamerkkiheksalla (`LANDMARK_CULTURE_PER_HOUR`), kytketty
      `pouch.ts`in `perHourBonus`iin muiden bonusten joukkoon
- [x] `income.ts`in `cellIncome` näyttää sen omana rivinään ("The landmark here"),
      samalla polulla kuin löytö ja rakennus — `CellIncome.tsx` ei tarvinnut koskea,
      koska se lukee `total`in yleisesti
- [x] HERE-kortti (`CellOn.tsx`): maamerkki on **listan ensimmäinen rivi**, nimellä,
      tarinalla ja tuotolla, kulttuurin värissä. Ei odottanut `BRDC-CARD-001`:tä — tämä on
      rehellinen versio "ensimmäisenä" josta nykyinen kortti pystyy, täysi Sigil-järjestys
      on silti CARD-001:n oma työ
- [x] Rakennuksen ja maamerkin yhteiselo: `CellOn`in rivit ovat riippumattomia — maamerkki,
      paikka, löytö ja jokainen rakennus saavat oman rivinsä, mikään ei syrjäytä toista.
      Ei riko mitään olemassa olevaa slottia, koska tämä ei koske karttaa (ks. alla)
- [x] Testit: 9 uutta `landmark.test.ts`issa + 5 päivitettyä `hexSeedStore.test.ts`issa.
      **Löydetty ja korjattu heikko testi ennen julkaisua:** SEED-004:n oma testi vertasi
      `seed.landmark?.name`a `built.landmark?.name`ään täsmälleen samalla heksalla jolla
      molemmat sattuivat olemaan `undefined` — läpäisi tyhjästi. Syy: `HARMALA_STATUE` ja
      OSM-patsas ovat ~4,5 m päässä toisistaan, riittävän lähellä ollakseen sama patsas
      mutta **eri** H3-solulla (res-11 ~25 m). Ei virhe — kaksi riippumatonta mittausta
      samasta esineestä eroavat muutaman metrin, eikä se ole korjattava — mutta testin piti
      hakea oikea heksa, ei olettaa
- [x] Portti: 1528 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Auki — kartan oma merkki

**"Kartalla oma merkki kulttuurin värissä; halo kun ihme on samalla heksalla" ei tehty.**
Mitattu syy: `SLOT`-taulussa (`cellMarks.ts`) on seitsemän paikkaa — kuusi heksan kärkeä
plus keskusta — ja **kaikki seitsemän ovat jo varattuja**: keskusta (rakennus tai
kaupunkivaltion maamerkki), pohjoinen (linna/paikka/questi-teksti), koillinen+lounas
(löydön kylttilaatikko matalalla/korkealla zoomilla), luode (naapurilaskuri), etelä
(vahvuusluku). Uudelle merkille ei ole omaa paikkaa ilman että se jakaa jonkin olemassa
olevan slotin toisen merkin kanssa — se on Sigil-mallin oma laajennuspäätös, ei tämän
tiketin arvattavissa ilman kuvakaappausta jota ei voitu tuottaa tässä istunnossa.

## Päätös Infiniteltä

Kartan maamerkki tarvitsee jommankumman:
- **Kahdeksas slotti** — uusi sisempi rengas tai puoliväli kärkien välissä, SLOT-taulun
  laajennus (Sigil-mallin oma päätös, todennäköisesti `BRDC-CARD-001`in tai kartan oman
  layout-tiketin yhteydessä)
- **Jaettu slotti** — maamerkki käyttää esim. pohjoista tekstipaikkaa ja väistää kun
  linna/paikka/questi jo käyttää sitä samalla heksalla (harvinainen, patsaan heksalla
  todennäköinen questin kanssa)

## Ei tässä

- *The Boy Who Waits* -ihme — `BRDC-WONDER-002`
- HERE-kortin täysi Sigil-järjestys — `BRDC-CARD-001`
