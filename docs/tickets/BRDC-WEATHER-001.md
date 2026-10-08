# BRDC-WEATHER-001 — Säät: sumu, kirkas, myrsky — kalenterista, ei assettia

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S (deterministinen funktio + muutama kytkentä) |
| **Riippuvuudet** | BRDC-EVENT-001 (`darkTime` on malli) |
| **Status** | `done` (2026-10-08, haara `season-3`, MOON-001:n mukana) |
| **Valmius** | 100 % |
| **Lähde** | Aavistuksen ehdotus 2026-09-02 — `darkTime`n laajennus |

## 🔴 RED

`darkTime` osoittaa mallin: kalenterista johdettu maailmantila joka skaalaa tuotantoa,
sanotaan ennen kuin puree. Sää voisi olla sama idea — halpa, deterministinen, 0 assettia
— ja se antaisi kävelypäiville luonnetta ("tänään on sumua, mennään silti").

## 🟢 GREEN

- [x] **`weatherAt(now): 'clear' | 'fog' | 'storm' | 'calm'`** (`rules/weather.ts`, puhdas,
      deterministinen päivämäärästä FNV-hashilla — sama sää joka puhelimessa samana päivänä).
      `calm` = normaali, yleisin. Muut harvempia.
- [x] **Sumu** → fog-of-war-säde kutistuu (owned + 0-ring sen sijaan että 1-ring)
      `territoryFeatures.ts` `withFogOfWar`.
- [x] **Kirkas** → reveal-säde +1 (owned + 2-ring). "Näet kauas tänään."
- [x] **Myrsky** → GPS-tarkkuustoleranssi löysempi (`MAX_ACCURACY_M` × 1.5 sen päivän)
      niin että huono taivas silti kelpaa — mutta anti-cheat-nopeusraja EI löysty (§15).
- [x] **HUD-rivi** kun sää ei ole `calm`: "Sumu · näet vähemmän" tms. Codex-linkki
      (`weather`-topic `help.ts`:ään).
- [x] `weather.test.ts`: determinismi (sama now → sama sää), jakauma järkevä sadan päivän
      yli, jokainen arvo esiintyy.

**Toteutus:** `rules/weather.ts` (FNV + sekoitus UTC-päivästä; 55 % calm). Sumu/kirkas →
`sightRings` → `fogOfWar.ts` (siirretty `territoryFeatures.ts`:stä rivikaton takia). Myrsky →
`geo/filter.ts` `acceptPoint`, nopeusraja ennallaan. HUD: up-next-nauhan ensimmäinen kohta
("Full moon · Fog"), napautus → Codex `sky`. e2e `sky.spec.ts` (kello 2027-04-20).

## Ei tässä

- Oikea sää-API / paikallinen sää — deterministinen kalenterisää, ei verkkoa (§9 sääntö 9).
- Sään mekaaninen vaikutus tuotantoon — se on `darkTime`n tontti; tämä on havainnointi
  ja kävelykokemus.
- Vuodenajat / lämpötila — `darkTime` hoitaa talven.
