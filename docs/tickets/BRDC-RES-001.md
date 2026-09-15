# BRDC-RES-001 — 38 bonusresurssia: 10 vanhaa ja 28 uutta rinnakkain, alueittain

| | |
|---|---|
| **Alue** | `rules/bounty.ts`, `features/territory/income.ts`, `CellOn.tsx`, `CellIncome.tsx`, `bounty.ts` (nimet) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M–L |
| **Status** | `todo` — päätös tehty (`BRDC-SEED-000` D2, D3), toteutus alkaa |
| **Riippuvuudet** | `BRDC-TERRAIN-005`, `BRDC-SEED-003` (jako) |
| **Lähde** | `worldseed.ts` (`BONUS_RESOURCES`, `ZONE`, `depositCount`, `allocate`), Worldseed §03 *One to three per area* |

## 🔴 RED

**Nyt** (`rules/bounty.ts:57-118`): 10 löytöä — wheat, herd, deer, furs, gems, marble, fish,
amber, spice, granite. Jokaisella **yksi** resurssi ja tuntituotto, ja löytö päätetään
**heksa kerrallaan** hajautuksella (`BOUNTY_SHARE = 0.125`, eli joka kahdeksas heksa).

**Worldseed:** 28 bonusresurssia, joilla on **useampi tuotto** (esim. Mushrooms `+1 food +1 wisdom`),
maastoaffiniteetti × harvinaisuus, ja vaatimusliput (`shoreline`, `island`, `deepWater`,
`leyCrossing`, `oldGrowth`). Ja ennen kaikkea **jako alueittain, ei heksoittain**: yhtenäinen
saman maaston rypäs jaetaan 7–55 heksan alueiksi, jokainen alue saa 1–3 esiintymää, kukin
**yhdelle** heksalle. Noin 5 % heksoista. *"A resource on every hex is a resource on no hex."*

**Päätös (`BRDC-SEED-000` D2, D3): ei muunnosta — liitos.** Kaikki 10 vanhaa löytöä
(wheat, herd, deer, furs, gems, marble, fish, amber, spice, granite) **pysyvät sellaisinaan**.
28 uutta lisätään niiden rinnalle. Yhteensä **38 bonusresurssia**. herd/furs/amber/spice
**eivät** muunnu cattle/scrap/goldvein/stall:ksi vaikka ne muistuttavat toisiaan — kaksi
erillistä resurssia samalla maastolla on hyväksytty lopputulos, ei väliaikainen tila.

| Vanhat (10, muuttumattomina) | Uudet (28) |
|---|---|
| wheat, herd, deer, furs, gems, marble, fish, amber, spice, granite | reeds, waterfowl, leycrystal, oak, birch, mushrooms, berries, cattle, horses, hay, ironore, peat, bogiron, wisp, goldvein, stall, caravan, scrap, sauna, ale, orchard, vineyard, *(+6 muuta `worldseed.ts`:n `BONUS_RESOURCES`-taulusta, listataan toteutuksessa suoraan lähteestä)* |

## 🟢 GREEN

- [ ] Bonusresurssitaulu `worldseed.ts`:stä sellaisenaan (28), tuotot `Yield → ResourceKind`
      (`timber → wood`); **vanha 10:n taulu koskematta** samassa tiedostossa
- [ ] **Seedatulla alueella** esiintymät (vanhat ja uudet) tulevat siemenestä
      (`HexSeed.resource`), eivät hajautuksesta
- [ ] **Seedatun alueen ulkopuolella** (D2): hajautus **molemmista pooleista yhdessä** —
      38 resurssia, sama ~5 % kokonaistiheys kuin ennen (ei kahta erillistä hajautusta
      päällekkäin samalla heksalla)
- [ ] **Monituotto:** `bountyYield` / `bountyBonus` / `cellIncome` summaavat usean resurssin;
      kortti näyttää kunkin omassa värissään (värilaki). Vanhat 10 pysyvät yksituottoisina
- [ ] Vaatimusliput (uusille) luetaan heksan lipuista; vanhat 10:llä ei vaatimuslippuja,
      kuten nytkin
- [ ] Testit: yhdistetty tiheys `[0.03, 0.12]` seedatulla fixturella; monituoton summa;
      vaatimuslippu estää esiintymän heksalla jolla lippua ei ole; regressio — olemassa oleva
      herd/furs/amber/spice-testi läpäisee muuttumattomana

## Ei tässä

- Kuvat — `BRDC-RES-002`
- Jakoalgoritmi ja alueet — `BRDC-SEED-003`
