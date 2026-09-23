# BRDC-MODE-002 — Reittimoodin oma sääntöpolku ja tulostaulu

| | |
|---|---|
| **Alue** | `packages/core/src/rules/`, `packages/core/src/data/world.ts`, `apps/worker/src/`, `apps/game/src/data/worldSource.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Riippuvuudet** | `BRDC-MODE-001` (`profile.mode` on oltava olemassa) |
| **Status** | `[ ]` ei aloitettu — 2026-09-23 |

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

- [ ] Uusi `packages/core/src/rules/routeClaim.ts`: puhdas `claimRouteCell(cells,
      h3, me)` — vapaa heksa → pelaajan, pysyvästi maksimivahvuudella; jo-omistettu
      (kenen tahansa, myös pelaajan itsensä) → ei tee mitään. Vitest: vapaa → valtaa,
      rivaalin oma → ei-op, oma jo → idempotentti
- [ ] Kävelyn kirjoituspolku haarautuu `profile.mode`illa: `route` →
      `claimRouteCell`, `adventure` → nykyinen `resolveCapture`/decay-ketju
      koskemattomana. Rappiokierros ohitetaan kokonaan reittimoodin tallennuksille —
      reittimoodin solu ei koskaan rapaudu eikä sitä voi viedä keneltäkään, myöskään
      seikkailumoodin rivaalilta
- [ ] Uusi elinikäinen matkalaskuri (`packages/core/src/data/distanceStore.ts`,
      uusi `K.routeDistanceM`): kasvaa `haversine(prev,next)`illa jokaisella
      hyväksytyllä trail-pisteellä, vain reittimoodissa. Debounced-tallennus kuten
      muutkin storet; ei koskaan nollaannu tai karsiudu istuntojen välillä
- [ ] `packages/core/src/data/world.ts`: `mode?: GameMode` ja
      `routeDistanceM?: number` lisätty additiivisesti `WorldSource`/
      `WorldSubmission`/`WorldPlayer`iin — vanhempi lähetys kantaa kumpaakin
      kenttää oletusarvoisesti puuttuvana, ei migraatiota
- [ ] Uusi `packages/core/src/data/routeCodex.ts`: `routeCodexOf(sources)` —
      suodattaa `mode === 'route'`, järjestää `routeDistanceM`in ja heksamäärän
      (`cells.length`) mukaan. Vitest-katettu samalla tavalla kuin `worldStats.ts`
- [ ] Worker: uusi `routeCodex.ts` (tai lisäys `index.ts`iin jos rivibudjetti
      sallii), `ROUTE_CODEX`-KV-avain kirjoitettuna `rebuild()`in yhteydessä,
      `GET /route-codex` samalla kylmäkäynnistys-pelastuksella kuin `/demographics`
- [ ] `apps/game/src/data/worldSource.ts`: `fetchRouteCodex()`, sama kuvio kuin
      `fetchAtlasHistoryWeeks`/`fetchAtlasSnapshot` (BRDC-ATLAS-001)
- [ ] Uusi kevyt Codex-paneeli reittimoodin pelaajalle, auki ☰-valikosta — näyttää
      oman sijan matka- ja heksataulukossa
- [ ] `worldStore.ts`/`useWorld.ts`: julkaisu kantaa `mode`/`routeDistanceM`in kun
      ne ovat olemassa; ei muuta julkaisulogiikkaa muuten

## Todennus

Vitest `routeClaim.ts`ille (vapaa/rivaali/oma-jo) ja `routeCodex.ts`ille (järjestys,
suodatus, tyhjä syöte). `pnpm test && pnpm typecheck && pnpm lint:lines && pnpm build`.
Käsin `wrangler dev`illä: reittimoodin pelaaja julkaisee, `/route-codex` näyttää
hänet oikealla matkalla/heksamäärällä, `/demographics` joko ei näytä häntä ollenkaan
tai näyttää — päätetään toteutuksen aikana kun nähdään miltä se oikeasti näyttää
kummallakin tavalla.

## Ei tässä

- **Ei moodin vaihtoa kesken pelin** — sama rajaus kuin `BRDC-MODE-001`
- **Ei reittimoodin PvP:tä sisään/ulos-suuntaan.** "Ei varastamista" tarkoittaa
  kaksisuuntaista: reittimoodin pelaaja ei myöskään voi menettää maataan
  seikkailumoodin rivaalille
