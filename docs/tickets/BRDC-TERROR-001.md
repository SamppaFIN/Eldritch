# BRDC-TERROR-001 — Kaupungin kauhu

| | |
|---|---|
| **Alue** | Worker (`apps/worker`), `realmBonus`, kylät |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | DOOM-001, SHARE-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B4; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Sanity on per valtakunta. Arkham Horrorin kauhuraita on koko kaupungin tila, joka sulkee kauppoja — yhteinen paine.

## 🟢 GREEN

- [ ] Jaettu kauhuraita (0–10) Workerissa: avoimet portit nostavat, suljetut laskevat; client näyttää sen HUDissa
- [ ] Kauhu ≥ 5: kylien kauppa kalliimpi; ≥ 8: Marketit −25 % (oletus) — tulee hex-kortille rivinä
- [ ] Ilman Workeria kauhu = 0 (ei koskaan riipu verkosta)
- [ ] Puhdas `terrorEffects(level)` + testit
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kauhun vaikutus yksittäisten pelaajien sanityyn.
