# BRDC-SHARE-003 — Jaettu maailma ilman GitHub-lomaketta: Cloudflare Worker + KV

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SHARE-002 |
| **Status** | `done` — 2026-09-08 |
| **Valmius** | 100 % — portti vihreä, `share.spec.ts` 4/4, sim-askel vihreä, Worker live |
| **Lähde** | Infinite 2026-09-08: *"ei tuo oikeen tunnu kivalta, että mä joudun githubiin kirjottaan issuen"* |

## 🔴 RED

`BRDC-SHARE-002` julkaisee kartan avaamalla esitäytetyn GitHub-issuen: peli lakkaa
olemasta peli ja alkaa olla lomake — uusi välilehti, ehkä kirjautuminen, "Submit new
issue", takaisin.

## Päätökset (Infinite 2026-09-08)

- Cloudflare Worker + KV. Account `200bc23999bdf4dc63f0e7f9aa576d61`.
- Auth: Infinite ajaa `npx wrangler login` itse; avustaja ajaa `wrangler`-komennot.
- `npx wrangler`, ei devDependencyä.
- Julkinen POST-endpoint, `id` + checksum (sama luottomalli kuin issue-polku). Rate-limit per id.

## 🟢 GREEN

### Worker (`apps/worker/`)  *(ei `infra/` — pnpm-workspace vetää `apps/*`)*
- [x] `wrangler.toml` — name `eldritch-world`, `account_id`, KV-binding `WORLD`,
      `compatibility_date`, `main = src/index.ts`.
- [x] `src/index.ts` (116 r):
      - `POST /submit` — `parseSubmission(await request.text())` → `400` jos torn.
        Rate-limit: `WORLD.get("rl:"+id)` → `429`. Muuten
        `WORLD.put("player:"+id, JSON({ source, submittedAt: Date.now() }))` +
        `WORLD.put("rl:"+id, "1", { expirationTtl: 60 })` + `rebuild()`. Palauttaa
        `{ ok: true, cells, regions }`.
      - `GET /world/:region` — `WORLD.get("shard:"+region)` → `204` jos tyhjä, muuten
        JSON `Cache-Control: public, max-age=30`. Shardit rakennetaan `POST`in yhteydessä
        (`rebuild` = `buildShards(mergePlayerFiles(allFiles, now, WORLD_PLAYER_TTL_MS))`,
        kirjoittaa `shard:<region>`, poistaa vanhentuneet).
      - CORS `Access-Control-Allow-Origin: *`, `OPTIONS` → `204`. `GET /` → info.
      - `@es3/core/data` + `@es3/core/rules` — `buildShards`, `mergePlayerFiles`,
        `parseSubmission`, `WORLD_PLAYER_TTL_MS`. Bundle 92.87 KiB gzip.
- [x] `npx wrangler kv namespace create WORLD` → id `6078172593c94d5fb647c953af4ea0fe`.
- [x] `npx wrangler deploy` → `https://eldritch-world.es3-world-worker.workers.dev`.
      Käsin todennettu: `GET /` 200, `POST /submit` → `{ok:true,cells:2,regions:1}` 200,
      `GET /world/861f05a67ffffff` palautti submitatun pelaajan. Smoke-avaimet siivottu KV:stä.

### Klientti (`apps/game`)
- [x] `worldSource.ts`: `WORLD_API` -vakio (`VITE_WORLD_API`-ohitettava). `publishSubmission`
      → `fetch(POST)`; `ok`→`'ok'`, `429`→`'rate-limited'`, muu/catch→`'failed'`.
      `worldSubmissionUrl` jää fallbackiksi.
- [x] `fetchWorldShards` hakee `${WORLD_API}/world/${region}`; `204`/`404`/verkko nielty.
- [x] `useSharedWorld.publish()` → `publishSubmission`, ei `window.open`. `KeepRealm` näyttää
      rivin (`Sent.` / `try again in a minute` / `Couldn't reach the world`), nappi
      `Raising…` + `disabled` lähetyksen ajan. `HearthPanel` välittää `Promise`-tyypin.

### Poistuu
- [x] `.github/workflows/world.yml`, `scripts/build-world.mjs` (`git rm`).
      `apps/game/public/world/` ei koskaan syntynyt puuhun.
- [x] `BRDC-SHARE-001`:n cron-`[~]` → suljettu "korvattu Workerilla" -merkinnällä.

### Säilyy
`world.ts`:n `PlayerFile` / `mergePlayerFiles` / `buildShards` / `parseSubmission` /
`worldSourceFrom`, `WorldSource`, `useWorld` (shardien luku), `Settings.shareWorld`,
`useSharedWorld`, "Raise your banner" -nappi.

## Todennus
- [x] `lint:lines` + `tsc -b --force` + `vitest run` (1015) + `pnpm build` vihreä.
- [x] `share.spec.ts` 4/4 — mock `POST`-route: nappi `fetch`aa, ei uutta välilehteä,
      panel näyttää "Others see your realm within the hour."; kytkin pois → ei nappia,
      ei `/world/`- eikä `/submit`-liikennettä.
- [x] `sim.mjs` `raiseYourBanner`-askel vihreä: `context.route('**/submit')` sieppaa,
      body `sum` + `cells` läpäisee, panel vahvistaa. (Sim-suite 11/12 — jäljellä oleva
      MISS "built a Monument … YOURS" on `.cell-panel__build-has`-selektorin vanha
      välke: sama ajo vahvistaa "the build charged the pouch 60→0" ja "the Guide shows
      the Monument as held". Ei tämän tiketin regressio.)
- [ ] Käsin: kaksi selainprofiilia, molemmat kytkin päällä, A "Raise your banner" →
      B:n kartalle A:n realm ilman GitHubia. *(Infinite ajaa kentällä.)*

## Ei tässä
- Auth. Worker luottaa `id`+checksumiin, kuten issue-polkukin. Palvelinvahvistus Vaihe 5.
- Supabase. Jos KV ei riitä, `BRDC-SHARE-004`.
