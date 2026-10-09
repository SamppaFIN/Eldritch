# BRDC-ART-008 — Grafiikkaa korteille

| | |
|---|---|
| **Alue** | `DiscoveryModal.tsx`, `DreamCard.tsx`, `MythosHeadline.tsx`, `GreatBirth.tsx`, uusi `CardArt.tsx` |
| **Vaihe** | 3 — Season 3 (haara `season-3`) |
| **Effort** | S–M |
| **Riippuvuudet** | BRDC-UX-002 (yksi reunakortti kerrallaan) |
| **Lähde** | Infinite 2026-10-09: *"sitten sen jälkeen tehdään graafinen päivitys.. lisätään hieman grafiikkaa korteille"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

- "New ground" -löytökortti nimeää maaston ("Forest", "Lake") mutta näyttää jokaiselle saman
  heksamandalan. ART-001:n lupaus *"kuva heksan tyypistä isona paljastuskortissa"* on yhä auki,
  vaikka maaston taide on jo olemassa kartalla (`terrainTextures.ts`, `terrainSprites.ts`).
- Kauden 3 reunakortit — uni, Mythos-otsikko, suurhenkilön syntymä — ovat pelkkää tekstiä;
  vain Eureka-kortilla on sigilli.

## 🟢 GREEN

- [x] Löytökortissa maaston oma kuva: kartan tekstuuri heksan muotoon leikattuna, isometrinen
      maastolaatta päällä ja mandala kehyksenä piirtymässä — sama taide kuin kartalla, ei uutta piirrosta — `GroundArt` (`CardArt.tsx`); kehyksenä kaksi piirtyvää heksareunaa (koko mandala risteili laatan yli, kokeiltu ja hylätty); step-claim.spec tarkistaa ja kuvaa (`newground.png`, Still water)
- [x] Unikortille, Mythos-kortille ja syntymäkortille kullekin oma tunnus: inline-SVG, stroke ei fill,
      rakennettu säännöstä (monikulmio/kehä), piirtyy `stroke-dasharray`illa — kuunsirppi kahdesta ympyrästä + kolme tähteä; {5/2} kehässä + silmä; {8/3} kaksoiskehässä. `polygram` testattu
- [x] Jokaisella SVG:llä/kuvalla `width`/`height`; `prefers-reduced-motion` kunnioitettu
- [~] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; 360 px kuvakaappaus jokaisesta kortista — portti vihreä (2154 testiä); 360 px pelissä: uni- ja löytökortti. Mythos- ja syntymätunnus kuvattu erillisrenderöintinä, ei pelin sisällä

## Ei tässä

Kartan grafiikka, liput, loitsuefektit (ART-001). Uusia värejä ei keksitä (§13).

## Sivulöytö

Unikortti katosi kesken lauseen: kohtaamisen jälkeen alueen päivitys luki unen uudelleen, löysi sen ratkaistuksi ja vei kortin ennen kuin loppua ehti lukea (dream.spec punainen). Kortti pysyy nyt kunnes se kuitataan.
