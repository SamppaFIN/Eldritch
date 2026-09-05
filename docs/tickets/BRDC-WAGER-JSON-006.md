# BRDC-WAGER-JSON-006 — Wager on rauhanomainen alueenjako, uudelleenajettava

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | M–L |
| **Riippuvuudet** | BRDC-WAGER-JSON-005 (valmis) |
| **Status** | `done` (2026-09-05) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttähavainto 2026-09-05: *"wager tiedoston voi ajaa uusiksi.. se näyttää kaikki vihulaisen heksat, ja päivittää ruudulle mitkä ruudut on jaettuja.. ympyrä chart omistuksesta.. resurssien jako sen perusteella kumpi on käynyt heksalla useampana päivänä.. wager json tarvii kans päivityksen"* |

## 🔴 RED

Wager on nyt kaksintaistelu: `openChallenge` tuo rivaalin solut, merkitsee päällekkäiset
`shared`, **ratkaisee kaksintaistelun** (`resolveWager`) ja **pehmentää** rivaalin rajaa
voitolla (`applySpoils`), ja kirjaa `challenge.sum`in `K.fought`iin niin ettei samaa
viestiä voi tuoda toiste (`already-fought`). Kentältä neljä puutetta:

1. **Ei uudelleenajoa.** Sama tiedosto torjutaan `already-fought`illa. Infinite haluaa
   ajaa sen uusiksi — mikä on ristiriidassa deterministisen kertataistelun kanssa.
   Ratkaisu (Infiniten valinta): **poista taistelu tuonnista.** Wagerista tulee
   alueenjako, ei kamppailu. Taistelukoodi (`wagerBattle.ts`, `spoils.ts`, `fight.ts`,
   `WagerFight.tsx`) **jätetään pysäköidyksi** — Phase 5:n palvelinmoninpeli voi palauttaa
   sen — mutta `openChallenge` ei enää kutsu sitä eikä dialogi näytä sitä.
2. **Kaukaiset rivaaliheksat eivät näy.** `challengeToCells` tuo kaikki solut (max 2000)
   storeen, mutta `withFogOfWar` piirtää vain omat + 1-renkaan. Rivaalin varsinainen
   alue jää sumun taakse. Infinite: *"näyttää kaikki vihulaisen heksat."*
3. **Jaettua solua ei selitetä missään.** `Cell.shared` piirretään kartalle ruudukkona
   (WAGER-JSON-005), mutta `CellPanel` ei kerro kenen kanssa, kumman osuus, tai että
   tuotto jakautuu. Infinite: *"ympyrä chart omistuksesta.. näytetään heksan detailsissa."*
4. **Jako on pelkkää voimaa.** `localShare` = `mineAtImport / (mine + theirs)` —
   voima tuontihetkellä. Infinite haluaa käyntipäivät mukaan: **voima ensin, käyntipäivät
   ratkaisevat tasapelin.** JSON ei kanna päivälukuja → `CHALLENGE_VERSION` 2 → 3.

## 🟢 GREEN

- [x] **Tuonti ei enää taistele.** `openChallenge(store, text, me, now)` — pois
      `resolveWager`, `applySpoils`, `K.fought` (avain poistettu `keys.ts`:stä),
      `already-fought`, `writeLogEntry({kind:'wager'})`, `ownCells`/`home`-parametrit.
      Jäljelle: parsi, kirjoita rivaalin solut (kaikki, päälle), merkitse päällekkäiset
      `shared`. `WagerReport` = `{ challenge, imported, shared }` (solumäärät).
      `wagerBattle.ts`/`spoils.ts`/`fight.ts`/`WagerFight.tsx` pysäköity — `WagerFight`
      sai oman `FightReport`-tyyppinsä (`WagerReport` ei enää kanna `outcome`ia).
- [x] **Uudelleenajo toimii.** Ei `already-fought`ia. `ChallengeFault`ista poistettu
      `'already-fought'`, `FAULT`-taulusta myös. e2e: sama viesti hyväksytään kahdesti.
- [x] **Wire-formaatti v3: käyntipäivät.** `WireCell.d?: number` (`cell.ownedDays`).
      `toWireCell` + `world.ts#trimWire` kantavat `d`:n. `challengeToCells` asettaa
      `ownedDays: c.d`, jotta `openChallenge` lukee sen suoraan `theirs`-solusta.
      `CHALLENGE_VERSION` 2 → 3; `WORLD_VERSION` 1 (additiivinen).
- [x] **`Cell.shared` saa päivät ja nimen.** `{ with, withName?, mineAtImport,
      theirsAtImport, myDays?, theirDays? }`. `openChallenge` päällekkäisyydessä:
      `withName = challenge.nation ?? challenge.name`, `myDays = existing.ownedDays ?? 0`,
      `theirDays = cell.ownedDays ?? 0`. Additiivinen, ei migraatiota.
