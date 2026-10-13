# BRDC-ONBOARD-005 — Asteittain avautuva käyttöliittymä

| | |
|---|---|
| **Alue** | Keepin välilehdet (`HearthPanel`), kävelyarkin napit (`SheetActions`), navigaatio, asetukset |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ONBOARD-001, -002, -006 |
| **Lähde** | Infinite 2026-10-13: *"1 progressive"* |
| **Status** | `todo` |

## 🔴 RED

Uusi pelaaja näkee ensimmäisenä päivänä Keepin neljä välilehteä, Research-navigaation, Landsin,
lipun ja kauden mekaniikat — ennen kuin on vallannut kymmentä heksaa. Sekavuuden suurin yksittäinen
lähde.

## 🟢 GREEN

- [ ] Pinnat avautuvat kun Kirja saavuttaa niiden luvun: Realm (luku III), Investigator (IV),
      Season (V); Lands, lippu ja Research kun niiden askel tulee vastaan
- [ ] **Käyttö avaa myös**: pinta, jota pelaaja jo käyttää (esim. valittu tutkija), näkyy
      riippumatta luvusta — veteraanilta ei katoa mitään
- [ ] Avautuminen on hetki: lyhyt kortti *"The Keep has a new page: Realm"*
- [ ] Asetus **Show everything** avaa kaiken heti
- [ ] e2e 360 px: uusi valtakunta näkee vain Today-välilehden; veteraanitallennus näkee kaiken

## Ei tässä

Uudet ominaisuudet.
