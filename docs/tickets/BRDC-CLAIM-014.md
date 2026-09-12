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

### Mitattu 2026-09-13 — vika on asiakaspuolella, ei säännöissä

Selaimessa ajettu koetin, yhdeksän jalkaa, kirjattuna joka jalalta:

```
leg 1  cell=b1dfff  new=true  warded=7
leg 2  cell=b0efff  new=true  warded=8
leg 3  cell=b08fff  new=true  warded=9
leg 4  cell=b09fff  new=true  warded=9
leg 5..9                      warded=9   ← ei enää yhtään
```

Ja h3:lla laskettuna samat jalat: **jokainen jalka 1–8 on tasan yhden ruudukkoaskeleen
päässä edellisestä** (jalka 9 on kaksi, mutta valtaus oli pysähtynyt jo kuusi jalkaa
aiemmin).

**Kolme selitystä suljettu pois:**

| Epäilty | Miksi ei |
|---|---|
| Vierekkäisyys pettää | `gridDistance` = 1 joka jalalla |
| Sääntö rajaa etäisyyden kotoa | `claimableStep` ei tunne etäisyyttä lainkaan |
| Pohjoinen on rivaalin maata | Lähin siemen on 260 m suunnassa 55°, ~213 m sivussa pohjoislinjasta ja 2 rengasta leveä |
| Anti-cheat hylkää nopeuden | 45 m / 7 s = 6,4 m/s < `MAX_SPEED_MS` 8; väli 7 s > `MIN_POINT_INTERVAL_MS` 5 s |

**Eli sääntökerros on kunnossa ja `claimStepAt` ei koskaan kieltäydy — sitä ei kutsuta.**
Jäljellä on ketju `trail → useStandingCell → useDiscovery`in valtausefekti. Todennäköisin
yksittäinen epäilty on `useStandingCell`, joka etenee vain kun `point !== lastPoint`:
jos jälki lakkaa hyväksymästä pisteitä, seisontasolu jäätyy eikä efekti laukea enää
koskaan — mikä sopii täsmälleen siihen että valtaus loppuu kokonaan eikä harvene.

**Ei ollut tämän session työtä**: todennettu stashaamalla koko keskeneräinen työ, jolloin
lähtötaso antoi saman luvun (9).

### Jäljellä

1. Lokita hyväksytyt jälkipisteet ja `standingOn` jalka jalalta — onko jälki vai
   seisontasolu se joka jäätyy
2. Jos jälki: **testi korjataan, ei sääntöä** (§15)
3. Jos seisontasolu: korjataan, ja testi jää sellaisenaan

## 🟢 GREEN

- [ ] Mitataan kumpi se on: lokita hylätyt pisteet ja niiden syy yhden testiajon ajalta
- [ ] Jos anti-cheat: **testi korjataan, ei sääntö.** §15 on selvä
- [ ] Jos valtaus hukkaa: korjataan, ja testi jää sellaisenaan
- [ ] Kumpi tahansa: testi ei saa jäädä punaiseksi eikä sitä saa poistaa

## Ei tässä

- Mitään muuta `step-claim.spec.ts`:stä. Sen yksitoista muuta testiä menevät läpi.
