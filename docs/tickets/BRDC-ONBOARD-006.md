# BRDC-ONBOARD-006 — Kirjan luvut III–V: valtakunta, kaupunki, kausi

| | |
|---|---|
| **Alue** | `rules/charter.ts` (askeleet) |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ONBOARD-001, -002 |
| **Lähde** | Onboarding-suunnitelma 2026-10-13 |
| **Status** | `done` |

## 🔴 RED

Keskipelin mekaniikat — Keepin nostaminen, temppelit ja koulut, tutkija, Tavernan tehtävät,
portit, kauden tavoite ja seikkailu — löytyvät nyt vain sattumalta.

## 🟢 GREEN

- [x] **Luku III — Valtakunta:** nosta Keep tasolle 2 · istuta lippu · tee temppeli (seiso) ·
      vihi koulu tai opi riitti
- [x] **Luku IV — Kaupunki:** valitse tutkija · ota Tavernan tehtävä · kohtaa huhu · sulje portti
- [x] **Luku V — Kausi:** valitse kauden tavoite · aloita Fuming Lake · kävele kauppareitti ·
      kerää vihje kauden mysteereihin. Luvun V lunastukset ovat omassa `K.charterSeason`-avaimessa,
      jonka kauden nollaus tyhjentää — luku tulee uudestaan joka kausi; I–IV pysyvät
- [~] Palkinnot ketjussa: luku III johtaa ensimmäisen riitin manaan (3 × 20). Luvuissa IV–V
      seuraava askel ei maksa resursseja, joten palkinnot ovat yleisiä (kulta, viisaus, kulttuuri)
- [~] Testit: jokainen 12 askeleesta kuittautuu omasta tietueestaan (`charter.test.ts`), luku III
      lukee Keepin tason, temppelin (`charter.repo.test.ts`), luku V uusiutuu kauden vaihtuessa.
      e2e ei vielä kävele lukuja III–V. *Show me* ei ole näillä askelilla (ONBOARD-005 avaa
      välilehdet)

## Ei tässä

Uudet mekaniikat.
