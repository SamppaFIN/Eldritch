# BRDC-RES-001 — 28 bonusresurssia, alueittain

| | |
|---|---|
| **Alue** | `rules/bounty.ts`, `features/territory/income.ts`, `CellOn.tsx`, `CellIncome.tsx`, `bounty.ts` (nimet) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M–L |
| **Status** | `todo` |
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

| Säilyy | Uusi |
|---|---|
| fish, deer, wheat, gems, marble, granite | reeds, waterfowl, leycrystal, oak, birch, mushrooms, berries, cattle, horses, hay, ironore, peat, bogiron, wisp, goldvein, stall, caravan, scrap, sauna, ale, orchard, vineyard |

**Ei vastinetta Worldseedissä:** herd (≈ cattle?), furs, amber, spice.

## 🟢 GREEN

- [ ] Bonusresurssitaulu `worldseed.ts`:stä sellaisenaan (28), tuotot `Yield → ResourceKind`
      (`timber → wood`)
- [ ] **Seedatulla alueella** esiintymät tulevat siemenestä (`HexSeed.resources`), eivät hajautuksesta
- [ ] **Monituotto:** `bountyYield` / `bountyBonus` / `cellIncome` summaavat usean resurssin;
      kortti näyttää kunkin omassa värissään (värilaki)
- [ ] Vaatimusliput luetaan heksan lipuista
- [ ] Jo paljastetut vanhat löydöt eivät katoa hiljaa: herd → cattle, ja furs/amber/spice → päätös
- [ ] Testit: tiheys `[0.03, 0.12]` seedatulla fixturella; monituoton summa; vaatimuslippu estää
      esiintymän heksalla jolla lippua ei ole

## Päätös Infiniteltä

- **D5** (`BRDC-SEED-000`): mitä seedatun alueen **ulkopuolella**? (a) hajautus uudella poolilla
  Worldseedin tiheydellä (~5 %), vai (b) ei bonusresursseja lainkaan ennen kuin alue seedataan
- **furs, amber, spice:** muunnetaan lähimpään (esim. spice → stall) vai jätetään perintöna

## Ei tässä

- Kuvat — `BRDC-RES-002`
- Jakoalgoritmi ja alueet — `BRDC-SEED-003`
