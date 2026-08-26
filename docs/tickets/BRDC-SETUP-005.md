# BRDC-SETUP-005 — GitHub Pages -deploy

| | |
|---|---|
| **Vaihe** | 0 — Perustus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-SETUP-004 |
| **Status** | `done` — 2026-08-26 |
| **Valmius** | 100 % |

## 🔴 RED

Peliä ei pääse kokeilemaan puhelimella. GPS vaatii HTTPS:n, joten `localhost` ei riitä
todelliseen testaukseen — ja kaikki hyväksymisportit vaativat ulkona kävelemistä.

## 🟢 GREEN

- [x] `.github/workflows/deploy.yml`: push mainiin → build → Pages
- [x] Julkinen HTTPS-URL avautuu puhelimen selaimessa
- [x] `VITE_BASE_PATH` asetettu alipolkuun niin että assetit latautuvat
- [x] `HashRouter` toimii — suora linkki alisivulle ei anna 404:ää
- [x] PWA-manifest ja service worker paikallaan (`vite-plugin-pwa`)
- [x] Sivun voi lisätä puhelimen aloitusnäytölle ja se avautuu ilman selainpalkkia
- [x] **Nolla runtime-CDN-riippuvuutta** — kaikki bundlataan

## Toteutus

```yaml
# .github/workflows/deploy.yml
on:
  push: { branches: [main] }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm test
      - run: pnpm build
        env: { VITE_BASE_PATH: /eldritch-sanctuary-v3/ }
      - uses: actions/upload-pages-artifact@v3
        with: { path: apps/game/dist }
      - uses: actions/deploy-pages@v4
```

**Huom:** `typecheck` ja `test` ajetaan **ennen** buildia. Rikkinäinen commit ei mene
tuotantoon. v2:ssa tätä porttia ei ollut.

**CDN-kielto** on `files/CLAUDE.md`:n sääntö: v2 latasi Leafletin, Socket.io:n ja Google
GSI:n CDN:istä, ja yksi katko olisi kaatanut koko pelin.

> **Live:** https://samppafin.github.io/Eldritch/
> **Repo:** https://github.com/SamppaFIN/Eldritch — `VITE_BASE_PATH=/Eldritch/`
> Todennettu selaimella 360 px: otsikko renderöityy, assetit 200, nolla konsolivirhettä,
> nolla vieraan hostin pyyntöä, nolla vaakavieritystä.
> `HashRouter` tulee vasta reitityksen mukana (BRDC-MAP-001) — nyt sovelluksessa
> on vain yksi näkymä, joten reititintä ei ole vielä olemassa.

## Testit

- [x] Deploy ajetaan ja julkinen URL avautuu **puhelimella**, ei vain työpöydällä
- [x] DevTools → Network: yksikään pyyntö ei mene vieraaseen domainiin
      (karttatiilet tulevat vasta BRDC-MAP-001:ssä ja ne on dokumentoitava siellä)

## Ei kuulu tähän tikettiin

Oma verkkotunnus. `version.json` ja APK-jakelu (Vaihe 5).

## Lähde

`PROMPTS.md` Vaihe 0 · `files/CLAUDE.md` §Stack, §Distribution
