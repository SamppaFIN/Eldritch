# Eldritch Sanctuary v3 — Totaalinen toteutussuunnitelma (rev. 2, v2-analyysin jälkeen)

Korvaa aiemman MASTERPLAN.md:n. Päivätty 2026-08-26.

---

## 0. HETI ENSIN: turvallisuus

`.env` on v2-repossa. Jos siinä on Supabasen `service_role`-avain, **se on gitin historiassa
ja repo on julkinen**. Tee tämä ennen mitään muuta:

1. Supabase → Settings → API → **rotatoi `service_role`- ja `anon`-avaimet**
2. Google Cloud Console → **rotatoi OAuth client secret**
3. OpenRouter → **peruuta API-avain**
4. Heroku → **rotatoi config vars**
5. `git rm --cached .env`, lisää `.gitignore`en. Huom: tämä ei poista historiasta — avaimet
   on rotatoitava joka tapauksessa.
6. Harkitse v2-repon muuttamista yksityiseksi.

**Suositus:** v3 saa **uuden Supabase-projektin**. Se on samalla puhdas avainrotaatio ja
puhdas skeema. Vanhasta migroidaan tarvittaessa vain `players` ja `player_game_state`
kertaluontoisella skriptillä.

---

## 1. Mitä v2-analyysi muutti

Aiempi suunnitelmani oletti, että lähtökohtana on v1: pieni vanilla-peli ilman backendia.
Todellisuus on toinen. v2:ssa on **jo olemassa** merkittävä osa siitä, mitä olin
suunnittelemassa rakennettavaksi:

| Asia | Oletukseni | Todellisuus v2:ssa |
|---|---|---|
| Backend | ei ole | Express + Socket.io, 992 r, Herokussa |
| Tietokanta | ei ole | Supabase, 9 taulua |
| Auth | ei ole | Google OAuth + email + guest |
| Multiplayer | ei ole | Socket.io: sijainti, chat, löydöt |
| GPS-jälki | ei ole | 3 rinnakkaista mekanismia + palvelinpuolen konsolidointi |
| **Aluevaltaus** | ei ole | **`TerritorySystem.js`, 1 295 r — toimiva mekaniikka** |
| Sisältö | v1:n 9 lore-merkintää | Evolving Codex (405 r), Fuming Lake -questi (764 r), 11 entiteettiä |

**Kolme johtopäätöstä:**

1. **Sisältö on v2:n todellinen arvo, ei koodi.** 16 päivässä on kirjoitettu poikkeuksellisen
   hyvää pelisisältöä. Porrastuva codex ja Pratchett-Lovecraft-questi ovat aitoja ideoita,
   joita ei kannata keksiä uudelleen. Ne siirtyvät v3:een **datana**, eivät järjestelminä.

2. **Arkkitehtuuri ei ole korjattavissa inkrementaalisesti.** 68 `<script>`-tagia, globaalit
   `window`-luokat, 4 081 rivin `MapSystem.js`, 0 % todennettu testikattavuus, 29 versioimatonta
   localStorage-avainta. Uudelleenkirjoitus pysyy oikeana päätöksenä — mutta se on nyt
   *portaus*, ei tyhjältä pöydältä aloittaminen.

3. **v2:n epäonnistuminen oli laajuuden hallinta, ei osaaminen.** 43 järjestelmää 16 päivässä.
   Tämä on v3-suunnitelman tärkein oppi ja se on kirjoitettu sisään kohtaan 4.

---

## 2. Aluevaltaus: v2:n mekaniikka vs. pyyntösi

v2:ssa on jo aluevaltaus, mutta **se ei ole se mitä pyysit.**

**v2:** tukikohdan ympärille 12-kulmainen raja 20 m säteellä. Joka 50. askel pudottaa
markkerin, joka työntää lähintä rajapistettä ulospäin (max 50 m). Alue on yksi kupliva
monikulmio yhden pisteen ympärillä.

**Pyyntösi:** *"avoimen kartan päälle piirtää minkä alueen omistat kuljetun ympyrän kautta"* —
eli kävelty lenkki sulkee alueen sisäänsä.

Nämä ovat eri pelejä. v2:n malli tuottaa yhden kasvavan möykyn kotisi ympärillä; lenkkimalli
tuottaa imperiumin, joka leviää sinne minne kävelet. Vain jälkimmäinen tukee riistoa
järkevästi.

