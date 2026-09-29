# BRDC-S2-000 — Ennen Season 2:ta: seitsemän korjausta

| | |
|---|---|
| **Alue** | trade routes (pois), anomaliat, kartan merkit, Watchtower, Keep-näkymä, Hearthin kasvatus |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `done` — ajettu ja todennettu 2026-09-29 (v0.6.66) |
| **Lähde** | Infinite 2026-09-29: *"poista trade routet, … anomalioiden tutkimisessa useampia erilaisia ja niistä saa palkinnon, … vierekkäisten solujen lukumäärä on tarpeeton ja watch tower puuttuu, … anchor stone ruutu on sekava, … hearth ruudut kultaisella reunuksella, … hearthin laajentamisesta 20x kalliimpaa"* |

## 🟢 GREEN

- [x] **Trade routet pois** kokonaan: kortin toiminto, kartan viiva, tunnin kultatuotto,
      repositorion metodit, sääntö ja store (`trade.ts`, `tradeStore.ts`, testit). Vanhan
      tallennuksen `trade-routes`-avain jää lukematta. Lokin "Laid a Trade Route" -kuvaus jää
      vanhoja rivejä varten. Kaupunkivaltioiden *Trade post* on eri asia ja pysyy
- [x] **Anomaliat:** kahdeksan eri merkkiä (`ANOMALY_SIGNS`: The Hum, The Standing Door,
      The Weeping Stone, The Wrong Shadow, The Drowned Bell, The Ring of Ash, The Still
      Birds, The Dry Well), joista jokainen painottaa omaa resurssiaan (30–60, joka viides
      myös tokenin). Tarinaketjuja 2 → 6 (orchard, surveyor, choir, forge-glow). Löytö
      näytetään kortissa ("+45 stone · +20 XP"), sekä palkinnosta että ketjun valinnasta
- [x] **Naapurilukujen kiekot pois** kartalta (kaksi tasoa ja `neighbours`-ominaisuus).
      Nimilappujen järjestys ankkuroituu nyt vahvuuslukuun
- [x] **Watchtower** rakennettavissa: mäki tai tasanko, 40 timber + 30 stone, +1 wisdom/h,
      Works Codexin mukainen sprite. Sen tutkimuspuu herää, kun näköala- ja
      piiritysmekaniikat tehdään (BUILD-013:n Fortress-kysymys yhä auki)
- [x] **Keep-näkymä selkeämmäksi:** otsikko "The Keep", neljä otsikoitua osaa (Your realm ·
      The pouch · The Hearth · Mana and temples · What is at risk). Mana/Buildings-välilehdet
      ja rakennusluettelo poistuivat (Guide ja rakennussivut kertovat saman)
- [x] **Hearthin heksat kultaisella reunuksella** (`cells-hearth`): oma solu, joka on
      enintään Hearthin renkaan etäisyydellä kodista
- [x] **Hearthin kasvatus 20× kalliimmaksi:** 5 → 100 ruokaa heksalta. Koko rengas kerralla
      maksaisi enemmän kuin pussi vetää (katto 500), joten kasvatus ostaa nyt niin monta
      seuraavan renkaan heksaa kuin ruoka riittää, ja rengas täyttyy viimeisellä
- [x] `pnpm test` · `typecheck` · `lint:lines`; e2e hearth-growth, opening, cell-actions,
      works, place-tap, share, claim-layers vihreät

**Sivulöydös:** `opening.spec`in "greyed action" -testi nojasi Consecrate-nappiin
Hearth-solussa. Nappi näkyi siellä vain siksi, että Anchor puuttui (korjattu MAP-007:n
yhteydessä). Testi tarkistaa nyt harmaan Ward-napin.
