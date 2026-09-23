# BRDC-CLAIM-017 — Last visitor owns it: a different ruleset than the siege model

| | |
|---|---|
| **Alue** | `packages/core/src/rules/capture.ts`, `step.ts`, `packages/core/src/data/stepStore.ts`, `claude.md` §11, Wagerin UI-ovet |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (ei XL — laajuus supistui kolmen vastauksen myötä paljon alkuperäistä
  pelkoa pienemmäksi, ks. Sivulöydökset) |
| **Riippuvuudet** | — |
| **Status** | `done` — 2026-09-23 (v0.6.58) |

## 🔴 RED

Infinite 2026-09-23, sanatarkasti: *"tärkein, on että otetaan nyt sääntösetiksi niin
että se, joka on viimeisenä käynyt alueella omistaa sen.. viimeisin kellonaika
ratkaisee..."*

Ristiriidassa `claude.md` §11:n silloisen tekstin kanssa kirjaimellisesti: *"Siege
model, not instant flip... Do not 'simplify' this back to a single comparison."*
Kolme avointa kysymystä esitettiin ennen koodia (AskUserQuestion), ja Infinite vastasi:

1. **Laajuus: korvaa piiritysmallin kokonaan** Seikkailumoodissa — jokainen askel,
   myös rivaalin aktiivisesti puolustamalle maalle, vaihtaa omistajan heti
2. **Reittimoodi ei muutu** — pysyy ainoana "ei rappiota, ei varastamista" -moodina
3. **Wager poistetaan käytöstä ja piilotetaan** — ei säilytetä rinnalla

## 🟢 GREEN

- [x] `packages/core/src/rules/capture.ts`: uusi `resolveInstantCapture(cell,
      attacker, now, defenderHome?, holds?)` — vapaa maa ja oma maa käyttäytyvät
      täsmälleen kuten `resolveCapture`; rivaalin **suojaamaton** maa vaihtaa
      omistajaa heti täydellä vahvuudella, ei piiritysmatematiikkaa. Hearth
      (`defenderHome`) ja Fortress (`holds`) putoavat läpi vanhaan
      `resolveCapture`-kulumiseen — **oma tulkintani, ei erikseen kysytty**: nämä
      kaksi ovat jo muualla koodikannassa omia "ei koskaan oikeasti vietävissä"
      -lupauksiaan, eivät osa yleistä aluesääntöä. 6 Vitest-testiä
      (`captureInstant.test.ts`, uusi sisar koska `capture.test.ts` on jo 324/400)
- [x] `packages/core/src/data/stepStore.ts`in `claimStepAt`: haarautuu
      `profile.mode`illa — `route` käyttää yhä `resolveCapture`ia ja vanhaa
      "kieltäydy jos omistettu" -tarkistusta; muut (`adventure`) käyttävät
      `resolveInstantCapture`ia. Lokirivi `corrupt` kun `outcome.kind === 'taken'`,
      `awaken` muuten — sama jaottelu kuin lenkkipolulla jo on
- [x] `packages/core/src/rules/step.ts`in dokumentaatio päivitetty — ei enää väitä
      "never onto someone else's cell"
- [x] `packages/core/src/data/step.repo.test.ts`: olemassa oleva testi *"will not
      take a rival cell"* korvattu kahdella — yksi todistaa seikkailumoodin ottavan
      rivaalin solun heti, toinen todistaa reittimoodin yhä kieltäytyvän
- [x] **Wager parkkeerattu, ei poistettu.** Jokainen ovi (title screen, Keep,
      SettingsMenu-kortti) lakkasi kutsumasta `openWager`ia — koodi
      (`wagerBattle.ts`, `features/wager/`) koskematta. `App.tsx`ista poistettiin
      tarpeeton `wager`/`repository`-tila ja `createRepository`-tuonti, jotka jäivät
      käyttämättömiksi oman muutokseni seurauksena (§3 "poista mikä oma muutoksesi
      teki tarpeettomaksi"). `wager.spec.ts` kokonaisuudessaan `test.describe.skip`,
      ei poistettu — sama peruste kuin koodilla
- [x] `ModeSelect.tsx`in Seikkailumoodin kuvaus ei enää mainitse Wageria
- [x] `mode-select.spec.ts`in "adventure mode unchanged" -testi korjattu (odotti
      ennen Wageria näkyväksi, nyt piilossa molemmissa moodeissa)
- [x] `claude.md` §11 päivitetty paikan päällä (uusi sääntö, siege-malli säilyy
      lenkille + Hearth/Fortress-poikkeuksille, Wagerin parkkeeraus mainittu)
- [x] Portti: `lint:lines`, `tsc -b`, **1707** vitest, `pnpm build`. e2e:
      `mode-select.spec.ts` + `wager.spec.ts` ajettu oikeasti — 10 läpi, 8 ohitettu
      (Wager), ei epäonnistumisia

## Sivulöydökset

- **Laajuus supistui merkittävästi kysymysten vastausten myötä.** Alkuperäinen pelko
  ("suuri osa §11:n vakioista muuttuu merkityksettömäksi") osoittautui vääräksi:
  `decay.ts` ja loppu `capture.ts` (piiritys lenkille, Hearth/Fortress) **eivät
  muuttuneet ollenkaan**. `claimableStep` osoittautui jo aiemmin rajanneen
  step-claimin vain vierekkäiseen maahan — muutos on yksi kohta yhdessä
  funktiossa (`resolveInstantCapture`in "Someone else's"-haara) plus yksi
  haarautuva `if` `stepStore.ts`ssa
- **Anti-cheat-huoli (nopeusrajoitus kantaa nyt koko painon) ei muuttunut
  todellisuudessa** — se oli jo ainoa suoja ennenkin step-claim-polulla, koska
  piiritys ei koskaan toiminutkaan siinä (`claimStepAt` ei koskaan välittänyt
  `defenderHome`/`holds`-parametreja `resolveCapture`ille edes ennen tätä tikettiä)
- **"Uudet resurssit saa vain päivittää sen mukaan kuka omistaa maan"** ei vaatinut
  mitään uutta koodia — `ECON-001`in tuotantomalli jo laskee vain nykyisen
  omistajan tuoton, ja se on nyt vain ajallisesti tarkempi kun omistaja voi
  vaihtua kesken päivän

## Ei tässä

- **Ei muutoksia lenkki-polkuun** (`closeWalk`/`planClaim`) — pysyy vanhassa
  piiritysmallissa, koska se on jo oletuksena pois päältä (`Settings.loopClosure`)
- **Ei muutoksia `decay.ts`iin** — rappio hallitsee yhä hylätyn maan vapautumista,
  orgaaninen ja koskematon
- **`sim.mjs`** (käsin ajettava pelisessio, ei osa testiporttia) viittaa yhä
  Wageriin eikä toimi enää sellaisenaan — ei korjattu, koska se ei ole CI:n eikä
  `pnpm e2e`in osa