### Ratkaisu: molemmat, eri rooleissa

| Mekaniikka | Rooli v3:ssa | Lähde |
|---|---|---|
| **Askel-valtaus** (astut reunaheksaan → se on sinun) | **Ensisijainen 2026-09-02 alkaen (BRDC-CLAIM-009).** Nopein tapa oppia liikkuminen; alue kasvaa jalka kerrallaan reunoilta. | Uusi |
| **Loop-claim** (kävelty lenkki → sisäalue) | Pelin syvempi mekaniikka. Koodi ennallaan, `Settings.loopClosure`in takana (oletus pois), opetetaan takaisin `BRDC-CLAIM-010`:ssä. | Uusi |
| **Anchor-kasvu** (v2:n rajapistelaajennus) | **Toissijainen.** Anchor Stone kasvattaa hitaasti omaa vyöhykettään askelmarkkereista, mutta vain omistamiesi solujen sisällä. Antaa kotipesän ja passiivisen etenemisen. | v2:n `TerritorySystem` konsepti, uusi toteutus |

Näin v2:n mekaniikka säilyy tunnelmana ("kannat markkeria, se jäähtyy 15 min") ilman että se
kilpailee ydinmekaniikan kanssa. Anchor tulee vasta Vaiheessa 6 — ei MVP:hen.

### 2.1 Vahvistuminen ja rappeutuminen (päätös 1)

Alue ei ole pysyvä eikä katoa hetkessä. Se elää sen mukaan, kuljetko siellä oikeasti.

**Vahvistuminen — päiväkohtainen, ei toistokohtainen.** Solu vahvistuu **kerran per
kalenteripäivä**, jonka aikana kuljet sen läpi. Sama päivä useaan kertaan ei tee mitään.
Tämä on tarkoituksellista: peli palkitsee rutiinia, ei grindaamista.

| Tapahtuma | Vaikutus |
|---|---|
| Uusi päivä solussa | strength **+25** |
| Peräkkäinen päivä (eilen myös) | strength **+50** |
| Katto | **500** |

Työmatkareitti, jota kuljet joka arkipäivä, saavuttaa katon noin kahdessa viikossa. Kerran
kuukaudessa käyty metsälenkki ei koskaan.

**Rappeutuminen — kiihtyvä.**

| Aika viimeisestä käynnistä | Rappeutuminen |
|---|---|
| 0–48 h | ei mitään (armonaika) |
| 2–14 vrk | −10 / vrk |
| yli 14 vrk | −25 / vrk |
| strength ≤ 0 | **solu vapautuu** — "The Void reclaims" |

Maksimivahva solu (500) kestää koskemattomana noin 33 vuorokautta. Juuri vallattu solu (100)
kestää noin 12. Kartta pysyy elävänä myös kahdella pelaajalla, koska hylätty alue katoaa itsestään.

### 2.2 Piiritysmalli — muutos aiempaan

Aiemmassa versiossa solu vaihtoi omistajaa kerralla, jos hyökkäysvoima ylitti puolustuksen.
Se ei toimi enää, kun puolustus voi olla 500 ja hyökkäysvoima on korkeintaan ~290.

**Uusi malli: hyökkäys tekee vahinkoa, ei käännä solua kerralla.**

```
hyökkäysvoima = 100 + taso×5 + naapuribonus (max 90) + ankkuribonus
strength -= hyökkäysvoima
jos strength <= 0  →  solu vaihtaa omistajaa, uusi strength = 100
```

Käytännössä: kaverin kotikorttelin valtaaminen vaatii kaksi tai kolme erillistä lenkkiä eri
päivinä. Se on parempi peli kuin kertaheitolla varastaminen — ja se tekee kotialueesta aidosti
kotialueen. Sivutuotteena tämä on myös huijauksenesto: yksi väärennetty lenkki ei riitä mihinkään.

Muut ydinmekaniikan yksityiskohdat (H3 res 11, naapuribonus, loop-säännöt) ovat ennallaan;
ks. `CLAUDE.md` kohta "Constants".

---

## 3. Arkkitehtuuripäätökset — päivitetyt

### 3.1 Heroku-palvelin poistuu

v2:n `server/` (3 951 r) korvautuu Supabasen RPC-funktioilla ja Realtimella.

