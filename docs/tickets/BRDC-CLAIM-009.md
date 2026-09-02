# BRDC-CLAIM-009 — Askel-valtaus: astut heksaan, se on sinun, ja ruutu kertoo sen

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | L (mekaniikan uudelleensijoitus + modaali + 2 bugia) |
| **Riippuvuudet** | BRDC-CLAIM-006, BRDC-REVEAL-001, BRDC-NATION-001 |
| **Status** | `done` (v0.5.24), kenttätodennus `[~]` |
| **Valmius** | 90 % |
| **Lähde** | Infinite, tuotantobugi + suunnanmuutos 2026-09-02 |
| **Jatko** | `BRDC-CLAIM-010` — lenkin opetus takaisin, modaalin frekvenssi |

## 🔴 RED

**Suunnanmuutos (omistajan päätös).** Lenkin sulkeminen siirtyy asetuksen taakse,
oletuksena **pois**. Uusi päätapa: pelaaja astuu omistamattomaan heksaan joka koskettaa
aluettaan → se vallataan heti, ja ruutu kertoo. Sama mekanismi käynnistää pelin.

**Tuotantobugi:** heksaa ei voinut valita kartalta klikkaamalla. "Here" toimi (kutsuu
`inspect.onCellTap(standingOn)` suoraan). Juurisyy: `0f6e2e5` rajasi `MapCanvas`n klikin
vain `CELL_FILL_LAYER`in renderöityihin soluihin; kun `owned` on pieni/tyhjä,
`queryRenderedFeatures` palautti tyhjän.

**Nimikentän glitch:** `NationIdentity`n `<input>` menetti kohdistuksen `MapView`n
sekuntitikitys + mobiilinäppäimistön yhteisvaikutuksesta.

## 🟢 GREEN

- [x] **Puhdas `claimableStep(standing, owned, home)`** (`rules/step.ts`): palauttaa
      solun jos se ei ole omasi ja koskettaa aluetta tai on Hearth. Testit `step.test.ts`
      (5): kiinni → kyllä, irti → ei, Hearth aloituksessa → kyllä, oma → ei, null → ei.
- [x] **`claimStepAt`** (`data/stepStore.ts`) → `MockRepository.claimStep`: lataa solun,
      hylkää jos rivaalin, muuten `resolveCapture(emptyCell)` (sama kutsu kuin lenkki),
      `store.set` + `addXpTo` + `awardClaims([outcome])` + `writeLogEntry('awaken')`.
      `step.repo.test.ts` (9): valtaa reunan, ei irrallista, XP, ei tuplaa, ei rivaalia.
- [x] **Lenkin sulkeminen asetuksen taakse.** `Settings.loopClosure` (oletus `false`),
      `useTerritory` optiona → `attempt()` ohittaa kun `!loopClosure`. Trail piirtyy yhä.
      `SettingsMenu`: "Claim by closing a loop" -kytkin + huomautusrivi.
- [x] **Löytöruutu** `DiscoveryModal.tsx` (`@es3/ui` `Modal`): kun `discovered` saa
      arvon → modaali, `HexMandala`, maaston nimi, opastava rivi kun `owned ≤ 5`,
      *"Reveal what it holds"* + *"Open its card"*. Auto-sulkeutuu 4,5 s / tap / ESC.
      `playChime('claimed')` avautuessa jos `settings.sound`.
- [x] **Paljasta-nappi + tyyppibonus.** `revealBonus(h3)` (`rules/reveal.ts`,
      `REVEAL_MULT` common..legendary = 2..16 × `CLAIM_YIELD` lajista, rare/legendary +
      1/3 tokenia). `revealAt` (`data/revealStore.ts`, `K.revealed`) → `revealCell` /
      `getRevealed`. Ilmainen, kerran per solu. `RevealControl.tsx` `CellPanel`issa +
      `DiscoveryModal`issa. Testit `reveal.test.ts` (+4).
- [x] **Regressio korjattu.** `MapCanvas.onClick`: jos `CELL_FILL_LAYER`-osumaa ei ole,
      `onCellTap(cellAt(e.lngLat))` — johdetaan heksa klikin koordinaateista.
      `useSelection` täyttää tuntemattoman `emptyCell`llä, `CellPanel` sanoo "Unclaimed".
- [x] **Nimikentän glitch korjattu.** `NationNameField.tsx` = `React.memo`, propsit
      `initial` + `onCommit` (`useCallback`). Vakaat propsit ⇒ ancestorin render ei
      kosketa kenttää.
- [x] **`describe.ts`** `LogKind` `'reveal'` + case + `LOG_TOPIC.reveal = 'awakening'`.
- [~] Kenttätodennus oikealla puhelimella — seuraavalla testikierroksella. Koodi,
      tyypit, 931 testiä ja build vihreät.

## Toteutus

Uusi hook `useClaimSync.ts` yhdistää post-claim-reread + `awakeningReveal`-memon +
`useDiscovery`n (askel-valtaus + `revealed`-kirjanpito), koska `MapView` oli
rivikatossa. `useDiscovery`n `onChanged` = `syncHud` (profiili + pouch + territory +
opening-zoom). MockRepository-delegaatteja tiivistettiin arrow-muotoon tilan tekemiseksi.

## Ei tässä

- **`BRDC-CLAIM-010`**: lenkin opetus takaisin, modaalin frekvenssin porrastus
      (N ekaa → toast), tutoriaalitekstit, naapuriheksojen porrastettu paljastus.
- Rivaalin heksojen ottaminen askeleella (siege per askel) — nyt vain omistamattomat.
- Rare/legendary-solujen sisältö (anomalia, ihme) — `BRDC-EVENT-001` / `-WONDER-001`.
- `world/*.json` 404:t — kosmeettista, cron julkaisee `world/`-hakemiston (SHARE-001).
