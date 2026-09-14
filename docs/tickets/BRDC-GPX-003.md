# BRDC-GPX-003 — Imported hexes did not become the player's

| | |
|---|---|
| **Alue** | `features/gpx/NewLands.tsx`, `GpxPanel.tsx`, `useGpxImport.ts`, `repository.revealCell` |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `todo` — raportoitu, ei vielä diagnosoitu |
| **Lähde** | Infinite 2026-09-15: *"importista tulleet heksat eivät tulleet mulle.. korjataan myöhemmin."* |

## 🔴 RED

`.gpx`-tiedoston tuonnin jälkeen (`BRDC-GPX-002`, `NewLands.tsx`) pelaaja avasi uudet
maa­kortit — joko yksi kerrallaan tai kaikki kerralla — mutta heksat eivät päätyneet
pelaajan omistukseen. Ei vielä toistettu, ei vielä kavennettu.

Ei diagnoosia vielä — kirjattu vain jottei katoa. Katsottava ensin: kulkeeko
`NewLands`in `repository.revealCell`-kutsu samaa polkua kuin `LandsPanel`in oma
paljastus (jonka pitäisi olla identtinen, `BRDC-GPX-002`in oman kuvauksen mukaan), ja
kirjaako se todella omistajan vai vain paljastuksen ilman omistusta.

## Ei tässä

Diagnoosi ja korjaus — Infiniten oma päätös siirtää myöhemmäksi. Ei kosketa
GPX-tuonnin muuta polkua (`useGpxImport.ts`) tämän tiketin puitteissa ennen
diagnoosia.
