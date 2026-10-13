# BRDC-ONBOARD-005 — Asteittain avautuva käyttöliittymä

| | |
|---|---|
| **Alue** | Keepin välilehdet (`HearthPanel`), kävelyarkin napit (`SheetActions`), navigaatio, asetukset |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ONBOARD-001, -002, -006 |
| **Lähde** | Infinite 2026-10-13: *"1 progressive"* |
| **Status** | `done` |

## 🔴 RED

Uusi pelaaja näkee ensimmäisenä päivänä Keepin neljä välilehteä, Research-navigaation, Landsin,
lipun ja kauden mekaniikat — ennen kuin on vallannut kymmentä heksaa. Sekavuuden suurin yksittäinen
lähde.

## 🟢 GREEN

- [x] Pinnat avautuvat kun Kirja saavuttaa niiden luvun: Realm (luku III), Investigator (IV),
      Season (V); Lands, lippu ja Research kun niiden askel tulee vastaan (`rules/surfaces.ts`:
      Lands = *Hold 12*, Research = Lookouts, lippu = standard-askel). Research-nappi jää
      paikalleen harmaana (viisi saraketta pysyy), Lands ja lippu piiloutuvat
- [x] **Käyttö avaa myös**: pinta, jota pelaaja jo käyttää (esim. valittu tutkija), näkyy
      riippumatta luvusta — veteraanilta ei katoa mitään: pinnan askel *tehty* tilassa avaa sen
      (`surfaces.test.ts`, `charter.repo.test.ts`)
- [x] Avautuminen on hetki: lyhyt kortti *"The Keep has a new page · Realm"* (`SurfaceNews`,
      Oppaan kortin näköinen, ei ajastinta). Ensimmäinen luku tallentaa auki olevat ääneti
- [x] Asetus **Show everything** avaa kaiken heti
- [~] e2e 360 px (`charter.spec.ts`): uusi valtakunta näkee vain Today-välilehden, Research on
      harmaa, Lands puuttuu; *Show everything* avaa kaiken; *Your lands is open* -kortti tulee.
      Veteraanin "käyttö avaa" on todennettu vain yksikkötesteissä. `openMap` kytkee
      *Show everything* päälle muille spekseille (`everything = true`)

## Ei tässä

Uudet ominaisuudet.
