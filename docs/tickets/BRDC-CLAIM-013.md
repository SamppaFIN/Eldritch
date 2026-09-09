# BRDC-CLAIM-013 — Askelvaltaus kertoo itsestään

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 0.1 |
| **Effort** | S (tunti) → M (kytkentä paljasti kaksi muuta vikaa) |
| **Riippuvuudet** | BRDC-CLAIM-009 (joka aukon jätti), BRDC-CLAIM-007 |
| **Status** | `done` — 2026-09-09 (v0.5.47) |
| **Valmius** | 100 % — portti vihreä, `step-claim.spec.ts` 6/6; kenttätesti Infinitellä |
| **Lähde** | Infinite 2026-09-09: *"+10 resurssia -ilmoitus puuttuu kun pelaaja kävelee uudelle ruudulle. Korjattava ennen mitään muuta testausta — tämä on koko onboarding-kokemuksen ydin."* |

## 🔴 RED

**Tämä ei ollut puuttuva ominaisuus. Palaute oli rakennettu, testattu ja johdottamatta.**

`setLastClaim` kutsuttiin tasan yhdestä paikasta: `useTerritory.ts:137`, joka on
**lenkinsulkemispolku**. Askelvaltaus meni eri reittiä — `useDiscovery.ts` →
`repository.claimStep` — eikä se asettanut `lastClaim`ia lainkaan. `useClaimSync.ts:64`
sanoi tämän ääneen: *"A closed loop still reports through `lastClaim`; a step-claim calls
`syncHud` itself."*

`BRDC-CLAIM-009` teki askeleesta **ensisijaisen** valtaustavan ja siirsi lenkinsulkemisen
`Settings.loopClosure`in taakse **oletuksena pois**. Siitä lähtien oletuspelissä
`lastClaim` oli aina `null` — ja siitä riippui **viisi** eri asiaa:

| # | Mikä | Missä | Tila |
|---|---|---|---|
| 1 | `"+10 wood"` -saalisrivi | `Hud.tsx:86` → `claimFeedback.ts` | ei näkynyt koskaan |
| 2 | Valtauskilahdus | `Hud.tsx:194` → `useClaimFeedback.ts` | ei soinut koskaan |
| 3 | Värinä | sama | ei värissyt koskaan |
| 4 | `ClaimBurst` | `MapView.tsx:257` | ei piirtynyt koskaan |
| 5 | Kultainen "maa herää" -välähdys | `useClaimSync` → `awakeningReveal` | ei välähtänyt koskaan |

Resurssit **kyllä tulivat pussiin**: `awardClaims` ajetaan `claimStepAt`in sisällä. Vain
palaute puuttui — täsmälleen kuten raportoitiin.

Juurisyy meni dataan asti: `claimStepAt` **laski** `CaptureOutcome`n, käytti sen
`awardClaims`iin, ja **heitti pois** — `StepClaimOutcome` oli
`{ claimed: H3Index } | { claimed: null }`. Ilman outcomea `ClaimEvent`iä ei voi rakentaa,
joten aukko ei ollut pelkkä unohtunut kutsu.

## 🟢 GREEN

- [x] `stepStore.ts` — `StepClaimOutcome` kantaa lasketun outcomen:
      `{ claimed: H3Index; outcome: CaptureOutcome } | { claimed: null }`.
- [x] `useTerritory` vie ulos `recordClaim(event: ClaimEvent)`. Yksi omistaja tapahtumalle,
      kaksi lähdettä.
- [x] `useDiscovery` sai `onClaimed(outcome, h3)`-takaisinkutsun.
- [x] `useClaimSync` kokoaa `ClaimEvent`in (`outcomes: [outcome]`, `areaM2: cellAreaM2(h3)`)
      ja kutsuu `recordClaim`ia.
- [x] `MapView.tsx` — `recordClaim` mahtui olemassa olevalle riville (**399/400, nolla uutta riviä**).
- [x] `ClaimEvent` sai **`kind: 'loop' | 'step'`** — ks. "Toteutuksessa opittua".
- [x] Askel laukaisee **rivin, kilahduksen ja värinän**. Burst ja välähdys jäävät lenkille.
- [x] Lenkkipolku käyttäytyy täsmälleen kuten ennen.

## Toteutuksessa opittua — kytkennän päälle laittaminen paljasti kaksi vikaa

