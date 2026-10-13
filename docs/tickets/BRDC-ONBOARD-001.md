# BRDC-ONBOARD-001 — Pitäjän kirja: yksi polku, joka opettaa pelin tekemällä

| | |
|---|---|
| **Alue** | `packages/core/src/rules/charter.ts` (uusi), `data/charterStore.ts` (uusi), Keepin Today-välilehti, Up next -nauha |
| **Vaihe** | Onboarding (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | — (ONBOARD-002…006 rakentuvat tämän päälle) |
| **Lähde** | Infinite 2026-10-13: *"Pelin ominaisuudet on räjähtänyt käsiin, mutta jotenkin tuntuu että peli on sekava … onboardingin, millä pelaajalle esitellään kaikki pelin mekaniikat … keep tehtävien kautta"*. Päätökset: asteittain avautuva käyttöliittymä, kerran per valtakunta, palkinto vie lähemmäs seuraavaa tavoitetta, korvaa opetuskortit ja Counselin |
| **Status** | `done` |

## 🔴 RED

Peli opettaa itseään kuudessa paikassa, eikä yksikään johda: ensimmäisen kävelyn vihje
(`FirstLook`/`steps.ts`), *"Something has opened"* -opetuskortit (`rules/unlock.ts`), Keeper's
Counsel (`rules/counsel.ts`), codex-kortit, Opas ja Up next -nauha. Pelaaja näkee kaiken
kerralla eikä tiedä mitä tehdä seuraavaksi.

## 🟢 GREEN

- [x] **Yksi tehtävä kerrallaan**: Keepin Today-välilehden ylimpänä kortti — otsikko, yksi lause
      *miksi*, edistyminen (esim. *8 / 12 hexes*) ja **Show me**, joka avaa oikean heksan tai
      paneelin. Sama tehtävä Up next -nauhan ensimmäisenä — `KeepCharter.tsx`, `useUpNext.ts`
      (lyhyt nimi `short`, valmis askel *"… — claim"*)
- [x] **Tehty luetaan tilasta**, ei tapahtumista (sama periaate kuin `unlock.ts` ja `steps.ts`):
      jokaisella askeleella puhdas `done(state)`. Vanhan pelaajan jo tekemät askeleet kuittautuvat
      heti — veteraania ei pakoteta toistamaan (`alreadyDone`: ensimmäinen luku merkitsee
      kaiken jo tehdyn, palkatta)
- [x] **Palkinto vie seuraavaan tavoitteeseen**: askeleen palkinto on se, mitä *seuraava* askel
      tarvitsee (esim. *Study Lookouts* → palkintona Vartiotornin hinta). Lunastetaan napilla,
      kerran; lunastetut tallessa `K.charter`
- [x] **Kerran per valtakunta**: `K.charter` on `FOREVER_KEYS`-avain, ei nollaudu kauden vaihtuessa.
      Luvun V uusiutuminen joka kausi kuuluu ONBOARD-006:lle
- [x] Ydin puhdas ja testattu: `rules/charter.ts` (`STEPS`, `charterView(state, claimed)`),
      `data/charterStore.ts` kokoaa tilan (samat luvut kuin `counselStore`), `repository.charter` — `charter.test.ts` 9,
      `charter.repo.test.ts` 4
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build vihreänä (2026-10-13, 2195 testiä);
      e2e 360 px `charter.spec.ts`: uusi valtakunta näkee ensimmäisen tehtävän, kävelee sen,
      lunastaa +10 wisdom, *Hold 12 hexes · 8 / 12* tulee

## Ei tässä

Lukujen sisältö (ONBOARD-002 ja -006), puuttuvan resurssin askel (-003), vanhojen äänten
poisto (-004), asteittain avautuva käyttöliittymä (-005).