| v2 | v3 |
|---|---|
| `AuthService.js` + JWT + 3 kirjautumispolkua | Supabase Auth: anonymous → linkitys Googleen |
| `GameStateService.js` + `POST /api/game-state` | RPC + RLS, tila on tauluissa |
| `PathMarkerService.js` (5 m konsolidointi) | `submit_trail_batch`-RPC (sama Haversine-logiikka, tiukempi validointi) |
| Socket.io 18 tapahtumaa | Supabase Realtime broadcast + presence |
| Heroku (maksullinen, `client-server.js`, kaatuilua) | GitHub Pages (staattinen, ilmainen) |

**Perustelut:** Heroku ei ole enää ilmainen. Staattinen klientti ei tarvitse Node-prosessia.
Erillinen palvelin tarkoittaa kahta deployta ja kahta tilalähdettä. Ja tärkein: Socket.io
-arkkitehtuurissa **palvelin luottaa klienttiin** — `position:update` menee suoraan tilaan.
v3:n koko huijauksenesto perustuu siihen, että Postgres validoi ja päättää.

**Se mitä säilytetään:** `PathMarkerService`in konsolidointi-idea (< 5 m pisteet yhdistetään)
on hyvä ja siirtyy `submit_trail_batch`iin. Chat siirtyy Realtime broadcastiin — se on
n. 100 riviä, ei 992.

### 3.2 Mock-first: peli toimii ilman kantaa (päätös 4)

Kaikki datan luku ja kirjoitus kulkee yhden rajapinnan läpi:

```ts
interface GameRepository {
  startRun(): Promise<RunId>
  submitTrail(runId, points): Promise<TrailResult>
  closeLoop(runId): Promise<ClaimResult>
  getCells(bbox): Promise<Cell[]>
  // ...
}
```

Toteutuksia on kaksi:

| | `MockRepository` | `SupabaseRepository` |
|---|---|---|
| Missä | Selaimessa, `packages/core`in sääntöfunktioiden päällä | Supabase RPC |
| Tila | IndexedDB + siemendata (kuvitteelliset naapuripelaajat) | Postgres |
| Käytössä | Vaiheet 0–2, kaikki testit, offline-tila | Vaiheesta 3 eteenpäin |

**Miksi tämä on hyvä idea eikä väliaikainen viritys:**
- Vaiheet 1–2 valmistuvat ilman verkkoa, tilejä tai migraatioita. "Peli on olemassa" -hetki
  tulee nopeammin.
- Kaikki testit ajavat mockia vasten — nopeita ja deterministisiä.
- Offline-tila (v1:ssä ollut, v2:sta kadonnut) tulee ilmaiseksi: kun verkko katkeaa,
  vaihdetaan mockiin ja synkataan myöhemmin.

**Se riski jonka tämä tuo:** sama sääntö on kahdessa paikassa — TypeScriptissä ja SQL:ssä.
Ne voivat ajautua erilleen hiljaisesti.

**Torjunta, joka on pakollinen Vaiheessa 3:** *golden fixture* -testit. Sama joukko
syötteitä (kymmenkunta reittiä `packages/core/sim/fixtures/`ista) ajetaan molempia toteutuksia
vasten ja tulosten on oltava identtiset solu solulta. Jos ne eroavat, **SQL voittaa** ja
TypeScript korjataan. Tämä testi ajetaan CI:ssä jokaisella commitilla.

### 3.3 Look & feel: paletti on ratkaistava

v1:llä ja v2:lla on **eri paletit**:

| | v1 | v2 |
|---|---|---|
| Tausta | `#0a0e27` sinipurppura | `#0a0612` lähes musta |
| Ensisijainen | `#8b5cf6` violetti | `#4a1a5c` tumma purppura |
| Korostus | `#14b8a6` teal | `#00d4ff` kirkas syaani |
| Kulta | `#fbbf24` | `#ffd700` |
| Fontit | Cinzel + Orbitron + Inter (ladattu) | Courier New + Segoe UI + Spectral (**Spectral ei lataudu**) |
| Muuttujia | 30+ | 15 (11 204 CSS-rivistä) |

**Suositus:** **v2:n paletti** (se on uusin ja siinä on kolme teemaa), mutta **v1:n
typografia** (Cinzel/Orbitron/Inter, self-hostattuna @fontsourcella). v2:n Courier New +
Segoe UI ei ole suunnitelma vaan oletusarvo, ja Spectral on rikki.