- [x] **Jako: voima ensin, päivät tasapeliin.** `localShare` (`rules/terrain.ts`,
      vietiin `rules/index.ts`-barreliin): voimasuhde kun `mine !== theirs`; muuten
      päiväsuhde `myDays / (myDays + theirDays)`; kumpikaan ei erota → 0.5. Sama funktio
      ajaa tuoton (`trickle`) ja `SharedNote`n näytön.
- [x] **Kaikki tuodut solut näkyvät.** Kaksi muutosta: `MockRepository.getCells` lisää
      `allCells().filter(c => c.imported)` viewportin ulkopuolelta (sama täysskannauksen
      hyväksytty hinta kuin `getOwnedCells`illa, BRDC-SCALE-001), ja `withFogOfWar` pitää
      jokaisen `c.imported`-solun mukana. Koskee Wageria ja `world.json`ia.
- [x] **CellPanel näyttää jaon.** `SharedNote.tsx` (`ImportedNote.tsx`n rinnalla): rivi
      "Shared with {withName}", stroke-SVG-donitsi (§12, `OWN_STROKE`/`ENEMY_STROKE`,
      `stroke-dasharray`) omalla osuudella, "Yours N% · Theirs M%", ja "the hourly yield
      splits the same way. Walk it on a new day to take it all back." Tyylit `wager.css`:ssä
      (`wager__shared*`); `CellPanel`ista trimmattiin fokus-kommentti tilan tekemiseksi.
- [x] **WagerDialog: taistelu pois näkyvistä.** "Your border" -osio, `defence`-tila,
      `<WagerFight>`, jälkiselostukset ja `regionOf`/`provinces` poistettu. Jäljelle intro,
      "Send yours", "Take theirs". Onnistumisviesti: *"{name}'s ground is on your map — N
      cells[, and M you now share]. You can accept it again any time to refresh their
      reach."* `exportChallengeFrom` lähettää `defence`n `getDefence`n oletuksesta (`'wall'`).
      Orpo CSS (`wager__aside/outcome/verdict`) poistettu.
- [x] **e2e.** `wager.spec.ts` — pois "border defence travels" -testi ja `.fight__*` /
      `already-fought`-assertit. Uutta: sama viesti hyväksytään kahdesti; rivaalin
      ei-päällekkäinen solu (`color === ENEMY_FILL`) piirtyy vaikkei vastaanottaja kävele.
      `test.describe.configure({ mode: 'serial' })` — kaksi kaksikontekstitestiä ei aja
      rinnakkain (accept-skannaus aikakatkeaa CPU-kisassa). WAGER-JSON-005:n ruudukko-
      assertit säilyivät, `=== 7` → `>= 5` (kaksi GPS-perustamista voi jäädä solun päähän).
      SharedNoten CellPanel-tarkistus jätettiin pois — vaatisi pelaajan seisomaan
      tietyssä jaetussa solussa kontekstien yli, saman hauras kuin BRDC-TEMPLE-002:ssa;
      `localShare`-yksikkötestit + repo-testi kattavat mekaniikan, karttalähde näytön.
- [x] **Yksikkötestit.** `challenge.test.ts` (v3-odotukset, `d` round-trip),
      `wager.test.ts` (ei fight/spoils-testejä, uudelleentuonti, `shared` saa
      `withName`/`myDays`/`theirDays`), `terrain.test.ts` (`localShare` tasapeli →
      päiväjako, voimaero → voimajako), `territoryFeatures.test.ts` (`withFogOfWar`
      pitää `imported`-solun).
- [x] `pnpm test` (950) · `pnpm typecheck` · `pnpm lint:lines` · `pnpm build` vihreät.
      `wager.spec.ts` (8 testiä, 2 projektia) vihreä, ajettu kahdesti. `claim.spec.ts`n
      5000-heksan perftesti ja `step-claim.spec.ts` putosivat 8 min ajobatchissa
      koneen kuorman takia — molemmat vihreitä yksin ajettuna.

## Vaikutus muihin

- **`BRDC-WAGER-BATTLE-001`** (Phase 2.5, `done`) — tuonnin taistelukutsu perutaan.
  Koodi jää pakettiin pysäköitynä; ticket saa huomion että Phase 5 herättää sen.
- **`BRDC-WAGER-JSON-003`** (idea bank, `todo`) — voitetun Wagerin rappiomajakka: ei
  enää voittoa Wagerista. Tiketti jää auki, mutta sen lähtökohta on nyt eri.

## Ei tässä

- `world.json`-päällekkäisyyden `shared`-merkintä (`mergeWorld` ohittaa omat solut nyt) —
  Wager on tämän tiketin rajaus. Erikseen jos pyydetään.
- Globaali omistuskaavio (Keep → Realm): Infinite rajasi *"vain per-solu CellPanelissa."*
- Taistelukoodin poisto — jätetään pysäköidyksi, ei kuolleena poistettavaksi.
