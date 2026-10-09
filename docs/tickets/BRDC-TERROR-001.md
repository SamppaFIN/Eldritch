# BRDC-TERROR-001 — Kaupungin kauhu

| | |
|---|---|
| **Alue** | Worker (`apps/worker`), `realmBonus`, kylät |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | DOOM-001, SHARE-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B4; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-09, haara `season-3`) — vaatii Workerin deployn kauden 3 avautuessa |

## 🔴 RED

Sanity on per valtakunta. Arkham Horrorin kauhuraita on koko kaupungin tila, joka sulkee kauppoja — yhteinen paine.

## 🟢 GREEN

- [x] Jaettu kauhuraita (0–10) Workerissa: avoimet portit nostavat, suljetut laskevat; client näyttää sen HUDissa — `Season.terror`, liikkuu samoilla porttiviesteillä kuin Doom (`/season/doom`: 48 h auki +1, sinetöinti −1, kerran kumpaankin suuntaan per portti; testattu Worker-reitin läpi); HUD-nauhassa "Terror 8/10"
- [x] Kauhu ≥ 5: kylien kauppa kalliimpi; ≥ 8: Marketit −25 % (oletus) — tulee hex-kortille rivinä — kauppa: kylä pitää 40 % (oletus 25 %), näkyy laiturin tekstissä; Market: rivi "Terror" −25 % hexin omasta kullasta, settle lukee saman rivin
- [x] Ilman Workeria kauhu = 0 (ei koskaan riipu verkosta) — `useTerror` palauttaa 0 ilman kautta; store lukee `K.mythos.terror`
- [x] Puhdas `terrorEffects(level)` + testit — `terror.test.ts`, `apps/worker/src/terror.test.ts`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — e2e `terror.spec.ts` 360 px. Sivulöydös: `mythos.spec.ts`:ssä oli kilpailu (reload ennen kuin luettu-merkintä ehti tallentua), tuli esiin tällä kierroksella — testi odottaa nyt tallennusta, 4/4

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kauhun vaikutus yksittäisten pelaajien sanityyn.
