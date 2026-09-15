# BRDC-TECH-004 — Ruudut sanovat vielä asioita jotka eivät pidä paikkaansa

| | |
|---|---|
| **Alue** | `territory/ResearchPanel.tsx`, `log/LogPanel.tsx`, `territory/gateNote.ts`, `keep/KeepTemples.tsx`, `territory/CellPanel.tsx` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | S |
| **Status** | `done` — 2026-09-15 (v0.5.98) |
| **Lähde** | Infinite 2026-09-15: *"ensimmäisenä täytyy saada kaikki ruudut minttiin ja vastaamaan suunnitelmaa."* |

## 🔴 RED

Systemaattinen haku kaikilta paneeleilta, ei yhden ruudun lukeminen kerrallaan. Etsittiin
niitä vikaluokkia jotka tämä sarja on jo kerran löytänyt muualta: kahdennetut taulukot,
hover-selitykset, vanhentunut ohjeteksti.

### 1. Tutkimusruutu neuvoi kahdesti väärin — juuri kun pelaaja on jumissa

```
Wisdom comes from a Library, or from channelling mana at the Altar — the Mana tab.
```

Rivi näkyy **täsmälleen silloin kun jokainen tutkimus on liian kallis** — hetkellä jolloin
neuvon on pakko olla oikea. Se oli väärin kahdella tavalla:

- **"channelling mana at the Altar"** — `PIVOT-2026-09-09 P3` poisti kanavoinnin.
  `useKeepEconomy.ts:7` sanoo sen suoraan: *"so channelling is gone"*. Peli neuvoi tekoa
  jota ei ole olemassa
- **"the Mana tab"** — se on Keepissä, ja `BRDC-KEEP-007` siirsi Researchin **pois**
  Keepistä omaan dialogiinsa. Neuvo osoitti paikkaan johon tästä ruudusta ei pääse
  sulkematta sitä ensin

### 2. Historia käski kävelemään lenkin

`LogPanel`in tyhjä tila: *"Nothing has happened yet. Walk a loop."*

`BRDC-CLAIM-009` (2026-09-02) käänsi valtausmallin: maa otetaan **astumalla** viereiseen
heksaan, ja lenkin sulkeminen on `Settings.loopClosure`in takana **pois päältä
oletuksena**. Uusi pelaaja luki ensimmäisenä ohjeen tehdä se ainoa asia jota peli ei
häneltä enää pyydä.

### 3. Temppelin laajennus piti kahta kopiota samasta tekstistä

Kolmesta rivistä **kaksi oli merkilleen identtisiä** kahdessa tiedostossa, ja kolmas sanoi
saman säännön kahdesti eri sanoin:

| avain | `KeepTemples` | `CellPanel` |
|---|---|---|
| `not-a-temple` | *"That place is not a temple."* | *"Only a temple can be expanded."* |
| `at-max` | identtinen | identtinen |
| `cannot-afford` | identtinen | identtinen |

Tyyppi oli kolmessa paikassa (`useSelection.ts`, `CellPanel`, `KeepTemples` inline).
Tämä on vanhan suunnitelman **D5**, jonka `BRDC-KEEP-008` näki ja siirsi eteenpäin sen
sijaan että olisi arvannut.

## 🟢 GREEN

- [x] Tutkimusruutu sanoo mistä viisaus **oikeasti** tulee: Library, ja jokainen paikka
      jonka omistat — Anchor tai temppeli maksaa viisautta joka tunti pyytämättä
- [x] Historian tyhjä tila käyttää samoja sanoja kuin `LandsPanel`in oma: *"Walk into the
      hex beside you."* Sama ensimmäinen teko, sama lause
- [x] `EXPAND_REFUSAL` ja `ExpandFail` **yhdessä paikassa**, `gateNote.ts`issä — jonka oma
      docstring on jo *"Why an action is out of reach, said next to the button"*. Kaksi
      taulukkoa ja kolme tyyppimäärittelyä → yksi kumpaakin
- [x] Portti: `lint:lines`, `tsc -b`, 1371 vitest, `pnpm build`

## Mitä haettiin ja mitä *ei* löytynyt

Yhtä tärkeää kuin löydöt — nämä tarkistettiin ja ovat kunnossa, eli vanha suunnitelma on
niiltä osin vanhentunut:

- **ESC sulkee jokaisen arkin.** Vanha `BRDC-UI-001`in RED väitti `CellPanel`in ja
  `HearthPanel`in olevan ainoat ilman sitä; molemmilla on `useEscape` nyt. Ainoat ilman
  ovat `Hud` (alapalkki) ja `Hearth` (aloitusvalinta), eikä kumpaakaan suljeta
- **Hover-selitykset**: vain `Vigil`illa on `title`, ja sillä on sama teksti
  `aria-label`issa — täydentävä, ei ainoa kanava. `LandsPanel`in oma korjattiin jo
  (`BRDC-LANDS-003`)
- **Yhdeksän `REFUSAL`-taulukkoa** ei ole kahdennus: jokainen on oman mekaniikkansa oma,
  ja jokainen sanoo mitä *sille* kustannukselle pitää tehdä (§14 ch.3). Vain temppelin
  laajennus oli aidosti kahdessa paikassa
- `catalogue.tsx`in `GROUND` ei ole viides maastonimitaulukko vaan resurssi → maasto
  -käännös (*"every forest you hold"*), eri asia

## Ei tässä

- `consciousness.ts`in taso-6 lore: *"The loop you walked did not just close — it took."*
  Se on **sisältöä, ei käyttöliittymää** (§14 vapauttaa loren), ja se on Infiniten proosaa
  — mutta se kertoo pelaajalle hänen omasta menneisyydestään asian joka ei oletusasetuksilla
  tapahtunut. Kirjattu tähän, ei korjattu: kirjailijan päätös