Tokenisto rakennetaan täydeksi: väliskaala, typografinen skaala, `clamp()`-responsiivisuus,
44 px kosketuskohteet, `prefers-reduced-motion`, `:focus-visible`. Näitä ei ole kummassakaan.
Tavoite: **yksi CSS-tiedosto alle 800 riviä** (v2: 34 tiedostoa, 11 204 riviä).

**Teemat: vain Cosmic MVP:hen** (päätös 3). Void ja Mystic tulevat myöhemmin. Tokenit
kirjoitetaan kuitenkin heti niin, että teeman lisääminen on `[data-theme]`-lohkon
lisääminen — ei uudelleenkirjoitus. v2:n Void- ja Mystic-arvot talteen
`docs/backlog/themes.md`:hen.

### 3.4 Loput teknologiavalinnat ennallaan

React 19 + TS + Vite · MapLibre GL (ei Leafletia) · h3-js + h3_postgis · Zustand +
TanStack Query · Capacitor Android · Supabase · Vitest + Playwright.

MapLibre ratkaisee samalla v2:n **pois kytketyn klusteroinnin** (`MapSystem.js:922`,
`// TODO: Re-enable clustering once the logic is fixed`) — se on natiivi ominaisuus, ei
oma toteutus.

---

## 4. Laajuuden hallinta — v3:n tärkein sääntö

v2 kaatui siihen, että 43 järjestelmää rakennettiin ennen kuin yksikään oli valmis.
v3 noudattaa tätä sääntöä poikkeuksetta:

> **Mikään Vaiheen 6 ominaisuus ei saa alkaa ennen kuin Vaihe 5 on tuotannossa.**

Konkreettisesti: seuraavat v2:n ominaisuudet ovat **jäissä** kunnes APK on kaverin puhelimessa
ja aluevaltaus toimii moninpelissä:

Questit · taistelu · Health/Sanity · satunnaiskohtaamiset · TTS-äänet · proseduraalinen audio ·
OSM-rakennusten värjäys · AI-dialogi (OpenRouter) · valonsiirtopartikkelit · kauppias ·
shrinet · tukikohdan rakentaminen · Evolving Codexin porrastus.

Ne **eivät ole peruttu** — ne ovat `docs/backlog/`issa datana valmiina. Ne palaavat sen
jälkeen kun peli on olemassa. Tämä on ainoa asia, joka erottaa v3:n v2:sta rakenteellisesti.

**Toinen kova sääntö:** yhdenkään tiedoston ei sallita ylittää **400 riviä**. `MapSystem.js`
on 4 081. Kun raja tulee vastaan, tiedosto jaetaan — ei nosteta rajaa.

---

## 5. Mitä v2:sta poimitaan

Yksityiskohtainen tiedostokohtainen lista on erillisessä `EXTRACTION.md`:ssä. Tiivistelmä:

**Poimitaan (data):**
- `game/config/GameConfig.js` → kaikki pelivakiot `packages/core/rules/constants.ts`:iin
- `game/data/EvolvingCodexData.js` (405 r) → `supabase/seed/codex.json`
- `game/data/QuestFumingLake.js` (764 r) → `supabase/seed/quest-fuming-lake.json` (backlogiin)
- `game/systems/EntitySpawner.js` → entiteettien nimet, lore, kauppatavarat → JSON
- `game/styles/main.css` + `theme-system.css` → 15 muuttujaa → uusi tokenisto
- `server/services/PathMarkerService.js` → konsolidointialgoritmi → SQL
- `CRITICAL_FIXES_NEEDED.md` + `BACKLOG_v4.2.md` → bugilista v3:n regressiotesteiksi

**Poimitaan (idea, ei koodi):**
- `TerritorySystem.js` → Anchor-mekaniikka Vaiheeseen 6
- `EvolvingCodexData` porrastusrakenne → skeema `codex_tiers`-tauluun
- Alignment-järjestelmä (Peaceful/Cunning/Forceful) → backlogiin

**Ei poimita:**
- Yksikään 43:sta järjestelmästä koodina
- `tests/` (8 134 riviä, kattavuus mitattuna 0 % — arvo todentamaton)
- 112 markdown-tiedostoa (yksi `CLAUDE.md` korvaa ne)
- 35 debug-HTML-tiedostoa
- 2 033 riviä kuollutta koodia (3 käyttämätöntä askelmittaria + `OtherPlayersRenderer`)
- `server/` kokonaisuudessaan

