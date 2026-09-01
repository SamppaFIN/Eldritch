# BRDC-LOG-001 — Toimintaloki, linkit tietokirjaan

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-HEX-001 (`cell.history`), BRDC-WIKI-001 (slice 1) |
| **Status** | `done` — 2026-09-01 |
| **Valmius** | 90 % |

## 🔴 RED

Ainoa muistiinpano tehdystä on `cell.history` (yhden solun omistajanvaihdokset) ja
HUDin yksi viimeisin claim-rivi. Mikään ei anna selata taaksepäin: "rakensin sahan,
sitten Tyhjyys otti kaksi ruutua, sitten voitin Wagerin". Kaverit kysyvät mitä
tapahtui, eikä siihen ole vastausta pelistä.

## 🟢 GREEN

- [x] `rules/log.ts` (puhdas): `LogEntry { at, kind, ref?, count?, won? }`, `LogKind`
      (13 lajia), `appendLog(log, e, cap)` — sama muoto kuin `appendChange`
- [x] `MAX_LOG_ENTRIES = 200`; `data/logStore.ts` (`readLog` / `writeLogEntry`,
      read-modify-write `K.log`iin, kuten `pathStore.ts`). Ei skeemanostoa
- [x] Yksi rivi jokaisen toiminnon saumassa: `walkFlow.closeWalk` (awaken/corrupt/
      reinforce + count), `runDecay` (reclaim), `buildStore` (build/demolish + ref),
      `techStore` (research), `spellStore` (spell), `wardStore` (ward), `wager.ts`
      (wager + ref + won), `hearth.ts` (hearth), `tradeStore`/`templeStore` (route/expand)
- [x] `GameRepository.getLog(limit?)` + `MockRepository.getLog` (uusin ensin)
- [x] `features/log/describe.ts` — `describeLogEntry(e) → { text, topic? }`, sovelluksen
      nimitaulut (`territory/names.ts`, nostettu `BuildPanel`/`SpellPanel`:sta) +
      `titleCase`. `relativeTime(at, now)`
- [x] `LogPanel.tsx` (+css) — `HelpPanel`-muoto: ei-modaali, ESC, katkaistu HUDin
      yläpuolelle, vierii. Uusin ensin. `topic` → syaani `?` -linkki → `HelpPanel`
- [x] Sisääntulot: HUDin claim-rivi on nyt `<button>` joka avaa lokin;
      `SettingsMenu` sai **History**-rivin
- [x] Iloisempi ääni: `claimed` → nouseva duurikolmisointu (C–E–G),
      `taken` → täyteläisempi, matalampi (`useClaimFeedback.playChime`)

## Toteutus

Merkinnät ovat **dataa, ei lauseita** — core ei osaa sanoa "Built a Sawmill", koska
rakennusnimet ovat sovelluksessa (`claude.md` §16). Sauma tallentaa `{ kind, ref,
count }`, sovellus renderöi. Sama jako kuin `cell.history` / `OwnershipChange`.

`wardCell`:n orkestrointi (viimeinen inline-verbi MockRepositoryssa) siirrettiin
`wardStore.ts`:ään saumaksi, ja pussipolli `usePouchPolling`-hookiin — molemmat
tekivät tilaa lokin propeille alle 400 rivin.

## Testit

- [x] `rules/log.test.ts` — `appendLog` katkaisee `MAX_LOG_ENTRIES`:iin, säilyttää
      uusimmat, vanhimmat putoavat
- [x] `data/log.repo.test.ts` — kävele lenkki → `awaken`-merkintä oikealla `count`illa;
      rakenna → `build` + `ref`; rappeutumispyyhkäisy joka vapauttaa solun → `reclaim`;
      uusin ensin; store pysyy katossa
- [x] `features/log/describe.test.ts` — jokainen `LogKind` renderöi ei-tyhjän lauseen;
      jokainen palautettu `topic` on `HELP`issä; `relativeTime` lukee ajan ihmisyksiköin
- [x] 710 testiä vihreä, `tsc -b`, `lint:lines` — puhtaat
- [~] `removeRouteAt` ei kirjaa (reitin lasku on merkittävä, purku ei)

## Lähde

Kenttätesti 2026-09-01 (Infinite): *"kaikesta toiminnasta historia logi mitä pääsee
selaamaan.. logissa kans linkit wikiin"*
