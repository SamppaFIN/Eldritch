# BRDC-EVENT-002 — Heksaan astuminen arpoo tapahtuman, ja kirjasto joka kestää kävelyn

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (moottori S–M, kirjasto on kirjoitustyötä) |
| **Riippuvuudet** | BRDC-EVENT-001, BRDC-REVEAL-001, BRDC-MAP-003 |
| **Status** | `done` — 2026-09-12 (v0.5.78) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"En saanut myöskään yhtään random encounteria tai yllätystä, vaikka kuljin
pitkän matkan."*

Pitkä kävely ulkona, eikä peli sanonut kertaakaan mitään yllättävää. Anomaliat ovat
olemassa (`BRDC-EVENT-001`), mutta ne ovat harvassa ja sidottu paikkaan; kävelijälle peli
on hiljainen. Se on suoraan vastoin sitä mitä tästä halutaan:

> *"Haluan siis, että pelaaja pitää kännykkää kädessä ja odottaa että illon se plingaa."*

Ilman kohtaamisia kävely on kirjanpitoa. Kirjanpito ei saa ketään ulos ovesta toista kertaa.

## 🟢 GREEN

- [x] **`rollsEncounter(h3, day)`** — puhdas, deterministinen FNV-1a, ei `Math.random()`a.
      Sama heksa samana päivänä antaa saman tuloksen joka puhelimella; päivä vaihtuu, joten
      heksa ei ole ikuisesti käytetty
- [x] **Taajuus `constants.ts`:ssä:** `ENCOUNTER_CHANCE` = 1/7, `ENCOUNTER_MAX_PER_HOUR` = 6,
      `ENCOUNTER_MAX_PER_DAY` = 20. Osumataajuus **mitattu** 3 000 oikealta solulta, ei
      laskettu kynnyksestä
- [x] Katot ovat liukuva ikkuna aikaleimoista, ei nollattava laskuri. Ja **katto ei kuluta
      maata**: kun se kieltää, mitään ei kirjoiteta, joten heksa puhuu yhä huomenna
- [x] **`DAILY_OMEN_CHANCE` = 0.35**, oma heittonsa, ei vaadi jalkoja. Kysytään kerran per
      sessio bootissa; tallennettu päivä estää uudelleenarvonnan sovellusta avaamalla
- [x] **`data/encounters.json`: 34 kohtaamista** — löytö 8 · ihminen 8 · sää 7 ·
      väärä paikka 6 · valinta 5. `parseEncounters` validoi latauksessa kuten `parseChains`:
      id, laji, teksti, vähintään yksi valinta jolla on sanat, ei kaksoisidejä
- [x] **Vinkki on suunta ja etäisyys, ei koordinaatti.** Kolme kohtaamista osoittaa ihmettä;
      `wonderHint` pyöristää kilometriin ja kahdeksasosasuuntaan **eikä nimeä ihmettä** —
      että jokin on tuolla päin on syy kävellä, mikä se on tekee siitä asioinnin
- [x] Kirjautuu History-lokiin omana lajinaan (`kind: 'encounter'`)
- [~] **Guide-sivu puuttuu.** Loki sanoo mitä tapahtui muttei linkitä sivulle: kirjasto on
      34 tarinaa ja niiden toisintaminen wikissä olisi toinen kopio samasta sisällöstä.
      Kuuluu `BRDC-WIKI-001`:n viipaleeksi, ei tänne
- [x] Testit: 17 moottorille, 18 varastolle, 3 e2e:tä

## Löydetty toteuttaessa

**Päivän enne oli lähes hiljainen.** Se kulki `encounterAt`in läpi, joka heittää ensin
heksanopan 1/7 — eli enne olisi lauennut 0,35 × 0,14 ≈ **5 %:n** todennäköisyydellä eikä
35:n. Se on nimenomaan se *"pling jota odotetaan"*, ja se olisi tullut noin viitenä päivänä
sadasta. Oma testinsä nappasi sen; `pickEncounter` erotettiin, koska enne on jo päättänyt
että jotain tapahtuu ja tarvitsee tietää vain *mitä*.

**`getOwnedCells` oli kuumassa polussa.** Ensimmäinen versio haki koko omistetun joukon
löytääkseen yhden solun — täysi rappiopyyhkäisy joka ikisellä askelvaltauksella, sama
muoto kuin BRDC-ECON-009. Yksi avainluku riittää.

## Todennus

- `pnpm test` 1321, `tsc -b`, `check-line-limit`, `pnpm build` — vihreä
- desktop `encounter` 3/3. **Spec laskee ajossa** minkä heksan päivä puhuu ja kävelee
  sinne: yksi seitsemästä on liian epävarma onnella odotettavaksi, ja tuotantoon jätetty
  testihaka olisi tapa farmata kohtaamisia
- Jaot joita tämä vaati: `constants.ts` → `phase6Constants.ts` (kaksi lohkoa joita mikään
  ei lue, molemmat merkitty omissa kommenteissaan Vaihe 6:ksi), ja `MockRepository` →
  `encounterRepo.ts` (`storyRepo`-kuvio)
- **`step-claim.spec.ts:127` kaatuu, eikä se ole tästä.** Todennettu stashaamalla koko työ:
  lähtötaso antaa saman luvun (9). Kirjattu `BRDC-CLAIM-014`

## Ei tässä

- Liikkuvat olennot kartalla. Nämä ovat hetkiä, eivät olioita.
- Ihmeiden mekaniikka (`BRDC-WONDER-001`) — tämä vain vihjaa niistä.
