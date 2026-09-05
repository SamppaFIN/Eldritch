# BRDC-FX-001 — Kun jotain tapahtuu, ruutu näyttää sen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-007, BRDC-ACHIEVE-001, BRDC-ART-002 |
| **Status** | `done` (2026-09-05) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"lisäksi todo listalle efektit mitä piirretään ruudulle kun pelaaja saavuttaa
jotain."*

Peli on visuaalisesti vaatimaton juuri niinä hetkinä, jotka sen pitäisi omistaa. Valtaus
saa kilahduksen ja lyhyen välähdyksen; tason nousu, saavutus, Riitin valmistuminen, ihmeen
löytäminen ja seikkailun päätös eivät saa mitään. `claude.md` §12 on kirjoitettu tätä
varten — pyhä geometria **hetkinä**, ei taustakuvana — eikä sitä ole vielä käytetty
mihinkään muuhun kuin sigileihin.

## 🟢 GREEN

- [x] **Yksi efektikerros, ei viittä.** `apps/game/src/features/fx/`: `useMoments` (jono +
      `show`/`dismiss`, `current` = jonon pää → kaksi ei soi päällekkäin), `MomentFx`
      (piirtää `current`in), `useMomentTriggers` (kattohook 4:lle triggerille).
      `MomentKind = levelUp | achievement | riteComplete | wonderFound | questEnd`.
- [x] **Inline-SVG, stroke, ei fillia.** `@es3/ui` `SacredGeometry` per kind: `levelUp` →
      `FlowerOfLife`, `achievement`/`questEnd`/`wonderFound` → `MetatronsCube`,
      `riteComplete` → `HexMandala`. `animate` → `stroke-dasharray` + `@keyframes es-draw`.
      Ei rasteria, ei kirjastoa.
- [x] **Kesto lyhyt ja ohitettavissa.** `MOMENT_MS = 1_800`. `<button>` (tap / Enter /
      Space) sulkee heti, `dismiss()` vie jonon pään.
- [x] **`prefers-reduced-motion`.** `shouldAnimate(reduced)` → `animate={0}` (geometria
      ilmestyy heti), `moment-fx.css` poistaa panel-animaation — mutta moment näytetään ja
      auto-dismiss pätee. `ClaimBurst`in kuvio.
- [x] **Kuria.** `MOMENTS_PER_MIN = 4`, `withinCap(startedAt, now)` pudottaa ylimenevän
      hiljaa. Efekti on `position: fixed` overlay joka katoaa 1,8 s:ssa — ei koskaan
      jatkuvasti ruudulla.
- [x] **Triggerit.** `levelUp`: `useLevelUp` vertaa `levelState(xp).level`iä edelliseen
      (ensinäyttö hiljainen). `achievement`: `useClaimSync` kutsuu nyt
      `repository.syncAchievements(now)` (oli olemassa, ei kutsuttu) ja soittaa jokaisesta
      uudesta. `riteComplete`: `useResearch` palauttaa `lastRite` kun koulukunnallinen
      tech laskeutuu. `questEnd`: `useAdventure` palauttaa `justEnded` kun
      `chooseInAdventure` → `ended`. `wonderFound`: nimi varattu, ei triggeriä (WONDER-001).
- [x] **Testit** (`useMoments.test.ts`, 5): `withinCap` (katto, minuutin ikkuna),
      `geometryFor` (jokainen kind → oma kuvio), `shouldAnimate` (reduced → false).
      Ei renderöintitestiä — repo ei renderöi Reactia testeissä (kuten `ResearchPanel.test.ts`).
- [x] `pnpm test` (955) · `pnpm typecheck` · `pnpm lint:lines` · `pnpm build` vihreät.
      `step-claim.spec.ts` + `research.spec.ts` regressiotön.

## Ei tässä

- Ääni. `BRDC-CLAIM-007` avasi proseduraalisen äänen **yhteen hetkeen** (valtauksen
  kilahdus) ja `claude.md` §6 sääntö 6 pitää loput jäissä. Efektit ovat kuvaa, eivät ääntä.
- Loitsuefektit kartalla (`BRDC-ART-001`).
- Uudet saavutukset. Tämä piirtää ne jotka on jo olemassa (`BRDC-CHAR-001`).
