# BRDC-KEEP-004 — Keep on ohjaamo: selkeät osiot, ei sekalainen lista

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M–L (1–2 päivää) |
| **Riippuvuudet** | BRDC-KEEP-002, BRDC-KEEP-003, BRDC-NATION-001, BRDC-ECON-004, BRDC-WIKI-002 |
| **Status** | `done` — 2026-09-02 (v0.5.16), kenttätodennus [~] |
| **Valmius** | 75 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"haluan eri osiot siihen"* · *"omat osat rakennuksille, manan käytölle ja
tutkimukselle.. täältä hallitaan kaikki"* · *"Wikipedia linkit rakennuksille"*.

`HearthPanel` on kasvanut kymmeneksi peräkkäiseksi `hearth-panel__line`-riviksi:
Anchor Stone, neljä statia, tuotantorivi, ennuste, varastovaroitus, dark time -varoitus,
pouch-rivi (**joka näyttää vain 3/9 lajia**), sitten neljä välilehteä, quest-rivi,
"muut näkevät Keepin", rappiovaroitus, kaksi nappia. Se ei ole ohjaamo, se on kuitti.
Pelaaja etsii tutkimusta ja mana­kanavointia rivien seasta.

## 🟢 GREEN

- [ ] **Nimetyt osiot, ei pelkkiä rivejä.** Järjestys:
  1. **Identity** — valtion nimi, lippu, lääni + asukasmäärä (`BRDC-NATION-001`)
  2. **Resources** — jokainen laji: määrä + tuntimuutos, aika viime keräyksestä, Collect
     -nappi (`BRDC-ECON-004`). Korvaa nykyisen 3-lajin pouch-rivin.
  3. **Buildings** — mitä on rakennettu ja missä, ei vain katalogi. Jokainen rakennus­rivi
     linkkaa Guide-sivulleen (`BRDC-WIKI-002`).
  4. **Mana** — Altar, kanavointi (nykyinen `ManaPanel`)
  5. **Research** — Riitit (nykyinen `ResearchPanel`)
  6. **Realm** — rappiovaroitus, dark time, "muut näkevät Keepin", Wager-ovi
- [ ] Osiot ovat **taitettavia** tai välilehtiä — koko ei saa kasvaa yhdellä ruudulla
      luettavaksi 360 px:llä. Yksi peukalo avaa ja sulkee (`claude.md` §14).
- [ ] **`HearthPanel.tsx` pysyy alle 400 rivin.** Se on jo ~260 ja tämä kasvattaa sitä —
      jokainen osio on oma komponenttinsa `features/keep/`ssä, `HearthPanel` on runko.
- [ ] Otsikkohierarkia h2→h3, ESC sulkee, fokus palaa avaajaan (§14).
- [ ] **Todennus on kysymys:** anna peli jollekulle, pyydä (a) tutkimaan Riitti, (b)
      kanavoimaan manaa, (c) lukemaan mitä saha tekee. Jos hän ei löydä perille ilman
      apua, ei valmis.

## Ei tässä

- Manan, tutkimuksen tai rakennusten **sisältö** — ne ovat omissa tiketeissään. Tämä on
  esitystapa: löydettävä, jäsennelty, linkitetty.
- Footerin reitti Keepiin — `BRDC-KEEP-003`.
- Keräysmekaniikka — `BRDC-ECON-004`.

## Tehty v0.5.16

`HearthPanel` (248 → 190 r) = runko: head → `<NationIdentity>` → `<KeepResources>` →
tab-strip (Mana · Rites · Buildings) → `<KeepRealm>`. `features/keep/`: `KeepResources.tsx`
(BRDC-ECON-004), `KeepRealm.tsx`, `keep.css`. `Train`-välilehti poistettu.

- [x] Nimetyt osiot h3-otsikoin, ei irrallisia rivejä
- [x] Resources-osio: per-laji + `/h` + Collect + "Last collected" (ECON-004)
- [x] Realm-osio: rappio, dark time, "muut näkevät Keepin", Wager
- [~] Rakennus→Guide-linkit — `BRDC-WIKI-002`
- [~] Taitettavat osiot — nyt aina näkyvissä (lyhyitä); tabit hoitavat pitkät
- [x] **Temppelilista Keepiin (v0.5.18):** *"pistä keep sivuille lista
      temppeleistä ja nappi millä saa temppelivalikon auki"* — pelaaja ei pääse
      laajentamaan temppeliä kun se on kaukana kartalla. Mana-välilehdelle lista
      omista temppeleistä + per-temppeli "avaa" joka näyttää `expandTemple`-toiminnon
      ilman kartalle kävelyä. Tarvitsee `MapView`iltä `places` + expand-handlerin
      `HearthPanel`iin.