**1. `ClaimBurst` juhli väärää asiaa.** Se on koko ruudun **5,2 sekunnin** seremonia,
kirjoitettu lenkin sulkemiselle: *"You closed the loop. The land inside your line is
yours."* Kun askel alkoi raportoida itsestään, se laukesi joka askeleella — valheellisella
tekstillä, ja tukkien ruudun niin ettei solupaneelin nappeja voinut painaa. Kentällä se
olisi laskeutunut noin **40 metrin välein kävellessä.**
→ Burst lukee nyt `kind`in, ei solumäärää (lenkki voi ottaa yhden solun). Teksti *"You
closed the loop"* näkyy vain kun lenkki oikeasti sulkeutui.

**2. Kultainen välähdys on liian kallis per heksa.** `useAwakening` ajaa
`requestAnimationFrame`-silmukkaa `AWAKENING_MS` = **2 400 ms**, kaksi
`setPaintProperty`-kutsua per ruutu, plus DOM-solmun 3 900 ms ajaksi. Lenkki maksaa sen
kerran koko korttelista; askel maksaisi sen joka heksasta, ja animaatiot kasautuivat niin
pahasti että **paljastus juuri vallatulla ruudulla rikkoutui**.
→ Välähdys rajattiin lenkkiin. Halpa yhden heksan välähdys on oma tikettinsä, ei tämän
johdotuksen sivutuote.

**3. Synkronointireitti ei ole makuasia.** Poistin `useDiscovery`n `onChanged()`-kutsun
välttääkseni kaksoissynkan. Se rikkoi paljastuksen: `refreshTerritory` ajoi yhden renderin
myöhässä. → Kumpikin polku synkkaa **kerran, omalla reitillään**: lenkki tapahtumasta
(`lastClaim.kind === 'loop'`), askel suoraan promisesta.

## Todennus

- [x] `step.repo.test.ts` — onnistunut askelvaltaus palauttaa outcomen; hylätty `{ claimed: null }`.
- [x] `check-line-limit` + `tsc -b` + `vitest run` (1016) + `pnpm build` vihreä.
      `MapView.tsx` **399/400**.
- [x] `step-claim.spec.ts` **6/6**, uusi case *"a step says what it paid"* lukee HUD:n
      rivin ja vaatii siltä `/awakened .* \+\d+ \w+/`.

**Rehellisyys todennuksesta.** Kolme kaatumista tutkittiin erikseen, ei niputettu välkkeeksi:
- `vitest` 2 kaatumista: **kuormavälke** — ajoi Playwrightin rinnalla (collect 675 s vs.
  normaali 63 s). Yksin **1016/1016**.
- `claim.spec.ts:66`: **ei tästä.** Se ajaa `loopClosure` päällä, jolloin `useDiscovery`
  palaa heti. `BRDC-CLAIM-011`:n *"Ei tässä"* kirjaa nämä lenkkispekit punaisiksi jo
  `367f8ca`:sta asti.
- `step-claim.spec.ts:142` **desktopilla: oli tästä.** Todennettu `git stash`illa **koko
  sarjaa vasten** molempiin suuntiin — yksin ajettu testi meni läpi kummallakin koodilla ja
  olisi johtanut harhaan. Korjattu (välähdyksen rajaus) → desktop **6/6**.
- `step-claim.spec.ts:142` **mobile-360:llä: ei tästä.** Sama testi kaatuu samalla tavalla
  puhtaalla `main`illa (todennettu erikseen). Tiketin `BRDC-CLAIM-011` kirjaama "10/10" on
  v0.5.25:stä; jokin sen jälkeen on rikkonut sen kapealla näytöllä. **Oma tikettinsä** — ei
  korjata tässä, eikä sitä saa lakaista "välkkeeksi": se on toistettava kaatuminen.

**Sivulöydös, korjattu tässä:** kilahdus soi kahdesti per valtaus — `useClaimFeedback`
(uusi reitti) ja `DiscoveryModal` kumpikin. Kumpikin loi oman `AudioContext`in per heksa.
`DiscoveryModal` ei enää soita; `useClaimFeedback` omistaa äänen molemmille poluille.
Samalla `settings`-propsi poistui `DiscoveryModal`ista (ja rivi `MapView`sta).

- [ ] Kenttä: kävele naapuriruutuun → näet `+10`, kuulet kilahduksen, tunnet värinän.
      *(Infinite ajaa.)*

## Ei tässä

- **Halpa yhden heksan välähdys askeleelle** — oma tikettinsä. Nyt askel on rivi + ääni + värinä.
- Notifikaation automaattinen katoaminen — PIVOT kohta 12, `BRDC-HUD-005`.
- Lenkinsulkemisen opettaminen takaisin — `BRDC-CLAIM-010`.
- `+10`:n suuruus tai resurssityyppi — `CLAIM_YIELD` ja `resourceOf` toimivat jo oikein.
