# BRDC-CLAIM-014 — Yhdeksän jalkaa, kaksi valtausta

| | |
|---|---|
| **Alue** | `apps/game/e2e/step-claim.spec.ts`, askelvaltauksen polku |
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M |
| **Status** | `todo` |
| **Löydetty** | 2026-09-12, BRDC-EVENT-002:n portissa |

## 🔴 RED

`step-claim.spec.ts:127` *"consecutive steps each commit — the count follows every one"*
kaatuu: yhdeksän kävellyn jalan jälkeen vallattuja soluja on **9**, kun testi vaatii
vähintään 11 (Hearthin rengas 7 + neljä jalkaa). Eli yhdeksästä jalasta **kaksi** meni läpi.

**Tämä ei ole kuormaflake.** Todennettu stashaamalla koko sen hetkinen työ ja ajamalla
lähtötaso: sama testi, sama luku, **9 molemmilla kerroilla**. Deterministinen, eli
tuotteessa tai testissä on aito vika — ei ajoituksessa.

Kaksi tulkintaa, kumpaakaan ei ole vielä suljettu pois:

1. **Testi kävelee nopeammin kuin sääntö sallii.** `MAX_SPEED_MS` = 8 ja
   `MIN_POINT_INTERVAL_MS` = 5 000. Jos `walkTo` siirtää pelaajaa tiheämmin tai pidemmälle
   kuin nämä, anti-cheat hylkää pisteet oikein ja testi on väärässä. Tämä on
   todennäköisempi, ja se on **hyvä uutinen**: sääntö toimii.
2. **Askelvaltaus hukkaa valtauksia.** `useDiscovery`in `claimed`/`inFlight`-joukot
   voivat niellä jalan, jos sama heksa käydään läpi kahdesti — ja `claimed` on
   nimenomaan *löytökortin* vahti, ei valtauksen.

## 🟢 GREEN

- [ ] Mitataan kumpi se on: lokita hylätyt pisteet ja niiden syy yhden testiajon ajalta
- [ ] Jos anti-cheat: **testi korjataan, ei sääntö.** §15 on selvä
- [ ] Jos valtaus hukkaa: korjataan, ja testi jää sellaisenaan
- [ ] Kumpi tahansa: testi ei saa jäädä punaiseksi eikä sitä saa poistaa

## Ei tässä

- Mitään muuta `step-claim.spec.ts`:stä. Sen yksitoista muuta testiä menevät läpi.
