# BRDC-CARD-002 — KEEP mallin mukaan

| | |
|---|---|
| **Alue** | `features/keep/` (`KeepRealm`, `KeepResources`, `KeepTemples`), `features/territory/HearthPanel.tsx`, `dominion.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — aarrelista täydellinen, rappiolista lisätty; välilehtien uudelleenjärjestely auki |
| **Riippuvuudet** | — |
| **Lähde** | `Eldritch-Sigil.html` §06 — 04 · KEEP · Infinite 2026-09-16 (ks. `BRDC-CARD-001`) |

## 🔴 RED

`BRDC-KEEP-008` (v0.5.89) korjasi kaksi virhettä ja pinta-alan yksikön, **mallia ei rakennettu**.
Mallin oma selitys:

> *"The nation gets a header and four headline numbers. The resource list becomes a per-hour treasury
> strip in resource hues. Provinces, Works and Temples are three tabs over one scrollable list — each
> row carries its own iso art, so the Keep reads as a place, not a table."*

## Auditoi nykyinen Keep mallia vasten — tehty 2026-09-16

Mallin oma HTML (`Eldritch-Sigil.html`, "04 · KEEP") luettu suoraan lähteestä, sen omat
näytedatataulut (`keepStats`, `ledger`, `decay`, `provinces`) mukaan lukien, ja verrattu
`HearthPanel`in nykyiseen tuotokseen:

| Mallin osa | Peli tänään | Ero |
|---|---|---|
| NATION-otsake, lippu, nimi, "1 province · 280 souls" | `NationIdentity.tsx`: lippu, muokattava nimi, `provinceCount`/`population` | ✅ **jo tehty** — RED:n oma oletus ("mallia ei rakennettu") ei pitänyt paikkaansa tälle osalle |
| 4 päälukua: WARDED / LAND / STRONGEST / TEMPLES | `hearth-panel__stats`: sanasta sanaan samat neljä | ✅ **jo tehty**, täsmälleen |
| TREASURY-nauha: `{{v}} · {{rate}}` jokaiselle 9 resurssille, myös nollakasvuiselle | `KeepResources`: näytti vain kasvavat, ei koskaan pidettyä-mutta-paikallaan-olevaa määrää | 🔶 **korjattu tässä kierroksessa** |
| COLLECT | `keep-collect`-nappi | ✅ jo tehty (ja tietoisesti kosmeettinen, oma kommenttinsa) |
| NEXT 72 HOURS: nimetyt kohteet, palkki, jäljellä oleva aika, "2 FADING" | Yksi koontilause ("N cells fade within the day") + "Show the first to fade" | 🔶 **korjattu tässä kierroksessa** — ks. alla |
| Linnoituksen suojaama maa ei näy rappiolistalla | `dominionOf` jätti sen jo pois (`fortified`-tarkistus, `BRDC-BUILD-012`) | ✅ **oli jo oikein** — RED:n oma epäilys ei pitänyt paikkaansa, data oli jo turvassa; puuttui vain se että mitään listaa ei näytetty ollenkaan |
| PROVINCES / WORKS / TEMPLES -välilehdet, iso-kuva joka rivillä | Mana / Buildings -välilehdet | ❌ **ei tehdä** — ks. alla |
| LIGHT THE ALTAR · 6 MANA/H | `ManaPanel.tsx`: "Light the Altar" / "Raise the Altar", sama mekaniikka | ✅ **jo tehty**, sanasta sanaan — RED:n oma oletus ei pitänyt paikkaansa |

## 🟢 GREEN

- [x] **Auditoi nykyinen Keep mallia vasten** — taulukko yllä
- [x] **Aarreaitta näyttää nyt jokaisen pidetyn resurssin, ei vain kasvavia**
      (`KeepResources.tsx`): `shownResources`in oma, jo oikea suodatus ("mitä pidät TAI mitä
      tulee") oli jo testattu ja oikein — bugia komponentin omassa `.filter(perHour>0)`issa,
      joka heitti pois juuri sen rivin ("100 · +0") jonka malli näyttää. Poistettu; rivi
      näyttää nyt sekä määrän että tahdin, `keep-res-row`in oma neljäs sarake oli jo
      olemassa CSS:ssä käyttämättömänä
- [x] **Next 72 hours -lista, oikeasti nimetty ja napautettava** (`dominion.ts`in uusi
      `fading: readonly {cell, hoursLeft}[]`, `KeepRealm.tsx`in uusi rivilista):
      `AT_RISK_HOURS`ista (24 h, koontilukua varten) erillinen `FADING_WINDOW_HOURS` (72 h,
      mallin oma otsikko), enintään 5 riviä lähimmästä alkaen. Nimi on maamerkin oma nimi
      jos sellainen on (`landmarkOn`, sama järjestys kuin `CellOn`), muuten maaston nimi
      (`GROUND_NAME`) — ei keksittyjä paikannimiä joita suurimmalla osalla heksoista ei ole.
      Napautus kutsuu samaa `onWeakest`-takaisinkutsua joka jo oli olemassa (`inspect.onCellTap`,
      ei uutta reittiä `MapView.tsx`hen). Linnoituksen suojaama maa pysyy poissa, koska
      `dominionOf` jätti sen jo pois
- [x] Testit: `dominion.test.ts` (3 uutta — järjestys, Linnoitus-poikkeus, katto). Portti:
      1563 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät
- [ ] Aarrelistan 3-sarakkeinen ruudukko pystylistan sijaan (visuaalinen, ei toiminnallinen)
- [ ] 360 px -kuvakaappaus mallin rinnalla — ei kuvakaappaustyökalua tässä istunnossa

## Ei tehdä — kolme välilehteä

**PROVINCES / WORKS / TEMPLES ei korvaa nykyistä Mana / Buildings -jakoa.** Kolme syytä,
ei yksi:

1. `BRDC-KEEP-007`in oma kenttäraportti: kolmas välilehti (Research) kokeiltiin ja
   poistettiin, koska sitä ei löydetty — täsmälleen sama riski koskisi kolmatta uutta
   välilehteä tässä
2. "Provinces" edellyttäisi maakuntakohtaista tuoton laskentaa (`regionOf`-ryhmittely,
   jonka `BRDC-TAVERN-001` jo otti käyttöön yhteen tarkoitukseen) — uusi näkymä, ei
   siirto olemassa olevasta
3. "Works" olisi jo olemassa olevan `KeepBuildingsPanel`in uudelleennimeäminen ja
   -kuvitus rivi-isoina kuvina — mahdollista, mutta oma, erillinen työnsä eikä tämän
   tiketin ydin (aarre + rappio)

Malli olettaa rikkaamman välilehtirakenteen kuin mikä on kenttätestattu toimivaksi. Tämä on
sama päätös kuin `BRDC-CARD-001`in riittilistan tiivistys: mallia ei seurata 100 %:sti kun
se olisi askel taaksepäin todetusta.

## Ei tässä

- Rakennusten iso-kuvat rivillä — oma tikettinsä jos `KeepBuildingsPanel` uudistetaan
