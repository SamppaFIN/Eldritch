# BRDC-ECON-003 — Pouch ei täyty, valtaus ei kilise, ja versiolahja

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-ECON-002, BRDC-CHAR-001 |
| **Status** | `done` — 2026-09-02 (v0.5.6) |
| **Valmius** | 90 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"pouch ei näy"*, *"pouchini ei täyttynyt resursseista"*, *"en saanut plingiä
uuden alueen omistamisesta"*. Pelaaja käveli pitkän matkan eikä talous reagoinut mitenkään.

## Juurisyy — luettu koodista, ei arvattu

1. **HUD-näyttöbugi (pääsyy "pouch ei näy").** `Hud.tsx` päätti näyttääkö pouch-sirun
   ehdolla `resources.food + resources.wood + resources.gold + resources.mana > 0` ja
   piirsi pipit vain noille neljälle. Yhdeksästä lajista (`wood, stone, iron, food, gold,
   wisdom, mana, culture, tokens`) pouch jossa oli **stone / iron / wisdom / culture /
   tokens** mutta ei ruokaa/puuta/kultaa/manaa renderöityi "—":ksi. Kävele kukkuloita →
   saat kiveä → HUD sanoo tyhjä.
2. **"pouch ei täyty" — osin tarkoituksellista.** `TERRAIN_TABLE.plain.resource === null`
   (`terrain.ts`): tasamaa ei tuota mitään, ei valtauksesta eikä trickleä. Jos vallatut
   solut ovat tasamaata, pouch ei kasva — ja kukkulan kiven näki vasta kun #1 korjattiin.
3. **Ydin ei ole rikki.** `resources.test.ts` `'are paid the moment ground is taken'`
   väittää `total(getResources) === producing * CLAIM_YIELD` ja on vihreä — saalis
   laskeutuu pouchiin täsmälleen oikein, saman `getResources`-polun kautta jota HUD lukee.
4. **Pling** seuraa `PouchGain`ista, joka soittaa `playPling()`n kun `gain && !gain.firstRead
   && settings.sound`. `gain` syntyy kun `positiveDelta(prev, pool)` on ei-null eli pool
   kasvoi. Tasamaan valtaus → ei kasvua → ei plingiä (oikein). Kukkulan valtauksen pitäisi
   kilistä — ellei ääni ollut pois. **Ei erillistä koodibugia; #1 teki kasvusta näkyvän ja
   versiolahja takaa aloituspoolin, joten pling seuraa nyt.**
5. **Vanha data** — `normalizePool` (ECON-002) paikkaa NaN/puuttuvat lukiessa, PERSIST-002
   tyhjentää tuntemattomalla skeemalla. Läsnä-mutta-rikki pool epätodennäköinen, ei pääsyy.

## 🟢 GREEN

- [x] **Juurisyy nimetty ja kirjattu tähän tikettiin** (yllä). Pääsyy: HUD näytti vain
      4/9 lajia. Toissijainen: tasamaa ei tuota. Ydin todettu ehjäksi olemassa olevalla
      testillä.
- [x] **HUD näyttää koko pouchin.** `Hud.tsx`: näyttöehto `RESOURCE_KINDS.some((k) =>
      resources[k] > 0)`; pip + luku jokaiselle nollasta poikkeavalle lajille,
      `RESOURCE_COLOUR[k]` inline-värinä (sama lähde kuin `PouchGain`illa). `hud.css`:
      `flex-wrap`, `.hud__res` -käärö pitää pipin ja luvun yhdessä. Neljä orpoa
      `.hud__pip--*` -luokkaa poistettu (tämän muutoksen tekemänä).
- [x] **Versiolahja.** `grantVersionGift(store, owned, now)` (`data/pouch.js`): nostaa joka
      lajin lattiaan — **100** materiaaleille, **30** manalle ja wisdomille — vähentämättä
      täydempää pouchia tai ylittämättä kattoa. Portti `createRepository`issa,
      skeematarkistuksen jälkeen.
- [x] **Turvaverkko (v0.5.14):** kenttäraportit jatkuivat *"en saa resursseja mistään"*.
      Versiolippu yksin oli hauras (`Delete progress`, puolittain mennyt deploy). Lahja
      ajetaan nyt myös kun **pelaajalla on Hearth ja pouch on täysin tyhjä** —
      tarkoituksellisesti tyhjä pouch elävässä pelissä ei ole mahdollinen tila.
      `grantVersionGift` nostaa vain lattiaan, ei koskaan pienennä.
- [x] **PWA-päivitys (v0.5.14):** `main.tsx` lataa sivun uudelleen kun uusi service worker
      ottaa vallan (`controllerchange`). Standalone-PWA jäi vanhaan bundleen päiviksi —
      siksi lahja ja HUD-korjaus eivät koskaan tavoittaneet kenttätestaajaa.
- [x] **Tyhjä pouch latauksessa** katettu versiolahjalla — erillistä "tyhjä → 100"
      -logiikkaa ei tehty, koska se rankaisisi laillisesti nollilla olevaa pelaajaa.
      Vanha DEV-only `devGrant` poistettu `createRepository`ista, versiolahja korvaa sen
      (toimii tuotannossakin, laukeaa versionvaihdosta ei tyhjyydestä).
- [x] Testit: `pouch.test.ts` — versiolahja nostaa tyhjän lattiaan · ei pienennä täydempää.
      Valtaus→pouch todennettu jo `resources.test.ts`:llä. 840 vihreää.
- [~] **Pling valtauksesta kentällä** — koodipolku on ehjä (ks. juurisyy #4), mutta
      *kentällä* todennus on auki: kävele oikealla GPS:llä, valtaa tuottava heksa,
      kuuntele. Jää seuraavaan testipäivään.

## Ei tässä

- Debug-nappi (`+200 joka resurssia`, ECON-002) **jää paikalleen** kunnes tämä on kentällä
  todettu toimivaksi. Infinite: *"jos ton saa toimiin, niin ei tartte debug resurssin
  lisäystä"* — poisto on oma rivinsä sen jälkeen, ei tässä.
- Talouden tasapaino. Tämä tiketti korjaa putken, ei numeroita.
