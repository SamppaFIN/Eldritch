# BRDC-ONBOARD-003 — Kasvata puuttuvan resurssin saantia

| | |
|---|---|
| **Alue** | `rules/charter.ts` (dynaaminen askel), `data/charterStore.ts` |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | S |
| **Riippuvuudet** | BRDC-ONBOARD-001, -002 |
| **Lähde** | Infinite 2026-10-13: *"kasvata puuttuvan resurssin saantia"* |
| **Status** | `done` |

## 🔴 RED

Pelaaja jää jumiin, kun seuraava tavoite vaatii resurssia jota valtakunta ei tuota. Mikään ei
sano mikä puuttuu eikä mistä sitä saa.

## 🟢 GREEN

- [x] Askel valitsee resurssin, jota seuraava tavoite tarvitsee ja jonka tuotto on pienin, ja
      asettaa tavoitteeksi tuoton (esim. *Raise timber to 6/h*). Seuraava tavoite on Keepin nosto
      (luku III), joten valinta on ruoka tai kivi (`keepRaiseCost`); valmis kun molemmat ≥ 6/h
- [x] *Miksi*-rivi kertoo kaksi tapaa: vallata sitä tuottavaa maata, tai rakentaa sitä tuottava Työ
- [~] *Show me* vie omalle tyhjälle heksalle, jonka maa tuottaa sitä (Työ sopii siihen) — ei
      *lähimmälle*, vaan ensimmäiselle; jos sellaista ei ole, nappia ei näytetä
- [x] Tehty luetaan tuotosta (`forecastRates`), ei kertaluonteisesta varastosta
- [x] Testit: oikea resurssi valitaan; askel kuittautuu kun tuotto ylittää rajan
      (`charter.test.ts`, `charter.repo.test.ts`). Huom: täysi varasto näyttää tuotoksi 0/h
      (`forecastRates` laskee katon sisällä)

## Ei tässä

Talouden tasapainotus.
