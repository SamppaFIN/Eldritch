# BRDC-SURVEY-001 — Peli lukee naapurustonsa ennen kuin astut siihen

| | |
|---|---|
| **Alue** | `packages/core/src/data/localSurvey.ts`, `apps/game/src/features/map/useNearbySurvey.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | done |
| **Edeltäjä** | BRDC-TERRAIN-002 (tiilenluku), BRDC-TERRAIN-004 (tiilisäännöt) |

## 🔴 RED

Infinite 2026-09-11: *"haluaisin, että peli initioi uuden seikkailun niin että se
tulkitsee jollain metodilla mitä maastoa on lähellä.. esim screenshot kartasta ja joku
automaatio tms."*

**Valtaus maksaa hashin, hallussapito maksaa kartan.** Tämä ei ole tulkinta vaan koodin
oma dokumentaatio (`terrain.ts:189-191`):

> *"Keyed on the h3 alone, so it reads the hash: at the moment ground changes hands its
> tile terrain may not be resolved yet."*

`useTerrainResolver` (`useTerrainResolver.ts:38`) lukee tiilet vain soluille jotka pelaaja
**jo omistaa**, 400 ms viiveellä valtauksen jälkeen. Järjestys on siis:

1. Astut heksalle → `addClaimYield` maksaa **hashin** mukaan ("+10 stone")
2. 400 ms myöhemmin resolveri lukee tiilet → heksa onkin **järvi**
3. Tuntikohtainen tuotto maksaa nyt ruokaa, vaikka valtauspalkkio oli kiveä

Pelaaja näkee palkkion joka ei vastaa maata jolla hän seisoo. Kentällä tämä luetaan
bugiksi, koska se *on* bugi.

Sama syy tekee Infiniten pyynnöstä mahdollisen: maasto on luettavissa **ennen** valtausta,
koska MapLibre on jo piirtänyt tiilet ruudulle. Mitään ei tarvitse hakea, kuvakaappausta
ei tarvitse ottaa eikä avainta tarvita — `queryRenderedFeatures` lukee saman OSM-datan
josta Google Mapsin kuvakin piirretään, rakenteisena eikä pikseleinä.

**`setStoredTerrain` ei kelpaa tähän.** Se on eksplisiittisesti no-op omistamattomalle
maalle (`cellStore.ts:53-54`: *"Only for cells that already have a stored row"*), ja se
sääntö on oikea — omistamaton maa ei saa kasvattaa tallennetta. Kartoitus tarvitsee oman
rekisterinsä.

## 🟢 GREEN

- [x] `localSurvey.ts`: moduulitason rekisteri (`recordSurvey` · `surveyedTerrainOf` ·
      `clearSurvey` · `surveySize`) — sama kuvio kuin `enableTerrainSurvey`,
      `anchorQuestSites` ja `loadDrawings`: yksi fakta maailmasta, asetettu kerran
- [x] `terrainOf`-ketju: maalattu → käsinkartoitettu → **koneluettu** → hash.
      Koneluku häviää molemmille käsin annetuille vastauksille ja voittaa hashin
- [x] `terrainForCell` koskematon: omistetun solun tallennettu lukema voittaa yhä
      kartoituksen, joten omistettu maa ei muutu session välissä
- [x] `useNearbySurvey`: kun kartta on valmis, lukee pelaajan ympäriltä
      `SURVEY_RADIUS` = 10 rengasta (331 heksaa, ~300 m) ja tallentaa lukemat.
      Ajetaan kerran per sijainti, `surveyed`-joukko estää saman heksan uudelleenluvun
- [x] Vain zoomilla ≥ `SURVEY_MIN_ZOOM` (13): matalammalla `queryRenderedFeatures`
      osuu yleistettyyn geometriaan ja lukisi korttelin järveksi
- [x] Paloitellaan: enintään `SURVEY_CHUNK` = 60 osumatestiä per ruudunpiirto,
      `requestIdleCallback`illa kun sellainen on. Kartan panorointi ei nykäise
- [x] Testit: rekisteri, ketjun järjestys, ja **että valtauspalkkio maksaa kartoitetun
      maaston** — se on tiketin koko RED
- [x] Portti: `check-line-limit`, `tsc -b`, `vitest run`, `pnpm build`

## Todennus

Ketjun järjestys todennetaan kolmella maastolla samalle heksalle: hash sanoo yhtä,
kartoitus toista, maalaus kolmatta — ja `terrainOf` palauttaa aina vahvimman läsnäolevan.
Valtauspalkkio todennetaan `addClaimYield`illa ennen ja jälkeen `recordSurvey`n.

Selainpuolta (`useNearbySurvey`) ei voi yksikkötestata ilman GL-karttaa, sama rajoite kuin
`useTerrainResolver`illa. Sen logiikasta puhdas osa — mitkä heksat luetaan seuraavaksi —
on `pendingSurvey`, ja se testataan erikseen.

## Ei tässä

- **Kartoitusta ei tallenneta levylle.** Se on session mittainen ja rakentuu uudelleen
  bootissa ilmaiseksi: tiilet ovat jo ruudulla, kyse on osumatesteistä eikä verkosta.
  Tallennus vaatisi uuden `GameRepository`-metodin ja migraation, eikä ostaisi mitään.
- **Kuvakaappausanalyysi.** Infinite jätti metodin auki (*"tms."*), ja vektoritiilistä
  lukeminen on sama lähde tarkempana: OSM-tagit eivät ole tulkittuja pikseleitä.
  Käsin annettu kuva on eri asia ja elää `mapData.ts`:n piirroksina — ks. BRDC-MAP-EDIT-001.
