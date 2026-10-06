# BRDC-ADJ-001 — Naapuribonukset Worksille

| | |
|---|---|
| **Alue** | `rules/adjacency.ts`, `rules/hexYield.ts` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S |
| **Riippuvuudet** | YIELD-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A2; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Works tuottavat saman minne tahansa ne rakentaa (aura ja reach poislukien). Civ VI:n district-naapuribonus tekee sijoittelusta päätöksen — meillä sijoittelu ei merkitse.

## 🟢 GREEN

- [ ] Puhdas `adjacencyBonus(cell, owned)`: taulukko (oletus) — Farm järvi/rannikko-naapuri +1 food, kaksi samaa Workia vierekkäin +1 omaa tuotettaan, Library temppelin vieressä +2 wisdom, Market toisen Marketin/kylän vieressä +1 gold
- [ ] Uusi `YieldSource` `adjacency`; hex-kortti näyttää rivin "Neighbours: …" ja settle maksaa saman (golden-testi: kortti = settle)
- [ ] Season 2: bonus vain miehitetyllä Workilla, kuten muukin tuotto
- [ ] Rakennuslista kertoo ennen rakentamista paljonko naapurit antaisivat ("+1 from the lake")
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Uudet rakennukset; naapuribonus rivaalien heksoista.
