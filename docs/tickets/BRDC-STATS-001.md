# BRDC-STATS-001 — Tilastot ja tuotantoennuste

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-BUILD-002, BRDC-INSPECT-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (T1–T3) |

## 🔴 RED

`dominionOf` laskee jo läänin luvut, ja `BRDC-INSPECT-001` näyttää ne. Mutta se kertoo
**mitä on nyt**, ei mihin ollaan menossa. Kymmenen resurssin ja kuudentoista rakennuksen
taloudessa pelaaja ei voi päättää mitään ilman ennustetta.

## 🟢 GREEN

- [ ] **Tuotantoennuste**: mitä lääni tuottaa tunnissa ja vuorokaudessa, resurssikohtaisesti
- [ ] Ennuste **ottaa huomioon lepotilan ja katon** (`BRDC-ECON-001`) — muuten se
      lupaa lukuja, joita pelaaja ei koskaan näe, ja se on pelin valhe
- [ ] **"Milloin minulla on varaa"** — aika seuraavaan haluttuun rakennukseen
- [ ] Heksakohtaiset tilastot: mitä tämä solu on tuottanut, kuinka kauan omistettu,
      montako kertaa vaihtanut omistajaa (`BRDC-HEX-001`)
- [ ] **Varoitukset ovat toimintoja**, eivät lukuja: *"3 solua haipuu huomenna"* avaa ne
      — `BRDC-INSPECT-001` teki tämän jo oikein, ja se malli jatkuu
- [ ] Kaikki laskenta **puhtaana funktiona** kuten `dominionOf`
- [ ] Luettavissa 360 px:llä ilman vaakavieritystä

## Toteutus

`dominionOf` on tämän oikea koti; se on jo puhdas ja testattu, ja
`BRDC-INSPECT-001` kirjoitti sen syyn auki:

> *"useampi näistä luvuista on helppo saada hienovaraisesti väärin — tuottoluku joka
> laskee mukaan tuottamattomat solut, tai 'heikoin' joka valitsee solun jonka Tyhjyys
> on jo ottanut. Väärä luku tässä luetaan pelin valheena."*

Sama vaatimus, isommalla taloudella: **ennuste, joka ei vastaa toteumaa, on pahempi
kuin ei ennustetta.** Testi ajaa ennusteen ja kelaa kellon eteenpäin — ennusteen ja
toteuman on täsmättävä.

`dominion.ts` ja `MockRepository.ts` (395/400 riviä) ovat molemmat lähellä rajaa.
Tämä tiketti jakaa ne ennen kuin lisää mitään.

## Ei tässä

- Kaaviot ja historialliset käyrät. Luku riittää; käyrä on työtä ilman päätöstä
- Vertailu muihin pelaajiin. Codex of Dominion, `BRDC-SHARE-001`
