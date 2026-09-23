# BRDC-HALL-003 — Chronicles: a shared Hall of Fame, tagged by era

| | |
|---|---|
| **Alue** | `packages/core/src/data/hallOfFameStore.ts`, `apps/worker/src/legacy.ts`, `apps/game/src/data/legacy.ts`, `apps/game/src/features/hall/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-HALL-001` (retiring), `BRDC-SHARE-003` (Worker) |
| **Status** | `done` — 2026-09-23 |

## 🔴 RED

Infinite 2026-09-23: *"Minulla on nyt lokaalina 2 highscore kuningaskuntaa, niin haluan
että nuo minulla ja muilla jää 'aikakirjoihin' high scoreen, mikä näkyy kaikille..
merkkaa se että aikakaudelle kivikausi vaikka.. tms.. saa olla luovakin."*

`retireKingdom` (`hallOfFameStore.ts`) jo tekee täsmälleen sen eleen tämä pyytää —
arkistoi luvut, pyyhkii pelin — mutta **täysin paikallisesti**: `HallOfFamePanel` lukee
vain oman laitteen `K.hallOfFame`-avainta. Infiniten kaksi retiroitua kuningaskuntaa
eivät näy kenellekään muulle eivätkä edes hänelle itselleen toisella laitteella.

## 🟢 GREEN

- [x] `HallOfFameEntry.era?: string` — vapaa, pelaajan kirjoittama, valinnainen.
      `.trim().slice(0, 60)`, tyhjä jätetään pois kokonaan eikä talleteta tyhjänä
      merkkijonona
- [x] Uusi Worker-reitti — **nimetty `/legacy`, ei alkuperäisen luonnoksen
      `/chronicle`**: se nimi oli jo varattu (`chronicle.ts`, BRDC-HALL-002:n
      AI-tarina), ja kaksi eri asiaa samannimisinä olisi ollut sekaannus koodissa
      vaikka käyttöliittymässä molemmat näkyvät "Chronicles"ina. `POST /legacy`
      + `GET /legacy`, oma `apps/worker/src/legacy.ts`
- [x] `GET /legacy` lukee suoraan `kv.list({prefix: 'legacy:'})`ia joka pyynnöllä —
      **ei `cachedTable`-välimuistia**, koska julkaisu on liian harvinaista
      hyötyäkseen siitä ja lista kasvaa vain lisäyksin (ei rebuildia joka submitilla
      niin kuin Codexilla)
- [x] Client: retiroinnin yhteydessä best-effort `POST /legacy`, odotetaan ennen
      `window.location.reload()`ia (ei fire-and-forget — muuten navigointi katkaisisi
      pyynnön kesken)
- [x] `HallOfFamePanel` sai toisen välilehden ("This device" / "Chronicles"), lukee
      `/legacy`ia samalla kolmen-tuloksen kuviolla kuin `useCodex`/`useRouteCodex`
- [x] **Uusi, ei alkuperäisessä luonnossa: "Share to the Chronicles" -nappi jokaisella
      paikallisella rivillä joka ei ole vielä jaettu.** Tämä on suora vastaus
      avoimeen kysymykseen alla — Infiniten kaksi olemassa olevaa kuningaskuntaa
      retiroituivat ennen tätä ominaisuutta, joten automaattinen julkaisu ei koskaan
      koskenut niitä. `HallOfFameEntry.sharedAt?: number` + `setKingdomShared`
      merkitsee onnistuneen jaon — nappi näytetään uudelleen jos julkaisu
      epäonnistuu, ei koskaan valehdella "jaettu" kun Worker ei vastannut
- [x] Portti: `lint:lines`, `tsc -b`, **1693** vitest (+8 tätä tikettiä varten:
      2 `hallOfFameStore.test.ts`in era-testiä, 2 `sharedAt`-testiä, 4
      `legacy.test.ts`), `pnpm build`. e2e: 8/8 `hall-of-fame.spec.ts`ssa
      (oikeasti ajettu, ei stale-preview) — retirointi, era-kenttä, Chronicles-välilehti
      vieraan kuningaskunnan kanssa, ja koko "jaa myöhemmin" -polku mokattuine
      onnistumis-/epäonnistumisvastauksineen

## Avoimet, tietoisesti auki jätetyt

- **Jaetun listan koolla ei ole kattoa.** `kv.list({prefix: 'legacy:'})` kasvaa
  rajattomasti. Retirointi on harvinainen (koko pelin elinkaari per kuningaskunta),
  joten tämä ei ole kiireellinen — mutta jos "Chronicles" -sivu joskus hidastuu,
  tämä on ensimmäinen paikka johon katsoa
- **`era` ei ole validoitu sisällöltään**, vain pituudeltaan (60 merkkiä) —
  tarkoituksellista, "saa olla luovakin"

## Ei tässä

- **Ei automaattista taannehtivaa julkaisua.** Infiniten kaksi olemassa olevaa
  kuningaskuntaa eivät ilmesty Chroniclesiin itsestään — "Share to the Chronicles"
  -nappi niiden omalla Hall of Fame -rivillä on tarkoituksellinen, näkyvä teko,
  ei hiljainen taustatyö
- **Ei pakotettua retirointia.** `BRDC-MODE-003` voi tehdä siitä *pakotetun* yhdessä
  tilanteessa (Seikkailumoodin valinta), mutta se on eri tiketti eikä ole vielä
  toteutettu
