# BRDC-QUEST-008 — Tehtävän lopputulos jää kortille

| | |
|---|---|
| **Alue** | `data/adventureStore.ts`, tehtävätietue, `features/quest/` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | — |
| **Lähde** | Infiniten handoff 2026-10-05, F-03 |
| **Status** | `todo` |

## 🔴 RED

Seikkailu tallentaa vain `{stage, done}` — miten se päättyi ja mitä siitä sai, katoaa.

## 🟢 GREEN

- [ ] Tietueeseen lisäävästi `{status: active|completed|failed, outcome?: {rewards, text, completedAt}}`
- [ ] Valmis kortti himmennetty, sinetti, lopputulos ja palkinnot luettavissa
- [ ] Reloadin jälkeen yhä näkyvissä (e2e)
- [ ] Vanha tallennus aukeaa muuttumattomana
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Tehtävämoottori (QUEST-009).