---

## 6. Vaiheet — päivitetty

Rakenne ennallaan. Aikataulu tarkentunut, koska sisältö on valmiina ja auth-malli tunnettu.

| Vaihe | Sisältö | Data | Arvio |
|---|---|---|---|
| **0** | Monorepo, tokenisto (Cosmic), `GameRepository`-rajapinta, Pages-deploy | — | 1 pv |
| **1** | MapLibre, GPS-tracking, ley-line, `MockRepository` | **mock** | 2–3 pv |
| **2** | **Loop-detection, H3-rasterointi, valtaus, vahvistuminen, rappeutuminen** | **mock** | 3–5 pv |
| **3** | Supabase käyttöön, RPC:t, golden fixture -testit, realtime, corruption, chat | **Supabase** | 5–7 pv |
| **4** | The Wager: haastekoodi, arena, live-pisteet, tulossivu | Supabase | 2–4 pv |
| **5** | Capacitor, foreground service, **allekirjoitettu APK**, päivitystarkistus | Supabase | 2–4 pv |
| **6** | Sisältö takaisin: codex, löydöt, Fuming Lake, Anchor, teemat, audio | Supabase | jatkuva |

**Muutokset:** Vaiheet 1–2 eivät koske kantaan ollenkaan (päätös 4) → nopeampi tie
pelattavaan peliin. Vaihe 3 kasvaa, koska Supabase-integraatio ja golden fixture -testit
ovat siellä. Vaihe 5 kutistuu, koska Play Store jää pois (päätös 2): ei Play Consolea,
ei arviointia, ei taustapaikannushakemusta.

**Kokonaisaika Vaiheeseen 5:** 3–5 viikkoa iltatyönä.

### Vaiheiden hyväksymisportit — kirjaimellisesti

- **V1:** Kävele ulkona 10 min lentokonetilassa. Jälki seuraa ja säilyy reloadin yli.
- **V2:** Kävele korttelin ympäri. Alue täyttyy. Kävele sama reitti huomenna → alue vahvistuu.
  Kelaa kelloa 20 vrk eteenpäin testissä → alue vapautuu. **Peli on olemassa.**
- **V3:** Golden fixture -testit vihreinä (mock ≡ SQL). Kaksi puhelinta, toinen piirittää
  toisen aluetta, molemmat näkevät vahingon < 2 s.
- **V4:** Haasta kaveri WhatsApp-linkillä. 30 min päästä on voittaja.
- **V5:** Allekirjoitettu APK asennettuna kaverin puhelimeen. Tracking toimii ruutu sammuneena.

Jos portti ei mene läpi, seuraava vaihe ei ala. Ei poikkeuksia.

---

## 7. v2:n bugit v3:n regressiotesteiksi

v2:n dokumentoidut viat ovat ilmaisia testitapauksia. Nämä kirjoitetaan testeiksi **ennen**
kuin vastaava ominaisuus rakennetaan:

| v2-bugi | v3-testi |
|---|---|
| Taso 118 vanhasta savesta | `SAVE_VERSION`-kenttä; tuntematon versio hylätään ja resetoidaan hallitusti |
| Boot-race: spawn ennen `map:ready` | Deterministinen `await`-ketju, ei EventBus-ajoitusta. Testi: alusta 100× |
| Klusterointi rikki → kytketty pois | MapLibren natiivi klusterointi, testi 5 000 markkerilla |
| Mobiililayout P0-rikki (S23 Ultra) | Playwright-viewport 360 px ajetaan **ensimmäisenä**, ei viimeisenä |
| Aurora/Hevy eivät laukea | Kohtaamislogiikka `packages/core`issa, yksikkötestattavana |
| Taustaääni häiritsi käyttäjiä | Audio on **opt-in**, oletuksena mykistetty |
| 29 versioimatonta localStorage-avainta | Yksi nimiavaruus `es3:*`, yksi `save()`, yksi versio |
| CDN-katko kaataa pelin | Ei runtime-CDN-riippuvuuksia; kaikki bundlataan |

---

## 8. Lukitut päätökset

Nämä on päätetty 2026-08-26. Ne eivät ole enää keskustelun alla ilman erillistä syytä.

