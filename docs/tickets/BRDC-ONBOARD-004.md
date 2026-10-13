# BRDC-ONBOARD-004 — Yksi ääni: Kirja korvaa opetuskortit, Counselin ja ensimmäisen kävelyn vihjeen

| | |
|---|---|
| **Alue** | `features/tutor/` (UnlockTeacher), `features/keep/` (Counsel), `features/hud/FirstLook.tsx`, `steps.ts` |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ONBOARD-001, -002 |
| **Lähde** | Infinite 2026-10-13: *"joo voi korvata"* |
| **Status** | `done` |

## 🔴 RED

Kolme rinnakkaista opettajaa sanoo eri asioita eri paikoissa: reunavihje, ruudun peittävä
opetuskortti ja Counselin lista. TUTOR-004 korjasi päällekkäisyyden, mutta ei sitä että ääniä on
kolme.

## 🟢 GREEN

- [x] Opetuskortit (`UnlockTeacher`) poistuvat; niiden sisältö (mitä resurssi on, mihin sitä
      käytetään) siirtyy Kirjan askelten *miksi*-riveihin ja Oppaaseen — `features/tutor/` poistettu,
      Oppaaseen *Resources* (`helpRealm.ts`, Työt luetaan `BUILDINGS`ista)
- [x] Counselin kiireelliset (nälkä, portti lähellä, varastot täynnä, joutilaat kädet, Keep täynnä)
      **ohittavat Kirjan järjestyksen**: ne näkyvät Today-kortissa ennen nykyistä askelta
      (*Urgent*-osio, vaara-reunus; *Nothing urgent* ei näy)
- [x] Counsel-nappi ja -paneeli poistuvat kävelyarkista; codex-kortit siirtyvät Oppaaseen
      (*Running a Realm*, `CODEX_CARDS`ista)
- [x] Ensimmäisen kävelyn reunavihje näyttää Kirjan nykyisen askeleen, ei omaa portaikkoaan
      (`steps.ts` poistettu)
- [x] Vanhat avaimet (`unlocks-seen`, `codex-read`) jäävät lukematta eivätkä riko tallennusta.
      Niiden ytimen koodi poistettu 2026-10-13: `rules/unlock.ts`, `unlockStore`,
      `getUnlocksSeen`/`markUnlockSeen`, `keep.codex()`/`readCodex()`, avaimet `K`:sta
- [x] e2e: `tutor.spec` poistettu, `charter.spec` tilalla; `keep-citizens` ja `sheet-links`
      päivitetty. 360 px -ajo 2026-10-13: uudet punaiset vain perusviivalta tai
      uusinta-ajossa vihreät (keep-citizens:80, up-next:37 kuormassa). `dialogs.spec` ei
      viitannut opetuskorttiin, ja se meni läpi

## Ei tässä

Oppaan sisältö (pysyy ennallaan, saa codex-kortit).
