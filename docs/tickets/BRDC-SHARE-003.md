# BRDC-SHARE-003 — Jaettu maailma ilman GitHub-lomaketta: Cloudflare Worker + KV

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SHARE-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-08: *"ei tuo oikeen tunnu kivalta, että mä joudun githubiin kirjottaan issuen"* |

## 🔴 RED

`BRDC-SHARE-002` julkaisee kartan avaamalla esitäytetyn GitHub-issuen: peli lakkaa
olemasta peli ja alkaa olla lomake. Se toimii mutta on kömpelö — uusi välilehti, ehkä
kirjautuminen, "Submit new issue", takaisin.

## 🟢 GREEN

- [ ] **Cloudflare Worker** (`worker/` tai `infra/worker/`), yksi ilmainen tili:
      - `POST /submit` — ottaa `WorldSubmission`-JSONin, tarkistaa `checksum`in
        (`@es3/core#parseSubmission`), kirjoittaa `KV[player:<id>] = { source, submittedAt }`.
        Rate-limit per id (esim. 1/min) KV:ssä.
      - `GET /world/<res6>` — lukee kaikki `player:*` KV:stä, `mergePlayerFiles` +
        `buildShards` (TTL `WORLD_PLAYER_TTL_MS`), palauttaa yhden shardin JSONina.
        Cache-Control lyhyt. (Aggregointi joko pyynnöllä tai scheduled Workerissa KV:hen.)
      - Ei salaisuutta klientille; Worker ei committaa repoon eikä tarvitse tokenia.
- [ ] **Klientti:** `worldSubmissionUrl` → `publishSubmission(source)` joka `fetch(POST)`aa
      Workerille. `useSharedWorld.publish()` kutsuu sitä (ei enää `window.open`).
- [ ] `fetchWorldShards` hakee Workerilta (`WORLD_API`-vakio) Pagesin sijaan; 404/verkko
      edelleen nielty, peli toimii ilman.
- [ ] **Poistuu:** `.github/workflows/world.yml`, `scripts/build-world.mjs`,
      `apps/game/public/world/` — GitHub-Actions-putki kokonaan.
- [ ] `mergePlayerFiles` / `buildShards` / `parseSubmission` **säilyvät** — Worker importoi
      ne `@es3/core`:sta (tai kopio, jos Worker-bundlaus ei pure workspacea).
- [ ] e2e: `share.spec.ts` — nappi `fetch`aa (mockattu route), ei avaa välilehteä.

## Ei tässä

- Auth. Worker luottaa `id`+checksumiin kuten issue-polkukin — palvelinvahvistus on Vaihe 5.
- Supabase. Jos tämä ei riitä, `BRDC-SHARE-004` on se — mutta KV riittää kavereiden kesken.
