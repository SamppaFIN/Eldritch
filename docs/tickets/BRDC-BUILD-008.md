# BRDC-BUILD-008 — Rakentamisen seinä on luettavissa

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 0.2 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-BUILD-005, BRDC-TECH-001 |
| **Status** | `done` — 2026-09-09 (v0.5.49) |
| **Valmius** | 100 % viestien osalta; **kattoluku itsessään on avoin päätös, ks. alla** |
| **Lähde** | Infinite 2026-09-09: *"Ostaminen jumissa / limiitti. Jokin (validointi, puuttuva backend-kutsu tai kovakoodattu raja) estää ostamisen kokonaan nykyversiossa."* |

## 🔴 RED

Infinite raportoi ettei rakentaminen onnistu, eikä osannut sanoa miksi. **Ei osannut,
koska peli ei kerro.**

`canBuild` (`build.ts:295-319`) hylkää **kahdeksasta** eri syystä: `not-yours`,
`occupied`, `locked`, `wrong-terrain`, `needs-a-temple`, `cell-full`, `at-capacity`,
`cannot-afford`. `BuildPanel.tsx:73-79` litisti ne kaikki yhdeksi lauseeksi joka tulostaa
hylkäyksen oman slugin:

> *"That did not go through — at capacity."*

Se ei kerro mitä tehdä, eikä se kerro edes mistä on kyse — ja tiedostossa on jo `reason()`,
joka osaa sanoa *"No room — build a Granary"*. Sitä käytettiin vain lukittujen rivien
selitteissä, ei siihen viestiin jonka pelaaja saa painettuaan nappia.

**Ja kyse on melkein varmasti juuri `at-capacity`sta.** `BASE_BUILDING_CAP = 6`
(`constants.ts:250`) on **pelaajakohtainen** katto — kuusi Workia koko pelissä, ei per
ruutu. Granary nostaa sitä `GRANARY_CAPACITY = 3`:lla. Infinitellä on 340 solua. Kuuden
rakennuksen jälkeen jokainen rakennus torjutaan, eikä mikään ruudulla kerro että katto on
olemassa, saati että Granary on ainoa tie ohi.

**Sivuhavainto joka tekee siitä pahemman:** Granary vaatii `early-farming`-teknologian.
Se on juuriteknologia (`requires: []`, hinta 20 wisdom), joten umpikujaa ei synny — mutta
pelaaja ei voi tietää sitä. Hän näkee vain että rakentaminen lakkasi toimimasta.

## 🟢 GREEN

- [x] **Hylkäysviesti kertoo mitä tehdä**, ei mikä epäonnistui (§14: *"errors say what to
      do, not what failed"*). Kaikki kahdeksan syytä saivat oman lauseensa:
      - `at-capacity` → *"You are holding all the Works you can. A Granary lets you hold 3 more."*
      - `cell-full` → *"This hex already holds 3 Works. Demolish one, or build on another hex."*
      - `cannot-afford` → nimeää Workin ja sen hinnan
      - `locked` → nimeää teknologian jota se odottaa
- [x] Viesti **nimeää Workin**: hylkäys kantaa nyt rakennuksen id:n (`useSelection`in
      `BuildFail` on `{ why, id }`), joten hinta ja teknologia voidaan sanoa oikein.
- [x] **Katto näkyy ennen kuin siihen törmätään.** Build-otsikko sanoo `3/6 Works held`, ja
      katossa lisää *"— a Granary holds three more"*. "Standing here" on eri luku (tämä
      heksa); nämä kaksi seinää eivät ole sama asia eivätkä enää näytä siltä.
- [x] `buildRefusal.test.ts` lukitsee laskennan jota teksti siteeraa, ettei kopio ja sääntö
      eriydy: base cap, Granaryn nosto, ja se että **Granary vie itse yhden paikan** —
      nettona `GRANARY_CAPACITY - 1` muuta Workia, ei kolmea.

## ⚠️ Avoin päätös Infiniteltä — kattoluku

Viestit on korjattu; **lukua ei ole muutettu**, koska se on suunnittelupäätös.

`BASE_BUILDING_CAP = 6`, Granary +3, ja Granary vie itse paikan → **+2 nettoa per
Granary**. Kahdenkymmenen muun Workin pitämiseen tarvitaan seitsemän Granarya (27 yhteensä).

PIVOT kohta 6 sanoo *"yhdessä ruudussa korkeintaan yksi rakennus"* (`CELL_BUILDING_CAP`
3 → 1). Se tekee globaalista katosta **sitovamman**, ei löysemmän: 340 solua ja kuusi
Workia. Kysymys on siis:

1. **Onko 6 oikea luku** pelille jossa kävellään satoja soluja? Vai onko katto väärä
   mekaniikka kokonaan, ja rajoitteen pitäisi olla resurssit + yksi rakennus per ruutu?
2. Jos katto jää: **pitäisikö Granaryn olla halvempi tai kattaa enemmän**, kun sen oma
   paikka syö kolmasosan sen hyödystä?

Suositus: **poista globaali katto** kun kohta 6 tuo yhden rakennuksen per ruutu. Silloin
rajoite on maa ja resurssit — se on sama asia, mutta se on *pelaajan ansaitsema* raja eikä
näkymätön luku. Granary voi jäädä ruokabonukseksi.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (1026) + `pnpm build` vihreä.
- [x] `buildRefusal.test.ts` — 4 testiä kapasiteettilaskennasta.
- [ ] Kenttä: rakenna kunnes katto tulee vastaan → viesti kertoo Granarysta, ja luku
      `6/6` näkyi jo ennen sitä. *(Infinite ajaa — ja kertoo samalla oliko `at-capacity`
      se mihin hän törmäsi.)*

## Ei tässä

- **Kattoluvun muuttaminen** — avoin päätös yllä.
- `CELL_BUILDING_CAP` 3 → 1 — PIVOT kohta 6, oma tikettinsä (päätös P5: pidä vahvin).
- `costLine`in neljä kopiota ja raa'at resurssiavaimet ("40 wood" vs "10 timber") —
  `BRDC-DETAIL-001`.
