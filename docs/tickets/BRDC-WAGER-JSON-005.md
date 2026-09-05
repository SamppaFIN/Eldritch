# BRDC-WAGER-JSON-005 — Shared ground shows as shared, and lands the moment it arrives

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | M |
| **Riippuvuudet** | BRDC-WAGER-JSON-004 |
| **Status** | `done` (v0.5.31) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttähavainto 2026-09-05: *"wageriin muutos, kaikki kaverin antamat ruudut näkyy heti.. kaiki jaetut ruudut näkyy jaettuna.. tee gradiikka.. yksin omistettu on väri ja kahdestaan omistettu on tuudukko tms"* |

## 🔴 RED

Kaksi puutetta, molemmat vahvistettu koodista:

1. **Tuodut solut eivät näkyneet kartalla ennen kuin jokin muu virkistti sen.**
   `WagerDialog.accept()` kutsuu `repository.importChallenge`in, joka kirjoittaa solut
   storeen — mutta mikään ei kertonut `MapView`n `useTerritory`lle että jotain muuttui.
   Sama juurisyyluokka kuin `BRDC-CLAIM-011`: kirjoitus tapahtui, ruutu ei tiennyt.
2. **`Cell.shared`-kenttä oli jo olemassa eikä sitä piirretty koskaan.**
   `data/wager.ts#openChallenge` tunnisti jo oikein tilanteen jossa tuotu solu osuu
   omaan soluun (`existing?.ownerId === me.id`) ja merkitsi sen `shared: { with,
   mineAtImport, theirsAtImport }` — säilyttäen oman omistuksen, ei rappeudu, spoils ei
   koske siihen. Mutta yksikään piirtokoodi (`territoryFeatures.ts`, `TerritoryLayer.ts`,
   `CellPanel.tsx`) ei lukenut tätä kenttää lainkaan. Datamalli oli valmis; näkymä puuttui.

## 🟢 GREEN

- [x] **Tuonti virkistää kartan heti.** `WagerDialog`in uusi valinnainen
      `onImported?: () => void` -propsi, kutsutaan onnistuneen tuonnin jälkeen.
      `MapView.tsx` antaa `territory.refresh`in. Titlescreenin oma `WagerDialog`
      (`App.tsx`) jättää propsin pois — siellä ei ole karttaa virkistettäväksi.
- [x] **`shared`-ominaisuus piirtoketjuun.** `CellProperties.shared: boolean`
      (`territoryFeatures.ts#cellProperties`, `cell.shared !== undefined`).
- [x] **Ruudukko, ei kolmas väri.** `TerritoryLayer.ts`: uusi `cells-shared`-taso,
      `fill-pattern` nelinäisestä ruudukosta (kanvasilla generoitu kerran,
      `map.addImage`), joka vuorottelee `OWN_FILL`in (violetti, oma) ja `ENEMY_FILL`in
      (kiinteä vihollispunainen) välillä — samat värit joita kartta jo opettaa, ei
      uutta selitettävää legendaa. Yksin omistettu pysyy kiinteänä värinä ennallaan.
- [x] **e2e todentaa molemmat kerralla, oikealla datalla, ei arvatulla.**
      `wager.spec.ts`: kaksi kontekstia perustaa Hearthin **samaan** koordinaattiin —
      h3 on puhdas funktio sijainnista, joten renkaat osuvat identtisesti ilman että
      kumpikaan kävelee askeltakaan. Vastaanottaja hyväksyy Wagerin Keepistä kartalta
      poistumatta; tarkistaa `map.getSource('cells')`ista että täsmälleen 7 piirrettyä
      solua on `shared`, `cells-shared-pattern`-kuva on ladattu, ja HUD:n oma solumäärä
      pysyy 7:ssä (jaettu solu ei ole menetys).
- [x] **Yksikkötestit** `territoryFeatures.test.ts` (+2): `shared` tosi kun `cell.shared`
      asetettu, epätosi sekä omalle että vihollisen soluille ilman sitä.
- [x] `pnpm test` (936) · `pnpm typecheck` · `pnpm lint:lines` · `pnpm build` vihreät.
      `wager.spec.ts` (10 testiä × 2 projektia) vihreä, ajettu kahdesti kilpa-ajon varalta.

## Toteutus

Ei kosketettu `packages/core`a — `Cell.shared` ja sen kirjoittava logiikka olivat jo
oikein `BRDC-WAGER-JSON-004`:n (tai lähellä sitä syntyneen) työn jäljiltä; tämä tiketti
on kokonaan `apps/game`-puolen näyttö- ja virkistysreitti. Ei uutta väriä eikä selitystä
paneeliin — Infiniten pyyntö oli nimenomaan karttakuva; `CellPanel`iin teksti "myös X:n
väittämä" jätettiin tekemättä koska `cell.shared.with` on paljas `PlayerId` ilman nimeä
ilman lisätyötä `openChallenge`ssa, eikä sitä pyydetty.

## Ei tässä

- Tekstiselitys `CellPanel`issa kenen kanssa solu on jaettu (`CellPanel.tsx` on
  398/400 riviä — vaatisi oman alipaneelinsa `ImportedNote.tsx`n tapaan, jos pyydetään).
- Jaetun solun erillinen käsittely piiritys-/rappeutumislaskennassa muualla kuin
  spoilsissa — `openChallenge` jo suojaa sen niiltä molemmilta.
