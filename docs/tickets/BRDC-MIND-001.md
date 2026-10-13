# BRDC-MIND-001 — Yksi tuntuva perkki per Consciousness-virstanpylväs

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S (viisi pientä kytkentää olemassa oleviin systeemeihin) |
| **Riippuvuudet** | BRDC-CHAR-001 (`consciousness.ts` lore), BRDC-LOG-001 |
| **Status** | `done` — 2026-10-13 |
| **Valmius** | 0 % |
| **Lähde** | Aavistuksen ehdotus 2026-09-02: *"Consciousness-tasot eivät tee juuri mitään"* |

## 🔴 RED

Taso antaa nyt isomman lenkkialueen (`MAX_LOOP_AREA_M2 × (1 + level/10)`) ja +5 attack/taso.
Molemmat näkymättömiä. Character-näkymä selittää mitä taso *tarkoittaa* lorena, mutta
levelöinnillä ei ole *tuntuvaa* palkintoa. Viisi virstanpylvästä, viisi pientä perkkiä.

## 🟢 GREEN

- [x] **Dormant (1)** — ei perkkiä, lähtötila.
- [x] **Awakening (5)** — näet anomalian **tyypin** (`reward` / `chain`) ennen tutkimista.
      `AnomalyPanel` / kartta­glyfi paljastaa sen kun `level >= 5`.
- [~] **Aware (10)** — ~~rivaalin suuntaosoitin (`rivalBearing`) näyttää myös **etäisyyden**.
      `FirstLook` / HUD saa `rivalDistanceM`:n kun `level >= 10`.~~ **Vaihdettu 2026-10-13:** suuntaosoitin näkyy vain ensimmäisen kävelyn vihjeessä, joka on poissa kauan ennen tasoa 10 — etäisyys ei olisi näkynyt koskaan. Tilalle: *näet anomaliat rajasi takaa, kuten Medium* (sama polku, `getAnomaliesFor`)
- [x] **Enlightened (15)** — **yksi ilmainen ward per vuorokausi** (ohittaa `WARD_COST`in
      ensimmäisellä käytöllä per UTC-päivä). `wardStore` tarkistaa.
- [x] **Transcendent (20)** — fog-of-war paljastaa **kaksi rengasta** yhden sijaan.
      `withFogOfWar` saa säteen levelistä.
- [x] Jokainen perkki puhdas ehto (`rules/perks.ts`: `perksAt(level): Perk[]`), testattu.
- [x] Character-näkymän virstanpylväsluettelo näyttää perkin rivin ("· ilmainen ward/pv")
      lukon vieressä.
- [x] Level-up-hetki (BRDC-CLAIM jälkeinen `lastEra`-tyylinen) mainitsee uuden perkin.

## Ei tässä

- Valittavat perkit / skillipuu — kiinteä yksi per virstanpylväs.
- Perkkien tasapainotus loppuun — luvut ovat `constants.ts`:ssä ja viritettävissä.
- Tasojen määrän kasvatus yli 20 — katto on v2:n level-118-mokan korjaus, ei kosketa (§10).

## Toteutus (2026-10-13)

- `rules/perks.ts`: `PERKS`, `hasPerk`, `perksAt`, `perkAt` — testattu (`perks.test.ts`)
- 5 *foresight*: `getAnomaliesFor` merkitsee lepäävät ja tutkittavat `foretold`; kortti sanoo *"Foretold · a story / a reward waits here"*
- 10 *far-sight*: sama säde kuin Mediumilla (`MEDIUM_RINGS`); kortin teksti yleistetty (*"You sense it beyond your border"*)
- 15 *free-ward*: `wardAt` maksaa tyhjällä hinnalla kerran UTC-päivässä (`K.freeWard`); `freeWardToday` repositoriossa, heksakortti sanoo *"Ward · free today"* ja nappi toimii ilman puuta (`freeWard.test.ts`)
- 20 *wide-sight*: `useShownCells` lisää yhden renkaan säätilan päälle
- You-paneeli: perkki porrasrivin vieressä, seuraavalle *"It brings: …"*; nousuhetki saa oman kortin *"A new gift"*
- Opas: uusi sivu *Consciousness* (aina näkyvissä), perkit luetaan `PERKS`istä
