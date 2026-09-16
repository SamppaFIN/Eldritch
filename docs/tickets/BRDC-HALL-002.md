# BRDC-HALL-002 — The reward for retiring: a chronicle, AI-written or not

| | |
|---|---|
| **Alue** | `apps/worker/src/index.ts`, `packages/core/src/data/kingdomChronicle.ts`, `hallOfFameStore.ts`, `apps/game/src/data/kingdomStory.ts`, `features/hall/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-HALL-001`, `BRDC-SHARE-003` (Worker) |
| **Status** | `done` — 2026-09-17 (v0.6.43). Vaatii Infiniteltä yhden käsin tehtävän askeleen ennen kuin AI-tarina toimii oikeasti (ks. alla) — paikallinen varatarina toimii heti ilman sitä. |

## 🔴 RED

Infiniten pyyntö 2026-09-17, jatkona BRDC-HALL-001:lle: *"I want a reward for retiring to
be an AI story about the kingdom you once had.. can give you a key, but lets keep it
generic.. proide a [fallback] story [of] what happened as a fallback."* Samassa viestissä
kysymys: *"is it easy to upkeep throught that cloudfire?"* — onko ylläpito Cloudflaren
kautta helppoa.

Hall of Fame kertoi jo demografiat, mutta ei kertonut **tarinaa**. Avain AI-kutsuun ei voi
koskaan olla asiakkaalla (§9) — se pitää ratkaista palvelimella, ja peli ajaa jo yhtä
Cloudflare Workeria (`BRDC-SHARE-003`) jaettuun maailmaan. Sama Worker on luonteva paikka:
ylläpito on todella kevyt, koska se on jo pystyssä ja Infinite jo ajaa `wrangler deploy`ia.

## 🟢 GREEN

- [x] `POST /kingdom-story` uutena reittinä samassa Workerissa (`apps/worker/src/index.ts`)
      — ottaa kuningaskunnan luvut, kutsuu Claude Haikua (`env.AI_API_KEY`, asetettu
      `wrangler secret put`illa), palauttaa `{story}`. Puuttuva avain tai epäonnistunut
      kutsu → `503`, ei kaadu
- [x] Kevyt IP-pohjainen jäähdytys (`story-rl:`, sama KV-kuvio kuin `/submit`illa) —
      suojaa avaimen budjettia skriptiä vastaan, ei oikeaa pelaajaa: retirointi on jo
      harvinainen, tarkoituksellinen teko
- [x] `fallbackChronicle(entry)` (`packages/core/src/data/kingdomChronicle.ts`) — puhdas,
      ei verkkoa, rakentaa oikean lauseen suoraan entryn luvuista (nimi, taso, ala,
      väestö, saavutukset, löydöt). **Tämä on palkinto silloinkin kun Worker ei vastaa** —
      ei koskaan "tarina ei saatavilla"
- [x] `HallOfFameEntry.story?: string` ja `setKingdomStory(store, id, story)` — kirjoitetaan
      kerran, kun rivi ensin avataan, luetaan sen jälkeen suoraan arkistosta
- [x] `useHallOfFame`in uusi `reveal(id)` — laiska: tarinaa ei haeta jokaiselle riville
      automaattisesti, vain kun pelaaja pyytää sitä. Yrittää Workeria ensin; `null` (mikä
      tahansa syy) → `fallbackChronicle` heti, sama tallennuspolku molemmille
- [x] `HallOfFamePanel`: "Reveal the chronicle" -nappi rivillä jolla ei vielä ole tarinaa;
      kertyneen tarinan oma tyyli (`.hall__story`)
- [x] `claude.md` §6.9 päivitetty paikan päällä, samalla kaavalla kuin väitelyäänen
      poikkeus (§6.6): tämä on **yksi poikkeus**, ei pysyvä ovi
- [x] Portti: `lint:lines`, `tsc -b` (Worker mukana projektireferensseissä), **1604**
      vitest (+13: 4 `kingdomChronicle.test.ts`, 4 uutta `hallOfFameStore.test.ts`), `pnpm build`

## Todennus

`kingdomChronicle.test.ts`: nimeää kuningaskunnan, tason, alan ja väestön ilman löytöjä;
mainitsee saavutukset vain kun niitä on (yksikkö/monikko); listaa vain nollasta poikkeavat
löydöt; ei koskaan heitä poikkeusta pienimmälläkään mahdollisella kuningaskunnalla.
`hallOfFameStore.test.ts`: `story` on `undefined` ennen paljastusta;
`setKingdomStory` osuu oikeaan entryyn eikä koske muita; on no-op tuntemattomalle idlle.

**Ei ajettu todellista AI-kutsua vasten** — se vaatii oikean avaimen Workerin puolella,
jota tässä ympäristössä ei ole. Paikallinen varatarina on todennettu täysin; Workerin
`/kingdom-story`-reitti on rakennettu samalla varovaisuudella kuin `/submit` (validointi,
jäähdytys, ei koskaan kaatuminen), mutta sen oma onnistunut-polku vaatii Infiniten oman
avaimen ja deployn nähdäkseen sen toiminnassa asti.

## Infiniten oma askel (ei koodia — vaatii pääsyn Cloudflareen)

1. `cd apps/worker && npx wrangler secret put AI_API_KEY` — liitä [Anthropicin
   API-avain](https://console.anthropic.com/) (tai mikä tahansa avain jota `craftChronicle`
   käyttää, jos sitä joskus vaihdetaan — nimi on tarkoituksella geneerinen)
2. `npx wrangler deploy`
3. Siihen asti: Hall of Famen "Reveal the chronicle" -nappi näyttää paikallisen
   varatarinan joka kerta — pelillisesti täysin toimiva, vain ei AI:n kirjoittama

## Ei tässä

- **Ei monen AI-palveluntarjoajan tukea.** "Geneerinen" tarkoittaa: avaimen nimi ja
  Workerin rajapinta eivät ole sidottuja yhteen merkkijonoon sirpaloituna koodin läpi —
  `craftChronicle` on yksi funktio, helppo vaihtaa. Ei tarkoita abstraktiokerrosta jota
  kukaan ei ole pyytänyt
- **Ei uudelleengenerointia.** Kerran kirjoitettu tarina on pysyvä — ei "kirjoita
  uudelleen" -nappia. Jos AI-kirjoitettu tarina halutaan myöhemmin sen jälkeen kun
  varatarina jo tallentui, se on oma pyyntönsä
- **Ei tarinaa Codexissa tai You-ruudulla.** Vain Hall of Fame, koska vain siellä
  kuningaskunta on jo mennyttä — elävän kuningaskunnan tarina kirjoittaisi itseään joka
  kerta sen tila muuttuu
