# BRDC-BUILD-011 — Sama hinta neljällä tavalla, kahdella eri kielellä

| | |
|---|---|
| **Alue** | `territory/gateNote.ts`, `BuildPanel.tsx`, `CellPanel.tsx`, `ConsecratePanel.tsx`, `help/wikiPages.ts` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S |
| **Status** | `done` — 2026-09-15 (v0.6.0) |
| **Lähde** | Infinite 2026-09-15: *"kaikki ruudut minttiin ja vastaamaan suunnitelmaa."* |

## 🔴 RED

`costLine` — "mitä tämä maksaa" — oli **neljä kertaa**, ja ne olivat eri mieltä kahdesta
asiasta:

| Tiedosto | Sanat | Erotin |
|---|---|---|
| `BuildPanel.tsx` | **raaka avain** — *"40 wood"* | `, ` |
| `help/wikiPages.ts` (Opas) | **raaka avain** — *"40 wood"* | ` · ` |
| `CellPanel.tsx` | `RESOURCE_WORD` — *"40 timber"* | ` · ` |
| `ConsecratePanel.tsx` | oma `NAME`-taulu (**viides** kopio sanastosta) | ` · ` |

Seuraus näkyy **yhdellä ja samalla solukortilla**: Ward-nappi sanoo *"10 timber"*, ja
rakennusrivi sen alapuolella sanoo *"40 wood"*. Sama resurssi, kaksi nimeä, yksi ruutu.

`BRDC-DETAIL-001` yhtenäisti `RESOURCE_NAME` → `RESOURCE_WORD` solukortissa ja
`CellWorth`issä. Nämä neljä jäivät — ja `ConsecratePanel`in `NAME` oli tasan se taulukko
joka siinä tiketissä poistettiin kahdesta muusta paikasta.

## 🟢 GREEN

- [x] **Yksi `costLine`**, `gateNote.ts`issä `missingPhrase`n vieressä: sama huoli (mitä
      teko maksaa ja miksi se on ulottumattomissa), sama sanataulu, sama tiedosto
- [x] Kaikki neljä lukevat sen; `ConsecratePanel`in viides sanastokopio poistettu
- [x] Erotin ` · `, kuten kolmella neljästä jo oli
- [x] Opas ja peli sanovat nyt saman hinnan samoilla sanoilla — se oli aiemmin
      mahdotonta, koska Opas luki raakaa avainta
- [x] Portti: `lint:lines`, `tsc -b`, 1371 vitest, `pnpm build`, e2e `guide.spec.ts` +
      `opening.spec.ts`

## Todennus

Yksikään e2e ei lukinnut raakaa muotoa (`grep` `wood\b`, `Costs ` e2e-speksejä vasten:
nolla osumaa), joten muutos oli näkyvä mutta ei testattu — mikä on itsessään huomio:
**hintarivin sanamuotoa ei testaa mikään.** Guide- ja opening-speksit ajettiin, koska ne
ovat ne jotka rakentamista ja Opasta ylipäänsä koskettavat.

## Ei tässä

- `refund()`-rivin sanamuoto (*"back"*) — sama funktio nyt, ei erillistä ongelmaa
- Hintojen näyttäminen värillä (`RESOURCE_COLOUR`) rakennuslistassa. Se olisi
  `BRDC-DETAIL-002`:n väälaki laajennettuna tänne, ja kuuluu sen tiketin alle
