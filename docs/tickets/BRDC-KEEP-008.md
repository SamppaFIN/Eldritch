# BRDC-KEEP-008 — The Keep says one truth, not two

| | |
|---|---|
| **Alue** | `features/keep/KeepRealm.tsx`, `features/hud/Hud.tsx`, `features/territory/HearthPanel.tsx`, `features/codex/figures.ts` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S (tämä siivu) — laajempi rakenneuudistus jatkuu omana työnään |
| **Status** | `done` — kaksi virhettä ja yksi kahdentuma korjattu, 2026-09-15 (v0.5.89) |
| **Riippuvuus** | `BRDC-DETAIL-001` (sama tietohierarkia-työ, seuraava ruutu) |

## 🔴 RED

Seitsemän ruudun Sigil-läpikäynnin (`BRDC-DETAIL-001`) jälkeen sama auditointi Keeppiin.
Kolme konkreettista, koodista vahvistettua virhettä löytyi:

1. **`KeepRealm.tsx:81` lupasi yksityisyyttä jota peli ei pidä.** *"Other players will only
   ever see your Keep, never your Hearth."* — mutta `BRDC-CASTLE-001` kumosi juuri tämän:
   `assignCastle(store, home)` tallentaa `cellAt(home)`, ja `getHome()`/`getCastle()`
   palauttavat saman h3:n. `CLAUDE.md` §10 sanoo tämän suoraan. Peli väitti pelaajalle
   jotain väärää joka kerta kun Keep avattiin.
2. **`KeepRealm.tsx:90` vastasi väärään kysymykseen.** Kun jakaminen on pois päältä
   (`onPublish` puuttuu), rivi sanoi *"Troops to raise come later."* — aidosti suunniteltu
   ominaisuus (`BRDC-KEEP-002`, `BRDC-BUILD-006`), mutta ei mitään tekemistä sen kanssa
   *miksi lippua ei voi nyt nostaa*. Pelaaja ei saanut vastausta kysymykseensä, vaan
   mainoksen jostain muusta.
3. **Sama maa-ala kolmella eri luvulla.** `Hud.tsx` laski oman `formatArea`insa
   (km² @ 1 000 000 m², 2 desimaalia), `HearthPanel.tsx` omansa (ha @ 10 000 m², 1
   desimaali), ja `codex/figures.ts` kolmannen, jo testatun version (km² @ 1 000 000 m²,
   `toLocaleString`). Sama realmi näytti eri luvun HUD:ssa ja Keepissä samalla hetkellä.

## 🟢 GREEN

- [x] Yksityisyysvirke korjattu sanomaan mitä peli oikeasti tekee: Keep on Hearth-solu,
      ei erillinen, näkymätön piste
- [x] "Sharing pois päältä" -tila selittää miksi, eikä osoita toisaalle: *"Sharing the
      world is off, in Settings — turn it on to raise your banner."*
- [x] Yksi `formatArea`/`formatDistance`-laki (`codex/figures.ts`, jo testattu) — `Hud.tsx`
      ja `HearthPanel.tsx` lukevat sen sijaan että kumpikin laskisi omansa
- [x] Portti: `lint:lines`, `tsc -b`, 1363 vitest, `pnpm build`, `dialogs.spec.ts` +
      `step-claim.spec.ts` (koskettavat HUD:n ja Codexin lukuja) — kaikki vihreää

## Todennus

`dialogs.spec.ts`in oma testi lukitsee Codexin `"11,353 m²"` ja `"2.5 km²"` — molemmat
tulivat jo ennestään `figures.ts`:stä eivätkä muuttuneet. HUD:n oman "Warded cells"
-rivin luku saa nyt saman tuhaterottimen kuin Codex; mikään e2e ei lukinnut sen
vanhaa, eroavaa muotoa. `step-claim.spec.ts`in kommentti ("12974 m²") on kuvaava, ei
väite — testi lukee vain `Number.parseInt`illa ensimmäisen luvun.

## Ei tässä — laajempi Keep-rakenneuudistus jatkuu omana työnään

Tämä siivu korjasi kaksi virhettä ja yhden kahdentuman, ei koko ruudun tietohierarkiaa.
Sigil-dokumentin "05 · KEEP" -mallin mukainen täysi läpikäynti on vielä auki:

- **Neljä nimeä yhdelle paikalle**: otsikko "Your Anchor Stone", aria-label "Your
  sanctuary", HUD-napin "Keep", lore "Hearth". `CLAUDE.md`in sanasto erottaa Anchor Stonen
  (mikä tahansa konsekroitu paikka) ja Keepin (kotisolun julkinen merkki) — omaa
  harkintaa vaatii, näytetäänkö tässä ruudussa jompikumpi vai molemmat, ei nopea korjaus
- **Rakennuskatalogi kahdesti** (`KeepBuildingsPanel.tsx` vs. Guide) — onko Keepin lista
  hakuteos vai rakennuspinta, on sisältöpäätös
- **`formatHours`/`hours()`-kahdentuma** (`Hud.tsx` vs. `KeepRealm.tsx`) — löydetty, ei
  korjattu tässä: kumpikin sanoo saman ajan oikein, eri sanoin ja eri kynnyksin (24h vs
  48h), eikä ole ristiriidassa itsensä kanssa tavalla joka valehtelisi pelaajalle. Ei
  sama luokka virhettä kuin `formatArea`. Oma tikettinsä jos siitä tulee raportti
- Temple-laajennuksen refusal-taulut (`ManaPanel.tsx` vs. `CellPanel.tsx`in
  `EXPAND_REFUSAL`) — ei verrattu tässä siivussa
