# BRDC-BUILD-013 — Forge ja Watchtower

| | |
|---|---|
| **Alue** | `rules/build.ts`, `types/domain.ts`, `data/buildStore.ts`, `data/MockRepository.ts`, nimet/glyfit/kuvakkeet |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — Forge ajettu ja todennettu; Watchtower siirretty |
| **Riippuvuudet** | `BRDC-TERRAIN-005`, `BRDC-BUILD-012` (Linnoituksen mittaukset) |
| **Lähde** | `worldseed.ts` (`STRUCTURES`) |

## 🔴 RED

Worldseed nimeää kaksi rakennusta joita pelissä ei ollut: **Forge** (hill/settlement, +2 iron,
tarvitsee Toolmakingin ja viereisen raudan) ja **Watchtower** (hill/plain, paljastaa 2 rengasta,
puolittaa kilpailijan piirityksen).

## 🟢 GREEN — Forge

- [x] `forge` lisätty `BuildingId`iin ja `BUILDINGS`-tauluun: maasto `['hill','settlement']`,
      tech `toolmaking`, tuotto `+2 iron`, hinta `{wood:30, stone:40}` (verrattu `mine`in
      `{wood:40,stone:40}`iin — halvempi, koska tuottaa vähemmän ja maastovaihtoehtoja on kaksi)
- [x] **Viereinen rauta, todella tarkistettu:** uusi `Building.needsIronAdjacent` +
      `BuildContext.ironAdjacent`, sama malli kuin Library/Temple Groven `needsPlace`/
      `templeAdjacent`. `ironAdjacentTo(h3, owned)` (`data/buildStore.ts`, puhdas, oma
      testinsä): tosi kun rengasnaapuri on luonnostaan vuori-maastoa **tai** naapurissa
      seisoo jo Mine — kumpikaan ei vaadi naapurin omistamista raudan itsensä osalta
- [x] `MockRepository.build()` laskee ja välittää sen todelliselle naapurirenkaalle, samalla
      tavalla kuin temppelin läheisyys jo laskettiin
- [x] Kuva (`buildingSprites.ts`): alasin + pieni liekki — oma siluetti, ei sekoitu Mineen
      tai Quarryyn. Rooli `produce` (`buildingGlyphs.ts`), nimi "Forge", kuvaus
      catalogue.tsx:ssä
- [x] Testit: `build.test.ts` (kova este puuttuvalle raudalle), `buildStore.test.ts`
      (4 uutta, `ironAdjacentTo` eristettynä, oikeilla H3-heksoilla — mountain-naapuri,
      ei-mountain-naapuri jolla Mine, ei-naapuri jolla Mine). Regressio: `build.test.ts`in
      oma rakennuslista ja `catalogue.test.ts`in `techUnlocks('toolmaking')` päivitetty
      vastaamaan uutta, oikeaa käytöstä (toolmaking avaa nyt Forgen suoraan)
- [x] Sivutuote: `MockRepository.ts` oli kasvanut 408 riviin — `ironAdjacentTo` siirrettiin
      `buildStore.ts`hen (jossa se kuuluukin, rakennuslogiikan viereen), tiedosto takaisin
      399 riviin ilman että mitään rajattiin

## Ei tehty — Watchtower

**Ei lisätty `BuildingId`iin.** Molemmat sen määrittelevät vaikutukset ovat aidosti uusia
järjestelmiä eikä kumpaakaan ole:

- **"Paljastaa 2 rengasta"** — pelissä ei ole yhtään rakennusta joka paljastaisi pysyvän
  säteen sumun (kaikki nykyiset aura-rakennukset, mm. Lighthouse, antavat resurssibonuksen,
  eivät poista sumua). Uusi ominaisuus `reveal.ts`/`revealStore.ts`hen
- **"Puolittaa piirityksen"** — `resolveCapture`in `defence`-parametri on **kiinteä
  vähennys** hyökkäysvoimasta (Linnoituksen malli), ei kerroin. Puolitus vaatisi joko uuden
  parametrin jaettuun taistelufunktioon (jota myös oikea peli kutsuu, ei vain simulaatio)
  tai muun ratkaisun — ja tiketin oma RED sanoi jo tämän vaativan mittausta ennen kytkentää
- **Kumuloituuko Linnoituksen kanssa? Tiketti kysyy tätä Infiniteltä eksplisiittisesti** —
  tämä ei ole tekninen yksityiskohta jonka voisin päättää itse, vaan pelitasapainokysymys
  ("voiko Linnoituksesta tulla käytännössä valloittamaton") jota en voi pelitestata

Rakentaminen ilman toimivaa vaikutusta olisi näyttänyt valmiilta ollematta — täsmälleen se
minkä CLAUDE.md §4.5 kieltää.

## Päätös Infiniteltä

- Watchtower: puolittaako piiritystä ainoastaan omalla heksallaan, vai reagoiko myös
  naapureihin kuten Linnoitus? Kumuloituuko Linnoituksen kanssa?
- Watchtowerin hinta (dokumentti ei anna)

## Ei tässä

- Muut Worldseedin rakennukset ovat jo pelissä (granary, sawmill, quarry, market)
