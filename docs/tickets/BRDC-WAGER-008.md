# BRDC-WAGER-008 — Wager puretaan: pilvi hoitaa jaon

| | |
|---|---|
| **Alue** | `data/wager.ts`, `WAGER-JSON-*`:n tuonti/vienti, `SpoilsPanel`, Keepin Wager-välilehti |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `todo` — Infiniten päätös kirjattu, ei suunniteltu |
| **Lähde** | Infinite 2026-09-15: *"poistetaan wager, koska data jaetaan clouflaren kautta nykyää"* |

## 🔴 RED

Wager on **käsin tehty tiedostonvaihto**: pelaaja vie JSONin, lähettää sen kaverille,
kaveri tuo sen sisään, ja kohtaaminen ratkaistaan paikallisesti. Se rakennettiin koska
jaettua maailmaa ei ollut.

Nyt on: `apps/worker` julkaisee `world.json`in Cloudflare KV:stä (`BRDC-SHARE-001`,
muistiinpano *shared-world-worker*). Rivaalin maa saapuu itsestään. Wager on siis toinen,
huonompi reitti samaan tietoon — ja se on **52 tiedoston** verran pintaa jota jokainen
uusi ominaisuus joutuu kiertämään.

Kaksi totuutta samasta asiasta on tarkalleen se kuvio jonka v2 teki väärin.

## Mitä pitää selvittää ennen purkua

1. **Mikä Wagerissa on mekaniikkaa, joka pitää säilyttää?** Kohtaaminen ja saalis
   (`spoils.ts`) ovat pelisääntöjä; JSONin vaihto on vain kuljetus. Jos taistelu jää,
   sen syöte tulee `world.json`ista eikä tiedostosta
2. **Mitä tapahtuu tallennetulle Wager-datalle?** Pelaajilla on levyllä tuotuja soluja
   (`imported`). Ne eivät saa kadota — `SAVE_VERSION` ja migraatio, ei hiljaista wipeä (§17)
3. **`BRDC-WAGER-JSON-001…007` ovat valmiita tikettejä.** Ne merkitään `superseded`,
   ei poisteta — ne kertovat miksi koodi oli olemassa

## Ei tässä

- Purku ennen kuin `world.json` kattaa sen mitä Wager kattoi. Ensin korvaaja toimii,
  sitten vanha lähtee — ei toisin päin
