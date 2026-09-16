# BRDC-HALL-001 — Retire a kingdom on purpose; it keeps a place in the Hall of Fame

| | |
|---|---|
| **Alue** | `packages/core/src/data/hallOfFameStore.ts`, `MockRepository.ts`, `features/hud/Sanctum.tsx`, `features/hall/`, `features/hud/SettingsMenu.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Riippuvuudet** | `resetAll` (BRDC-PERSIST-002), `demographics.ts`/`nation.ts` (BRDC-CODEX-001, BRDC-NATION-001) |
| **Status** | `done` — 2026-09-16 (v0.6.42) |

## 🔴 RED

Infiniten pyyntö 2026-09-16, samassa viestissä kuin BRDC-SEED-005:n vaatimus:
*"Note myös haluan, että tehdään myös highscore lista, mille pääsee kun tekee retire
kingdom ja aloittaa uuden.. nämä kuningaskunnat säilyvät hienoss hlal of fame taulussa,
mikä kertoo saavutukset ja demografiat mitä on saatu aikaiseksi."*

Pelissä oli jo yksi tapa lopettaa: "Delete progress" (`Sanctum.tsx`), joka on tarkoituksella
paniikkinappi — dialogi sanoo suoraan *"nothing is kept anywhere else"* ja `resetAll()`
todella tekee `store.clear()`in, mitään talteen ottamatta. Kuningaskunnan **tarkoituksellinen**
lopettaminen ei ollut sama teko: se on suunniteltu, positiivinen valinta, ja se mitä
kuningaskunnasta tuli on säilyttämisen arvoista — mutta mikään ei säilynyt kertaakaan
`resetAll()`in läpi.

Suluissa oleva jatko-osa — *"tällä myöhemmin tehdään niin, että jos aloittaa alusta, saa
uudet ominaisuudet, jos jatkaa vanhaa, joutuu taistelemaan vanhoilla tavoilla"* — on
Infiniten oma merkintä **myöhemmäksi**. Tässä tiketissä ei ole mitään pelimekaanista eroa
sillä jatkaako vanhaa vai aloittaako uuden; se on tuleva tiketti.

## 🟢 GREEN

- [x] `HallOfFameEntry` ja `retireKingdom`/`readHallOfFame` (`packages/core/src/data/
      hallOfFameStore.ts`) — puhdas kerros `KeyValueStore`in päällä, ei riipu
      `MockRepository`ista. `retireKingdom` laskee: taso ja XP (`levelState`), solumäärä,
      pinta-ala (`totalAreaM2`), väestö ja provinssit (`nation.ts`), sekä saavutusten,
      löydettyjen salaisten paikkojen, ihmeiden ja kirjainsirpaleiden **lukumäärät** — ei
      listoja, koska Hall of Fame on yhteenveto, ei toinen kopio joka voi eriytyä
      alkuperäisestä
- [x] Arkisto selviää täsmälleen samasta pyyhkäisystä jonka `resetAll` jo tekee: entry
      lasketaan, koko `store.clear()` ajetaan, ja **vasta sitten** arkisto (edellinen +
      uusi entry) kirjoitetaan takaisin yhteen avaimeen (`K.hallOfFame`). Ei uutta
      IndexedDB-objectstorea, ei `DB_VERSION`-nostoa — sama `KeyValueStore`-rajapinta jota
      jokainen muukin store käyttää
- [x] `resetAll()` **koskematon**. "Delete progress" ei koskaan luo Hall of Fame -riviä —
      se on yhä aito paniikkinappi, ei toinen reitti retiroida
- [x] `GameRepository.retireKingdom(now)` / `.getHallOfFame()`, toteutettu
      `MockRepository`issa
- [x] `RetireDialog` (`Sanctum.tsx`) — oma vahvistus, ei "Delete progress"in kopio: kertoo
      että kuningaskunta liittyy Hall of Fameen ennen pyyhkäisyä. `SanctumDialogsProps.
      confirming` laajennettu `'retire'`-arvolla; sama `clearAll()` + reload -reitti
- [x] `HallOfFamePanel` (`features/hall/`) — sama arkkipohja kuin `LandsPanel`/`CodexPanel`,
      uusin kuningaskunta ensin, tyhjä tila kun mitään ei ole vielä retiroitu
- [x] "Hall of Fame" uusi kohde ☰-valikon "Go to" -ruudukossa; "Retire this kingdom" uusi
      rivi Advancedissa, **ei** `--danger`-tyylillä — se on suunniteltu teko, ei virhe jota
      pelataan takaisin
- [x] Portti: `lint:lines`, `tsc -b`, **1597** vitest (+8: 6 `hallOfFameStore.test.ts`, 2
      `MockRepository.test.ts`), `pnpm build`, `e2e/dialogs.spec.ts` +2 (mobile-360, 15/15)

## Todennus

`hallOfFameStore.test.ts`: entryn kentät oikein lasketuista soluista/profiilista; olemassa
olevat saavutus/löytö/ihme/sirpale-avaimet lasketaan oikein; arkisto säilyy `store.clear()`in
yli ja kasvaa peräkkäisillä retiroinneilla (`['first','second']` järjestyksessä); tyhjä
kuningaskunta retiroituu ilman virhettä. `MockRepository.test.ts`: kokonainen kävely →
XP → retire → `getOwnedCells` tyhjä, profiili nollattu, `getHallOfFame()` sisältää juuri
tehdyn entryn; kaksi peräkkäistä retirointia säilyttää molemmat.

`e2e/dialogs.spec.ts`, oikeassa selaimessa (mobile-360): dialogi kertoo Hall of Famesta ja
peruminen jättää kaiken ennalleen; koko kierros — Hearth hyväksytty → retire → uudelleenlataus
→ `localStorage`ista ei jää `es3:`-avaimia → uusi Hearth hyväksytään → Hall of Fame ei enää
sano "No kingdom has retired yet". Yksi löydös matkalla: ensimmäinen versio käytti paljasta
`getByRole('dialog')`ia, joka osui myös `UnlockMoment`in ei-modaaliin opetustoastiin — korjattu
nimeämällä lukija dialogin omalla otsikolla.

## Ei tässä

- **Ei pelimekaanista eroa vanhan/uuden kuningaskunnan välillä.** Infiniten oma merkintä:
  *"myöhemmin"*. Tämä tiketti tekee vain arkiston ja retiroinnin
- **Ei lippua/sigiiliä entryssä.** Ne asuvat `localStorage`issa sovelluskerroksessa
  (`nation.ts`, `avatarIds.ts`), joita `packages/core` ei lue. Nimi, taso ja demografiat
  kertovat jo kuningaskunnasta; visuaalinen tunnus on mahdollinen jatko jos kentältä
  pyydetään
- **Ei laitteiden välistä jakoa.** Hall of Fame on paikallinen tälle laitteelle, samoin
  kuin kaikki muukin Vaihe 0–4:n data — ei riippuvuutta jaetusta maailmasta tai Workerista
