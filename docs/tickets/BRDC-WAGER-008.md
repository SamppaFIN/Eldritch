# BRDC-WAGER-008 — Wager puretaan: pilvi hoitaa jaon

| | |
|---|---|
| **Alue** | `data/wager.ts`, `WAGER-JSON-*`:n tuonti/vienti, `SpoilsPanel`, Keepin Wager-välilehti |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `done` — 2026-10-13 |
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

## Päätös 2026-10-13 (kysely)

Wagerin koodi poistetaan: `rules/wagerBattle.ts`, `features/wager/`, `wager.spec.ts` ja jaetun heksan tilat. BRDC-WAGER-JSON-003 suljetaan samalla.

## Tehty 2026-10-13

Purku oli suurempi kuin tiketti arvioi: Wagerin siirtomuoto (`challenge.ts`) oli myös jaetun
maailman siirtomuoto, ja `imported`-solut ovat jaetun maailman tapa esittää rivaalin maa. Ne
jäivät; vain Wagerin oma osa lähti.

- [x] **Kaksintaistelu pois:** `rules/wagerBattle.ts`, `rules/spoils.ts`, puolustus (`K.defence`),
      `getCombatant`/`getDefence`/`setDefence`, Wagerin vakiot (`WAGER_ROUNDS`, `ORC_BITE`,
      `WALL_GUARD`, `WAGER_SPOIL`, `CHALLENGE_VERSION`)
- [x] **Käsin kuljetus pois:** `data/wager.ts`, `data/wagerRepo.ts`, `exportChallenge`/`importChallenge`,
      `features/wager/` (dialogi, taistelu), `wager.spec.ts`, Sampoamaja-fixture, `sim.mjs`:n Wager-askel,
      ovet (otsikkoruutu, Keep, valikko — kaikki jo parkissa)
- [x] **Jaettu heksa pois:** `Cell.shared`, `rules/share.ts` (`localShare`), `OwnershipNote`, kartan
      ruutukuviokerros. Vanhoissa tallennuksissa kenttä jää levylle mutta mitään ei lueta: heksa on
      pelaajan oma ja tuottaa kokonaan — ei datan katoa, ei migraatiota tarvita
- [x] **Jaettu maailma säilyy:** `WireCell`/`toWireCell`/`checksum` → `data/wireCell.ts` (testattu);
      `worldStore` lukee profiilin, maan ja Keepin itse ilman Wagerin `muster`ia
- [x] Oppaan *The Wager* -sivu jää (vanhat lokirivit linkittävät siihen), sanoo nyt Wagerin
      poistuneen
- [x] BRDC-WAGER-002, -BATTLE-001, -JSON-001…007 merkitty `superseded`
- [~] Loitsujen `via: 'wager'` (kaksi vihollisille suunnattua loitsua) jää — ne odottavat
      BRDC-SPELL-002:ta, ja niiden kohtalo on sen tiketin päätös
- [x] `pnpm test` (2103) · `pnpm typecheck` · `pnpm lint:lines` · build vihreänä
