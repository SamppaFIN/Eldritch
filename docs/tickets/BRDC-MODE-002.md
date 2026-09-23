# BRDC-MODE-002 — Reittimoodin oma sääntöpolku ja tulostaulu

| | |
|---|---|
| **Alue** | `packages/core/src/rules/`, `packages/core/src/data/world.ts`, `apps/worker/src/`, `apps/game/src/data/worldSource.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Riippuvuudet** | `BRDC-MODE-001` (`profile.mode` on oltava olemassa) |
| **Status** | `done` — 2026-09-23 (v0.6.55) |

## 🔴 RED

`BRDC-MODE-001` antaa pelaajalle moodin, mutta reittimoodin pelaaja pelaisi silti
tarkalleen samaa peliä piilotetun UI:n takana: sama rappio, sama valtaustaistelu
toisia vastaan, sama moniulotteinen Codex jossa hän näyttäisi tyngältä seikkailijalta
(taso 1, ei rakennuksia, ei väestöä). Infinite valitsi 2026-09-23 (AskUserQuestion)
kolme asiaa jotka tekevät reittimoodista oikeasti oman pelinsä eikä vain oman
näkymänsä:

1. Reittimoodin heksa on pysyvästi pelaajan heti kun hän kävelee sen — ei rappiota,
   ei kenenkään valtaamana toiselta.
2. Pisteytys on oikea, koko pelin ajan säilyvä kuljettu kokonaismatka — ei nykyinen
   `leyM` (uniikki-reitti-mittari, joka tarkoituksella jättää toistetut lenkit
   laskematta).
3. Reittimoodilla on oma tulostaulunsa, erillään Seikkailumoodin Codexista.

Mitään näistä kolmesta ei ole olemassa tänään missään muodossa:
`packages/core/src/rules/decay.ts`/`capture.ts` tuntevat vain yhden, täyden
sääntöpolun; mitään koko pelin ajan säilyvää raakaa matkalaskuria ei ole (`Run.distanceM`
on per-kävelykerta ja katkeaa herkästi); Worker tuntee vain `/demographics`in,
joka laskee seitsemän mittaria kaikille sekaisin.

## 🟢 GREEN

- [x] ~~Uusi `packages/core/src/rules/routeClaim.ts`~~ — **ei tarpeen, ks. Sivulöydökset.**
      `claimStepAt` kieltäytyy jo valtaamasta ketään toista omistavaa heksaa, joten
      "ei varastamista" on jo totta reittimoodille nollarivillä uutta koodia
- [x] Kävelyn kirjoituspolku haarautuu `profile.mode`illa rappiossa: `decay.ts`,
      `cellStore.ts` ja `MockRepository.ts` saivat `routeOwner`-parametrin —
      reittimoodin pelaajan oma solu ei koskaan rapaudu (`projectCell`/`blightLevel`/
      `sweepDecay` varhainen paluu). Vitest: 5 testiä `decay.test.ts`ssa, 2
      `MockRepository.test.ts`ssa
- [x] Uusi elinikäinen matkalaskuri (`packages/core/src/data/distanceStore.ts`,
      uusi `K.routeDistanceM`): kasvatetaan `walkFlow.ts`in `submitWalk`issa jokaisen
      hyväksytyn erän `result.distanceM`illa, vain kun `profile.mode === 'route'`.
      Ei koskaan nollaannu. Vitest: 3 testiä `distanceStore.test.ts`ssa
- [x] `packages/core/src/data/world.ts`: `mode?: GameMode` ja
      `routeDistanceM?: number` lisätty additiivisesti `WorldPlayer`/`WorldSource`/
      `WorldSubmission`iin, `buildSubmission`/`parseSubmission`/`worldSourceFrom`
      päivitetty — vanhempi lähetys kantaa kumpaakin kenttää puuttuvana
- [x] Uusi `packages/core/src/data/routeCodex.ts`: `routeCodexOf`/`routePlacementOf` —
      järjestää `routeDistanceM`in ja heksamäärän mukaan, tasapeli heksoilla. 7
      Vitest-testiä (`routeCodex.test.ts`)
- [x] Worker: uusi `apps/worker/src/routeCodex.ts` (`ROUTE_CODEX`-KV-avain,
      `splitByMode`), `rebuild()` jakaa `live`in seikkailijoihin ja kulkijoihin —
      `/demographics` ei enää mittaa reittimoodin pelaajia. `GET /route-codex`
      samalla kylmäkäynnistys-pelastuksella kuin muut — nostettu yhteiseksi
      `cachedTable`-apufunktioksi, koska neljäs kopio olisi vienyt `index.ts`in yli
      400 rivin
- [x] ~~`fetchRouteCodex()`~~ — **ei tarpeen, ks. Sivulöydökset.** `fetchTable`in
      polku-unioni laajennettiin `/route-codex`illa
- [x] Uusi `RouteCodexPanel.tsx` + `useRouteCodex.ts`, auki ☰-valikosta ("Route
      Ledger" — näkyy vain reittimoodissa, korvaa "Codex"-linkin joka näkyy vain
      seikkailumoodissa). e2e: 2 uutta testiä `mode-select.spec.ts`ssa (järjestys +
      tyhjä maailma), molemmat todistettu oikeasti selaimessa
- [x] `worldStore.ts`in `exportWorldSource` lukee `routeDistanceM`in
      `readRouteDistance`illa vain kun `mode === 'route'`, välittää sen
      `worldSourceFrom`ille — julkaisu kantaa kentät ilman erillistä
      `useWorld.ts`-muutosta
- [x] Portti: `lint:lines`, `tsc -b`, **1685** vitest (+7 tätä tikettiä varten:
      `routeCodex.test.ts`), `pnpm build`

## Todennus

Vitest ajettu ja vihreä (ks. yllä). e2e `mode-select.spec.ts` ajettu oikeaa
selainta vasten (`pnpm build` + `playwright test`, ei stale-preview): Route Ledger
näyttää järjestyksen ja "12.4 km"/"31 hexes" -rivit kanavoidusta datasta, Codex ja
Route Ledger poissulkevat toisensa moodin mukaan. **Käsin `wrangler dev`illä ei
ajettu** — vaatii Infiniten oman Cloudflare-pääsyn, sama rajoitus kuin
BRDC-HALL-002:ssa.

## Sivulöydökset

- **`routeClaim.ts` osoittautui tarpeettomaksi.** Ticketin alkuperäinen oletus oli
  että "ei varastamista" pitäisi rakentaa erikseen reittimoodille — mutta
  `claimStepAt` (BRDC-CLAIM-009) kieltäytyy jo valtaamasta mitään ei-null-omistajan
  solua, riippumatta moodista. Rappioimmuniteetti (`routeOwner`-parametri) riittää
  yksin täyttämään koko lupauksen: reittimoodin solu ei koskaan rapaudu eikä sitä
  voi viedä. Alkuperäinen "pysyvästi maksimivahvuudella" ei ole toteutettu, koska
  vahvuudella ei ole merkitystä kun mitään ei koskaan rapaudu eikä sitä voi viedä —
  se oli tiketin oma yksityiskohta, ei Infiniten alkuperäinen pyyntö
- **`fetchRouteCodex()` osoittautui tarpeettomaksi.** `fetchTable`in polku-unioni
  (`'/demographics' | '/clan-codex' | '/atlas'`) laajennettiin yhdellä jäsenellä
  sen sijaan että kirjoitettaisiin kopio samasta kolmen-tuloksen logiikasta
- **`/demographics` suodattaa nyt reittimoodin pois** eikä näytä heitä ollenkaan —
  päätös, joka tiketissä jätettiin auki. Perustelu: Codex of Dominion mittaa
  consciousness/works/provinces, joita reittimoodin pelaaja ei koskaan kartuta;
  seitsemän riviä nollia tai tyngän näköisiä lukuja olisi ollut pahempi kuin
  poissaolo. `atlasOf`/`buildShards`/`clanCodexOf` **eivät** suodata — reittimoodin
  pelaajan maa on yhä oikeaa maata ja piirtyy kaikille kartalle normaalisti
- **`apps/worker/src/index.ts` oli 382/400 ennen tätä tikettiä; nelisen `GET`-reitin
  kylmäkäynnistys-kopiot olisivat vieneet sen 410 riviin.** Neljäs kopio (uusi
  `/route-codex`) sai olemassa olevat kolme (`/demographics`, `/clan-codex`,
  `/atlas`) purkautumaan yhteen `cachedTable`-apufunktioon — sama "split on osa
  GREENiä" -periaate kuin `claude.md` §5.1, sovellettuna deduplikointina uuden
  tiedoston sijaan
- **`constants.ts`in `APP_VERSION` on `0.5.87`, `package.json` on `0.6.54`/`0.6.55`.**
  Huomattu tätä tikettiä tehdessä, ei korjattu — liittymätön, olemassa ollut ajautuma
  ennen tätä sessiota. `SettingsMenu`in versionumero näyttää siis väärää lukua.

## Ei tässä

- **Ei moodin vaihtoa kesken pelin** — sama rajaus kuin `BRDC-MODE-001`
- **Ei reittimoodin PvP:tä sisään/ulos-suuntaan.** "Ei varastamista" tarkoittaa
  kaksisuuntaista: reittimoodin pelaaja ei myöskään voi menettää maataan
  seikkailumoodin rivaalille
