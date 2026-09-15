# BRDC-BUILD-012 — Fortifikaatio suojaa sen mitä se vartioi

| | |
|---|---|
| **Alue** | `rules/capture.ts`, `rules/build.ts`, `rules/aura.ts` |
| **Effort** | M |
| **Status** | `in progress` — Infiniten päätökset 2026-09-15 kirjattu alle |
| **Lähde** | Infinite 2026-09-15: *"jos rakennat fortifiikaation niin sen haluan, että sitä resurssia ei voi toinen vallata."* |

## 🔴 RED

Tällä hetkellä mikään ei ole vallattavissa olevan ulkopuolella. Fortress antaa
puolustusauran (`BRDC-BUILD-004`: `defenceAura` vähentää saapuvaa vahinkoa), mutta se on
määrän säätöä — riittävän monta kävelyä ja solu vaihtaa omistajaa silti.

Infinite haluaa kovemman lupauksen: **se resurssi ei ole otettavissa**.

## ✅ Infiniten päätökset (2026-09-15)

| Kysymys | Valinta | Sääntönä |
|---|---|---|
| Mikä on suojattu | **Heksa ei vaihda omistajaa** | Hearthin lattia: piiritys vie vahvuuteen 1, omistaja pysyy |
| Rapistuuko | **Ei koskaan** | Linnoitettu heksa ei rapistu eikä vapaudu |
| Voiko tuhota | **Kyllä, piirityksellä** | Hyökkääjä kaataa linnoituksen, sen jälkeen maa on normaalisti otettavissa |
| Ulottuvuus | **Myös naapuriheksat** | Linnoituksen heksa + omistajan viereiset heksat (7) |

**Seuraus joka on sanottava ääneen:** koska suoja ei rapistu, **piiritys on ainoa tapa jolla
linnoitus koskaan kaatuu**. Jos se ei toimi, kartta täyttyy lopettaneiden pelaajien
ikuisista saarekkeista — juuri se mitä kysymys 3 pelkäsi.

## Kysymykset, joihin vastaus ratkaisee mekaniikan (alkuperäiset)

1. **Mikä on suojattu — solu vai resurssi?** Onko fortifikaation solu kokonaan ottamaton,
   vai menettääkö valloittaja vain sen **tuoton**? Jälkimmäinen on kiinnostavampi: maa
   vaihtaa omistajaa, mutta palkinto ei tule mukana.
2. **Voiko fortifikaation tuhota?** Jos ei, kartalle syntyy ikuisia saarekkeita. Jos voi,
   millä — piirityksellä, riitillä, ajalla?
3. **Rapistuuko se?** Ottamaton solu jonka omistaja ei koskaan kävele siellä on suoraan
   ristiriidassa sen kanssa mikä pitää kartan elävänä kahdella pelaajalla (§11).

## Miksi tämä on iso päätös eikä säätö

`claude.md` §11 sanoo piirityksestä: *"Do not simplify this back to a single comparison."*
Ottamattomuus ei ole yksinkertaistus vaan **poikkeus** — ja poikkeus juuri siihen
sääntöön joka pitää kartan liikkeessä. Se voi olla oikea; se pitää tehdä silmät auki.

Kytkeytyy `BRDC-CLAIM-016`:een ja `BRDC-WORLD-001`:een.

## 🟢 GREEN — toteutussuunnitelma (2026-09-15)

Kolme committia, tässä järjestyksessä: suojan on pidettävä **kaikkialla** ennen kuin
käyttöliittymä lupaa sen.

### A — säännöt (`packages/core`, puhtaat funktiot + testit)

- [x] `fortified(known, h3)`: heksa on Linnoituksen oma heksa tai **saman omistajan**
      naapuri (säde = `BUILDINGS.fortress.aura.radius`, nyt 1)
- [x] `resolveCapture`: linnoitettu heksa pysyy lattialla 1 eikä vaihda omistajaa — sama
      sääntö kuin Hearthilla
- [x] **Murtuminen:** Linnoituksen heksa lattialla on *murrettu* (`breachedOn`, UTC-päivä).
      **Myöhemmän päivän** isku, joka menisi lattian läpi, kaataa Linnoituksen: se lähtee
      `buildings`ista, tulos `'razed'`, ja maa on sen jälkeen normaalisti otettavissa.
      Yksi kävely ei riitä, eikä yön yli paikkaaminen pelasta
- [x] `projectCell` / `sweepDecay` / `blightLevel`: linnoitettu heksa ei rapistu, ei vapaudu
      eikä blightaa
- [x] `holdings`: linnoitettu heksa on "ei voi menettää" (`hoursLeft: null`)
- [x] `sim/siege.ts`: montako kävelypäivää vakiintuneen Linnoituksen kaataminen vie —
      **mitattu**, koska piiritys on ainoa tapa jolla se koskaan kaatuu

**Mitattu** (`sim/siege.ts`; hyökkääjä taso 5, 6 naapuria, puolustus 500):

| Tilanne | Linnoitus kaatuu | Maa otetaan |
|---|---|---|
| Ei linnoitusta, omistaja kävelee päivittäin | — | kävely 3 |
| Linnoitus, omistaja kävelee päivittäin | kävely 5 | kävely 6 |
| Linnoitus, hylätty | kävely 4 | kävely 5 |
| Linnoitus vs. taso 1 ilman naapureita, puolustettu | kävely 19 | kävely 20 |

Aina äärellinen, ei koskaan yhdellä kävelyllä, puolustettuna noin kaksinkertainen piiritys.
**Murtuman paraneminen:** kun omistaja kävelee heksan takaisin perusvahvuuteen (100). Päivän
paikkaus (+25/+50) ei paranna — muuten päivittäin kävelevä omistaja olisi voittamaton.

### B — datakerros

- [x] Silmukka (`planClaim`) ja kasvu (`growInto`) — naapurit ovat jo muistissa
- [x] **Hearthin perustaminen** (`claimHearth`) piiritti ilman puolustusta ja ilman lattiaa —
      olisi ohittanut suojan kokonaan
- [x] **Näkymän haku** (`getCells`) vapauttaa rapistuneet. Linnoitus näkymän reunan takana
      ei saa jättää suojattua naapuria vapautettavaksi → reunan naapurit ladataan (`getMany`)
- [x] `closeWalk`in ikääntäminen ennen piiritystä; `buildStore` / `wardStore` elävyystarkistus

**Todennettu:** jokaiselle polulle kontrolli, jossa sama heksa *ilman* Linnoitusta kaatuu
(`fortifyStore.test.ts`, `fortifyGrowth.test.ts`). Kävely: `walkNeighbourhood` lataa jokaisen
heksan ja sen kuusi naapuria, joten `growInto`n tarkistus näkee koko ulottuvuuden. Ainoat kaksi
solun poistoa datakerroksessa (`sweepAndPersist`, `closeWalk`) ovat molemmat suojattuja.
Infiniten dev-serveri: jokainen muuttunut moduuli tarjoiltu, lataus + kävely 0 virhettä.

### C — käyttöliittymä ei saa valehdella

- [ ] *"The Void takes it in N days"* (`CellWorth`), punainen kaari (`arcInk`), blight,
      Your lands -jäljellä olevat tunnit (`dominion`, `useTerritory`) → ei rappiota linnoitetulle
- [ ] `'razed'` näkyy pelaajalle — Linnoituksen kaataminen on tapahtuma, ei hiljainen luku

### Ei muutu

- Askel (`claimStepAt`) ja riitit (`spellStore`) eivät koskaan hyökkää omistettuun maahan
