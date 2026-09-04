# BRDC-E2E-001 — Suite kuntoon kahden ajautuman jäljiltä, ja kaksi uutta löytöä

| | |
|---|---|
| **Vaihe** | läpileikkaava |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Status** | `in_progress` — mekaaninen korjaus tehty, kaksi löytöä jäljellä |
| **Valmius** | 75 % |
| **Lähde** | Infinite 2026-09-04: *"tee myös velka pois"* |

## 🔴 RED

Kukaan ei ollut ajanut koko Playwright-suitea kokonaisuutena aikoihin. Kaksi
riippumatonta koodimuutosta oli ajautunut pois testien alta ilman että kumpikaan rikkoi
`pnpm test`/`pnpm typecheck`/`pnpm lint:lines` — e2e ei ole niiden portissa:

1. **`loopClosure` oletukseksi `false`** (`BRDC-CLAIM-009`, 2026-09-02) rikkoi jokaisen
   spekin joka kävelee korttelin ja odottaa lenkkivaltausta ilman että kytkee asetusta
   päälle: `claim.spec.ts` (4), `decay.spec.ts` (2/3), `wager.spec.ts` (1).
2. **Retreat/Delete siirtyivät ☰-Menun taakse** (`SettingsMenu.tsx`n oma kommentti:
   *"used to sit in the bottom bar next to Here and Vigil"*, ajankohta ei tiketöity)
   rikkoi jokaisen spekin joka klikkaa suoraa `"Withdraw"`/`"Return everything to the
   Void"` -nappia: `dialogs.spec.ts` (8/9), `map.spec.ts` (1), `standards.spec.ts` (3),
   `trail-detail.spec.ts` (1).

Koko suite ajettuna: **21 epäonnistui, 3 skipattiin, 42 läpäisi.**

## 🟢 GREEN

- [x] **Kaikki 15 mekaanisesti vanhentunutta testiä korjattu** osoittamaan uuteen
      Menu-virtaan (`Menu` → rivin nimi) tai kytkemään `loopClosure`n päälle ennen
      lataamista (`hearth.ts#enableLoopClosure`, `addInitScript` + `es3:settings`).
- [x] **Todellinen bugi #1, löytyi matkalla ja korjattiin: fokus ei palannut ☰-nappiin.**
      `SettingsMenu.run()` sulki paneelin (`setOpen(false)`) samassa renderissä kuin
      vahvistusmodaali aukesi — klikattu rivi katosi DOMista ennen kuin `Modal` ehti
      lukea `document.activeElement`in, joten fokus oli jo pudonnut `<body>`hen eikä
      minnekään palautettavaa jäänyt. Korjaus: `run()` vie fokuksen ☰-nappiin itse ennen
      paneelin sulkemista. `dialogs.spec.ts`in oma testi todentaa tämän nyt suoraan.
- [x] **Todellinen bugi #2, löytyi matkalla ja korjattiin: Wagerin puolustusvalinta
      hävisi kilpa-ajossa.** `WagerDialog` luki tallennetun puolustuksen `repository`n
      valmistuttua ja **ylikirjoitti** paikallisen valinnan jos pelaaja ehti klikata
      *ennen* kuin `createRepository()` oli valmis — kirjoitus `repository?.setDefence`
      oli silloin no-op, ja myöhempi lataus palautti vanhan arvon. Klikkaus näytti
      onnistuvan mutta sinetöity haaste kantoi silti `'wall'`ia. Korjaus: kesken jäänyt
      valinta pidetään muistissa ja kirjoitetaan läpi heti kun repository ilmestyy,
      lataus ohitetaan sillä kierroksella. `wager.spec.ts`in *"the border defence
      travels"* -testi (aiemmin läpäisi vain koska ei koskaan törmännyt kilpa-ajoon)
      todentaa tämän edelleen.
- [x] **`claim.spec.ts`in "5000 heksaa" ja "tasot pysyvät" korjattu SCALE-001:n
      mukaisesti** — ks. sen oma tiketti.
- [~] **HUD vie 31,7 % ruudusta, budjetti 30 %** (`trail-detail.spec.ts:81`). Pieni
      (~1,7 prosenttiyksikköä), todennettu sekä desktopilla että mobile-360:lla, ei
      viewportin muoto-ilmiö. Ei korjattu — mikä `Hud.tsx`n (398/400 riviä) sisällöstä
      karsitaan on suunnittelupäätös, ei mekaaninen korjaus. Testi jätetty **rehellisesti
      punaiseksi** sen sijaan että budjettia löysättäisiin sen ympärille.
- [~] **`decay.spec.ts`: 2/3 testiä epäonnistuu yhä** dev-serveriä vasten, senkin
      jälkeen kun `loopClosure` on päällä. *"ground fades and is eventually reclaimed"*
      jää lukemaan 1 solua kun pitäisi olla 0; *"reinforces it"* jää tasan
      `BASE_STRENGTH`iin. Epäilty juurisyy, ei todennettu: `BRDC-CLAIM-011`in uusi
      `useTerritory`-efekti (`refresh()` `[refresh, home, runId]`-riippuvuudella, ajaa
      myös jokaisella `bbox`-muutoksella) voi kilpa-ajaa rappeutumispyyhkäisyn oman
      `refresh()`in kanssa — kaksi päällekkäistä `getOwnedCells()`-lukua joiden
      vastaukset saapuvat väärässä järjestyksessä veisivät React-tilan takaisin ennen
      pyyhkäisyä. Ei tutkittu loppuun; oma istuntonsa.

## Ei tässä

- `decay.spec.ts`in juurisyyn löytäminen ja korjaus.
- HUD:n karsinta 30 %:n alle — vaatii päätöksen mitä `Hud.tsx`ssa vähennetään.
