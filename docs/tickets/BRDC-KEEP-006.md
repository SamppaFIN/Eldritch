# BRDC-KEEP-006 — Research on yhä kadoksissa, ja umpikuja kun löytyy

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S–M |
| **Riippuvuudet** | BRDC-KEEP-004, BRDC-KEEP-005, BRDC-TEMPLE-002 |
| **Status** | `done` (2026-09-05) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-05: *"temppelille voin antaa koulukunnan, mutta käyttäjä ei pysty tutkimaan riittejä eikä teknologiaa mistään"* + *"ei keepillä ole research valikkoa"* (kuvakaappaus: Keep-paneeli auki Mana-välilehdellä, välilehtipalkki vieritetty näkyvistä) |

## 🔴 RED

`BRDC-KEEP-005` nimesi "Rites"-välilehden uudelleen "Researchiksi", `BRDC-TEMPLE-002`
jakoi tutkimuksen Keepin (koulukunnaton) ja temppelin (koulukunnallinen) kesken.
Kenttä 2026-09-05: pelaaja ei löydä tutkimusta *mistään*. Koodista jäljitetty kolme syytä:

1. **Välilehtipalkki hukkuu.** `HearthPanel` renderöi järjestyksessä: header → `NationIdentity`
   → 4 tilastoa → `KeepResources` (aina näkyvä) → **vasta sitten** `hearth-panel__tabs`
   (Mana · Research · Buildings) → välilehden sisältö. Paneeli on `overflow-y: auto` ja
   avautuu `mana`-välilehdelle. Puhelimella pelaaja vierittää alas etsien tutkimusta,
   päätyy Mana-välilehden "Channel mana to wisdom"iin ja "Realm"iin, eikä koskaan vieritä
   takaisin ylös löytääkseen välilehtipalkin. Kuvakaappaus vahvistaa: palkkia ei näy.
2. **Temppeli on umpikuja.** Koulukunta valittu → `researchableFor(researched, school)` on
   tyhjä tuoreessa pelissä (kaikki koulukunnalliset tekniikat vaativat koulukunnattomat
   esiehdot: `fortification` ← `masonry`+`mining`, `guild-craft` ← `irrigation`+`seafaring`,
   `astronomy` ← `seafaring`). Paneeli sanoo *"Nothing yet — its rites are still unwritten"*
   — ei kerro että esiehdot tutkitaan **Keepistä**, eikä mitä esiehto on. AI-Koulu ch.3:
   virhe kertoo mitä tehdä, ei mitä puuttuu.
3. **Keepin Research on umpikuja ilman wisdomia.** Koulukunnattomat tekniikat listataan,
   mutta jokainen `TechRow`-nappi on `disabled` kun `wisdom < cost`. Tuoreella pelaajalla
   `wisdom = 0` (versiolahja 30 kertaalleen, ei maastolähdettä). Näkymä ei kerro että
   wisdomia saa Library-rakennuksesta tai kanavoimalla manaa Altarilla (Mana-välilehti).

## 🟢 GREEN

- [x] **Välilehtipalkki ylös ja näkyviin.** `HearthPanel.tsx`: `hearth-panel__tabs`
      siirretty headerin alle (ennen `NationIdentity`/tilastot/`KeepResources`) — palkki
      on ensimmäinen asia Keepin auettua, ei jotain jonne vieritetään.
      `hearth-panel.css`: `align-self: stretch` (kumoaa `.es-panel { align-items: center }`
      joka kutisti rivin sisältönsä levyiseksi → v0.5.35:ssä palkki oli ohut näkymätön
      suikale), `position: sticky; top: 0; z-index: 2; background: var(--void-black)` —
      pysyy kiinni ylhäällä kun pitkää välilehteä vieritetään. `research.spec.ts` +
      `temple.spec.ts` + `dialogs.spec.ts` vihreät.
- [x] **Temppelin umpikujaan polku.** `packages/core`: `nextResearchStep(researched, school)`
      — puhdas apuri joka palauttaa `{ rite: TechId; need: TechId } | null`: koulukunnan
      ainoa riitti ja sen seuraava tutkimaton esiehto (BFS `requires`-puussa), tai `null`
      jos koulukunnalla ei ole riittiä (fire/water/nature) tai riitti on jo tutkittavissa/
      tutkittu. `TempleSchoolPanel`: tyhjän `researchableFor`in tilalle, kun `nextResearchStep`
      ei ole `null`: *"Its Rite is {titleCase(rite)}. Research {titleCase(need)} first — in
      the Keep."* Aidosti tyhjät koulukunnat pitävät nykyisen "its rites are still unwritten".
- [x] **Keepin Research kertoo mistä wisdom tulee.** `ResearchPanel`: kun `options` ei ole
      tyhjä mutta jokainen on varaa-ei-riitä (`pool.wisdom < min(cost)`), yksi rivi:
      *"Wisdom comes from a Library, or from channelling mana at the Altar — the Mana tab."*
- [x] **Testit.** `nextResearchStep` (`tech.test.ts`): tuore peli + `spirit` →
      `{ rite: 'astronomy', need: 'forestry' }`; `forestry` tutkittu → `need: 'seafaring'`;
      `forestry`+`seafaring` → `null` (astronomy nyt `researchableFor`issa); `fire` → `null`.
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines && pnpm build` vihreät, `research.spec.ts`
      molemmilla projekteilla.

## Ei tässä

- Tech-puun esiehtojen keventäminen tai wisdom-talouden numerot — tämä on opastus + sijainti,
  ei tasapainotus. Erillinen `BRDC-ECON-*` jos wisdomin saanti on liian hidas.
- Keepin osioiden uudelleenjärjestely (`KEEP-004`:n IA pysyy — vain välilehtipalkki tarttuu).
- `guide-news`-badgen päällekkäisyys paneelin yläreunan kanssa (erillinen, pienempi).
- Keepin oletusvälilehden vaihto `mana` → `wisdom` (harkittu; sticky-palkki riittänee).