| # | Päätös | Seuraus |
|---|---|---|
| 1 | **Alue vahvistuu päiväkäynneistä ja rappeutuu ajan myötä, nollassa vapautuu** | §2.1–2.2. Piiritysmalli korvaa kertaflipin |
| 2 | **APK, ei Play Storea** | Vaihe 5 kutistuu. Päivitykset vaativat oman tarkistuksen (§8.1) |
| 3 | **Vain Cosmic-teema MVP:hen** | Tokenit rakennetaan teemavalmiiksi, muut backlogiin |
| 4 | **Uusi Supabase-projekti. Vaiheet 1–2 mock-datalla ilman kantaa** | §3.2. Golden fixture -testit pakollisia Vaiheessa 3 |
| 5 | **Fuming Lake pysyy kovakoodattuna Tampereelle** | Ei siirrettävyyttä. Vaihe 6 |
| 6 | v2:n `claude.md` on olemassa | Yhdistetään kun se on nähty (§8.2) |

### 8.1 APK-jakelun seuraus, joka on helppo unohtaa

Ilman Play Storea **päivitykset eivät tule automaattisesti**. Kaverin puhelimessa oleva APK
jää siihen versioon, kunnes hän asentaa uuden käsin. Tämä tarvitaan Vaiheeseen 5:

- `version.json` GitHub Pagesissa (`{ "version": "1.2.0", "apk": "https://…", "notes": "…" }`)
- Sovellus tarkistaa sen käynnistyksessä, näyttää lore-sävyisen ilmoituksen jos uudempi löytyy
- Palvelinpuolella `min_client_version` — jos klientti on liian vanha, RPC:t hylkäävät sen
  selkeällä virheellä sen sijaan että data korruptoituisi

Ilman viimeistä kohtaa vanha APK voi kirjoittaa kantaan väärässä muodossa olevaa dataa.
Tämä on sama juurisyy kuin v2:n taso-118-bugissa: ei versiotarkistusta rajapinnassa.

### 8.2 v2:n claude.md

Pyysit Claude Codea täyttämään sen. Lähetä se tänne, niin yhdistän sen tähän — **yksi
suunnitelma, ei kaksi.** Jos siinä on tikettejä jotka puuttuvat täältä, ne lisätään; jos siinä
on ristiriitoja, ratkaistaan ne nyt eikä kolmen viikon päästä. v2:n konkreettisin ongelma oli
112 markdown-tiedostoa ilman totuuden lähdettä — se virhe on halpa välttää ja kallis toistaa.

---

## 9. Riskit — päivitetty

| Riski | Vakavuus | Torjunta |
|---|---|---|
| **Vuotaneet avaimet** | **Kriittinen** | Rotatoi tänään (§0) |
| **Laajuuden karkaaminen (v2:n toistuminen)** | **Korkea** | §4:n kova sääntö. Tämä on todistetusti teidän suurin riskinne |
| GPS-tarkkuus kaupungissa | Korkea | 25 m sulkeutumissäde, jäljen tasoitus |
| Akku | Korkea | 10 m suodatin, 10 s batchit, foreground service |
| Vanhojen ideoiden houkutus ("lisätään vielä…") | Korkea | Backlog on kirjoitettu, siihen ei kosketa ennen V5:tä |
| Play Storen taustapaikannuspolitiikka | Keskisuuri | MVP välttää taustaluvan |
| Tyhjä kartta | Keskisuuri | Wager toimii kahdella pelaajalla |
| GPS-spoofaus | Matala | Mock-detection + `cell_history`-audit |

---

## 10. Ensimmäiset komennot

```bash
# 0. Rotatoi avaimet. Vasta sitten jatka.

# 1. Uusi repo
gh repo create EldrichHorror-v3 --public --clone && cd EldrichHorror-v3
cp ../CLAUDE.md .
mkdir -p supabase/migrations docs/backlog
cp ../0001_init.sql supabase/migrations/

# 2. Poimi sisältö v2:sta (ks. EXTRACTION.md — tee tämä kerran, käsin)

# 3. Claude Code
claude
```

Vaihekohtaiset promptit ovat `PROMPTS.md`:ssä (edellinen versio pätee edelleen; Vaihe 0:n
promptiin lisätään tokeniston laajennus ja Vaihe 3:een chat).
