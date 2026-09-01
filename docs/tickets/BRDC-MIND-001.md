# BRDC-MIND-001 — Yksi tuntuva perkki per Consciousness-virstanpylväs

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S (viisi pientä kytkentää olemassa oleviin systeemeihin) |
| **Riippuvuudet** | BRDC-CHAR-001 (`consciousness.ts` lore), BRDC-LOG-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Aavistuksen ehdotus 2026-09-02: *"Consciousness-tasot eivät tee juuri mitään"* |

## 🔴 RED

Taso antaa nyt isomman lenkkialueen (`MAX_LOOP_AREA_M2 × (1 + level/10)`) ja +5 attack/taso.
Molemmat näkymättömiä. Character-näkymä selittää mitä taso *tarkoittaa* lorena, mutta
levelöinnillä ei ole *tuntuvaa* palkintoa. Viisi virstanpylvästä, viisi pientä perkkiä.

## 🟢 GREEN

- [ ] **Dormant (1)** — ei perkkiä, lähtötila.
- [ ] **Awakening (5)** — näet anomalian **tyypin** (`reward` / `chain`) ennen tutkimista.
      `AnomalyPanel` / kartta­glyfi paljastaa sen kun `level >= 5`.
- [ ] **Aware (10)** — rivaalin suuntaosoitin (`rivalBearing`) näyttää myös **etäisyyden**.
      `FirstLook` / HUD saa `rivalDistanceM`:n kun `level >= 10`.
- [ ] **Enlightened (15)** — **yksi ilmainen ward per vuorokausi** (ohittaa `WARD_COST`in
      ensimmäisellä käytöllä per UTC-päivä). `wardStore` tarkistaa.
- [ ] **Transcendent (20)** — fog-of-war paljastaa **kaksi rengasta** yhden sijaan.
      `withFogOfWar` saa säteen levelistä.
- [ ] Jokainen perkki puhdas ehto (`rules/perks.ts`: `perksAt(level): Perk[]`), testattu.
- [ ] Character-näkymän virstanpylväsluettelo näyttää perkin rivin ("· ilmainen ward/pv")
      lukon vieressä.
- [ ] Level-up-hetki (BRDC-CLAIM jälkeinen `lastEra`-tyylinen) mainitsee uuden perkin.

## Ei tässä

- Valittavat perkit / skillipuu — kiinteä yksi per virstanpylväs.
- Perkkien tasapainotus loppuun — luvut ovat `constants.ts`:ssä ja viritettävissä.
- Tasojen määrän kasvatus yli 20 — katto on v2:n level-118-mokan korjaus, ei kosketa (§10).
