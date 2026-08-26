# BRDC-SETUP-001 — Monorepo, pnpm workspaces, TS strict

| | |
|---|---|
| **Vaihe** | 0 — Perustus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SEC-000 |
| **Status** | `done` — 2026-08-26 |
| **Valmius** | 100 % |

## 🔴 RED

Repoa ei ole. Ei buildia, ei tyyppitarkistusta, ei testiajuria.

## 🟢 GREEN

- [x] `pnpm install` menee läpi puhtaana repon juuressa
- [x] `pnpm typecheck` menee läpi — TypeScript **strict**, ei `any`-poikkeuksia
- [x] `pnpm test` ajaa Vitestin (0 testiä, mutta ajuri toimii)
- [x] `pnpm build` tuottaa `apps/game/dist/`in
- [x] `pnpm dev` avaa devipalvelimen
- [x] `packages/core` ei importtaa yhtään riippuvuutta — puhdas TS
- [x] Sama build toimii sekä alipolussa (Pages) että juuressa (Capacitor):
      `base` tulee `VITE_BASE_PATH`-ympäristömuuttujasta

## Toteutus

```
eldritch-sanctuary-v3/
├── package.json              # workspaces: apps/*, packages/*
├── pnpm-workspace.yaml
├── tsconfig.base.json        # strict: true
├── CLAUDE.md                 # files/CLAUDE.md
├── apps/game/                # React 19 + TS + Vite. Myös Capacitorin webDir
│   ├── vite.config.ts        # base: process.env.VITE_BASE_PATH ?? '/'
│   └── src/
│       ├── app/              # reititys, providerit
│       ├── features/         # map/ trail/ territory/ hud/
│       └── main.tsx
├── packages/core/            # geo/ rules/ sim/ types/ — puhdas TS, vitest
├── packages/ui/              # jaetut komponentit + styles/tokens.css
├── supabase/                 # migrations/ seed/ — ei käytössä ennen Vaihetta 3
└── docs/tickets/ docs/backlog/
```

**Riippuvuudet (vain nämä, älä lisää muita kysymättä):**
`react` 19 · `react-dom` · `vite` · `@vitejs/plugin-react` · `typescript` ·
`vitest` · `zustand` · `@tanstack/react-query` · `vite-plugin-pwa`

**Reititys:** `HashRouter`. GitHub Pages ei tue history-API-reititystä ilman
404-kikkailua, ja Capacitor toimii `file://`-protokollalla.

## Testit

`pnpm typecheck && pnpm test` — molemmat vihreinä. Tämä on tästä eteenpäin
**jokaisen tiketin** valmistumisehto (`files/CLAUDE.md` sääntö 7).

## Ei kuulu tähän tikettiin

Supabase-klientti, MapLibre, h3-js, Capacitor. Ne tulevat omissa tiketeissään.
Vaiheet 0–2 eivät koske kantaan ollenkaan.

## Lähde

`PROMPTS.md` Vaihe 0 · `files/CLAUDE.md` §Stack, §Layout
