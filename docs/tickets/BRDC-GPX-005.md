# BRDC-GPX-005 — Tuotu kävely ottaa oman polkunsa, omiin maihin koskematta

| | |
|---|---|
| **Alue** | `data/walkFlow.ts` (`submitWalk`), `GameRepository.submitTrail`, `features/gpx/useGpxImport.ts` |
| **Vaihe** | 2.6 / 4 — taskussa kävely (APK) |
| **Effort** | S |
| **Riippuvuudet** | BRDC-GPX-001, BRDC-APK-001 |
| **Lähde** | Infinite 2026-10-16: *"Import ei onnistunut.. tee siitä niin ettei tartte koskee omia maita.."* |
| **Status** | `done` — 2026-10-16 (v0.11.12) |

## 🔴 RED

GPX-tuonti valtasi saman viereisyyssäännön mukaan kuin jalat: heksan saa vain, jos se
koskee jo omaa maata. Taskussa nauhoitettu kävely (erillinen APK) muualla kuin omilla
mailla ei siis vallannut mitään — tuonti näytti epäonnistuneen.

## 🟢 GREEN

- [x] Tuonti on **itsenäinen** (`submitTrail(run, points, { standalone: true })`): kävelyn
      ensimmäinen heksa saa seistä yksin, ja loput kasvavat sen omaa polkua pitkin
      yhtenäisenä nauhana. Elävä kävely ei käytä tätä — hajapiste ei edelleenkään perusta
      siirtokuntaa kaupungin toiselle puolelle
- [x] Nopeus- ja väliaikasuodattimet toimivat kuten ennen (hyppy heitetään pois)
- [x] Paneelin selitys päivitetty: *out of reach* jää vain pitkän katkon jälkeiselle osalle
- [x] Testit: `gpx.repo.test.ts` (+2: kaukainen kävely ottaa polkunsa · hyppy hylätään);
      e2e `gpx.spec.ts` (+1, 360 px: 2 km pohjoiseen nauhoitettu kävely tuo uutta maata)
- [x] `pnpm test` (2121) · `pnpm typecheck` · `pnpm lint:lines` · build

## Ei tässä

APK:n latauslinkki ja playback-toisto (BRDC-APK-001).
