# BRDC-ONBOARD-004 — Yksi ääni: Kirja korvaa opetuskortit, Counselin ja ensimmäisen kävelyn vihjeen

| | |
|---|---|
| **Alue** | `features/tutor/` (UnlockTeacher), `features/keep/` (Counsel), `features/hud/FirstLook.tsx`, `steps.ts` |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ONBOARD-001, -002 |
| **Lähde** | Infinite 2026-10-13: *"joo voi korvata"* |
| **Status** | `todo` |

## 🔴 RED

Kolme rinnakkaista opettajaa sanoo eri asioita eri paikoissa: reunavihje, ruudun peittävä
opetuskortti ja Counselin lista. TUTOR-004 korjasi päällekkäisyyden, mutta ei sitä että ääniä on
kolme.

## 🟢 GREEN

- [ ] Opetuskortit (`UnlockTeacher`) poistuvat; niiden sisältö (mitä resurssi on, mihin sitä
      käytetään) siirtyy Kirjan askelten *miksi*-riveihin ja Oppaaseen
- [ ] Counselin kiireelliset (nälkä, portti lähellä, varastot täynnä, joutilaat kädet, Keep täynnä)
      **ohittavat Kirjan järjestyksen**: ne näkyvät Today-kortissa ennen nykyistä askelta
- [ ] Counsel-nappi ja -paneeli poistuvat kävelyarkista; codex-kortit siirtyvät Oppaaseen
- [ ] Ensimmäisen kävelyn reunavihje näyttää Kirjan nykyisen askeleen, ei omaa portaikkoaan
- [ ] Vanhat avaimet (`unlocks`, `codexRead`) jäävät lukematta, eivät riko vanhaa tallennusta
- [ ] e2e: opetuskorttia ei enää ole; tutor.spec ja dialogs.spec korvataan Kirjan speksillä

## Ei tässä

Oppaan sisältö (pysyy ennallaan, saa codex-kortit).
