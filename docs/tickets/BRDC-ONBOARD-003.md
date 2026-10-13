# BRDC-ONBOARD-003 — Kasvata puuttuvan resurssin saantia

| | |
|---|---|
| **Alue** | `rules/charter.ts` (dynaaminen askel), `data/charterStore.ts` |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | S |
| **Riippuvuudet** | BRDC-ONBOARD-001, -002 |
| **Lähde** | Infinite 2026-10-13: *"kasvata puuttuvan resurssin saantia"* |
| **Status** | `todo` |

## 🔴 RED

Pelaaja jää jumiin, kun seuraava tavoite vaatii resurssia jota valtakunta ei tuota. Mikään ei
sano mikä puuttuu eikä mistä sitä saa.

## 🟢 GREEN

- [ ] Askel valitsee resurssin, jota seuraava tavoite tarvitsee ja jonka tuotto on pienin, ja
      asettaa tavoitteeksi tuoton (esim. *Raise timber to 6/h*)
- [ ] *Miksi*-rivi kertoo kaksi tapaa: vallata sitä tuottavaa maata, tai rakentaa sitä tuottava Työ
- [ ] *Show me* vie lähimmälle sitä tuottavalle maalle tai heksalle, jolle Työ sopii
- [ ] Tehty luetaan tuotosta (`forecastRates`), ei kertaluonteisesta varastosta
- [ ] Testit: oikea resurssi valitaan; askel kuittautuu kun tuotto ylittää rajan

## Ei tässä

Talouden tasapainotus.
