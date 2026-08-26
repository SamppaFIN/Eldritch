# Claude Code -promptit vaiheittain

Käytä **plan modea** (Shift+Tab ×2) jokaisen vaiheen alussa. Anna prompti, lue suunnitelma,
korjaa mitä pitää, hyväksy vasta sitten. Yksi vaihe = yksi haara = yksi PR.

---

## Vaihe 0 — Perustus

```
Lue CLAUDE.md. Pystytä monorepo sen mukaan.

- pnpm workspaces: apps/game (React 19 + TS strict + Vite), packages/core, packages/ui
- packages/core/types/GameRepository.ts: rajapinta kaikelle datalle (startRun, submitTrail,
  closeLoop, getCells, ...). Kaksi toteutusta myohemmin: MockRepository (Vaiheet 1-2) ja
  SupabaseRepository (Vaihe 3). Mikaan komponentti ei saa importata supabase-klienttia suoraan.
- EI Supabase-yhteytta viela. Vaiheet 0-2 toimivat kokonaan ilman kantaa.
- apps/game: PWA (vite-plugin-pwa), HashRouter, base-polku ympäristömuuttujasta
  (VITE_BASE_PATH) niin että sama build toimii sekä GitHub Pagesissa alipolussa
  että Capacitorissa juuressa
- packages/core: puhdas TS, ei riippuvuuksia, vitest konfiguroitu
- packages/ui: styles/tokens.css jossa CLAUDE.md:n design-tokenit; Cinzel/Orbitron/Inter
  ladataan self-hostattuina (@fontsource), ei Google Fonts CDN.
  Tokenisto on TÄYSI: värit, väliskaala, typografinen skaala clamp():lla, --touch-min 44px,
  radiukset, prefers-reduced-motion, :focus-visible. Kolme teemaa [data-theme]-attribuutilla
  (cosmic/void/mystic) + high-contrast. YKSI tiedosto, alle 800 riviä.
  (v2:ssa oli 34 CSS-tiedostoa, 11 204 riviä ja 15 muuttujaa — älä toista sitä.)
- Aloitusnäkymä: tähtitaivastausta + Cinzel-otsikko "Eldritch Sanctuary" +
  lasipaneeli jossa "Begin the Awakening" -nappi. Ei toiminnallisuutta vielä.
- .github/workflows/deploy.yml: pnpm build → GitHub Pages
- juuren skriptit: dev, build, test, typecheck, e2e

Älä lisää muita riippuvuuksia kysymättä. Lopuksi aja pnpm typecheck && pnpm test.
```

Portti: deployattu sivu näyttää oikealta.

---

## Vaihe 1 — Kartta + oma ley-line

```
Tiketti: docs/tickets/BRDC-TRAIL-001.md — kirjoita se ensin.

RED: pelaajalla ei ole karttaa eikä jälkeä.
GREEN: kirjautunut pelaaja näkee tumman kartan, oman sijaintinsa ja hehkuvan
ley-linen joka piirtyy liikkuessa ja säilyy reloadin yli.

1. MockRepository: IndexedDB-tallennus + siemendata (3 kuvitteellista naapuripelaajaa
   alueineen, jotta kartta ei ole tyhja). EI Supabasea, ei kirjautumista, ei verkkoa.
   Pelaajaprofiili on paikallinen. Sovelluksen pitaa toimia lentokonetilassa.
2. MapLibre GL -kartta, tumma tyyli sävytettynä --cosmic-void suuntaan.
   Ei saa näyttää tavalliselta OSM:ltä. Karttatyyli omaan tiedostoon
   apps/game/src/features/map/style.ts jotta sitä on helppo virittää.
3. packages/core/geo: haversine, nopeuslaskenta, pisteiden suodatus
   (MAX_ACCURACY_M, MAX_SPEED_MS, MIN_POINT_INTERVAL_MS) + testit
4. packages/core/sim: portaa GPS-simulaattori (kävelynopeus, suunnat, kuviot
   straight/curve/random/stop). Dev-buildissa näppäinohjaus WASD:lla.
5. useGeolocation-hookki: watchPosition, 10 m etäisyyssuodatin, 10 s batchit
   → rpc('submit_trail_batch')
6. Jälki renderöidään GeoJSON-linjana, hehku = kaksi päällekkäistä layeria
   (leveä blur --eldritch-purple + kapea kirkas --sacred-gold)
7. HUD: lasipaneeli jossa Consciousness Level, XP-palkki, matka, GPS-tarkkuus

Testit: geo-funktiot vitestillä, e2e Playwrightilla mockatulla sijainnilla.
```

Portti: kävele ulkona kymmenen minuuttia, jälki seuraa ja tallentuu.

---

## Vaihe 2 — Aluevaltaus (mock-datalla, ei kantaa)

```
Tiketti: docs/tickets/BRDC-CLAIM-002.md

RED: kavelty lenkki ei tee mitaan.
GREEN: kun jalki sulkeutuu, sisapuoli tayttyy heksoilla. Sama reitti huomenna vahvistaa
alueen. 20 vrk kayttamatta -> alue vapautuu.

1. packages/core/geo/loopDetection.ts — pure function:
   input TrailPoint[], output { closed, loop } | null. Havaitsee kun uusi piste on
   < LOOP_CLOSE_RADIUS_M paassa aiemmasta (ohita N viimeisinta ettei laukea heti).
   Palauttaa vain sulkeutuneen osuuden. Testifixturet: nelio, kahdeksikko, avoin viiva,
   edestakainen kavely, GPS-kohinainen reitti.
2. packages/core/geo/polygonToCells.ts — h3-js polygonToCells, res 11
3. packages/core/rules/capture.ts — PIIRITYSMALLI:
   - vapaa solu -> valtaus, strength = BASE_STRENGTH
   - oma solu   -> registerVisit (kerran/paiva, streak jos eilen myos, katto 500)
   - vieras solu-> strength -= attackPower; vasta nollassa vaihtaa omistajaa
   Ala yksinkertaista tata kertavertailuksi.
4. packages/core/rules/decay.ts — 48h armonaika, -10/vrk, -25/vrk 14 vrk jalkeen,
   <= 0 vapautuu. Puhdas funktio jolle annetaan "nyt"-aika parametrina, jotta
   ajan kulumista voi testata ilman odottamista.
5. MockRepository toteuttaa closeLoop/getCells naiden paalla. Dev-tyokalu: "kelaa
   aikaa +1 vrk" -nappi, jolla rappeutumisen nakee sekunneissa.
6. Heksat kartalle: yksi GeoJSON-lahde, fill --cosmic-purple 0.35, line 0.9.
   Strength nakyy opasiteettina: heikko solu on himmeampi. Uudet solut animoituvat.
7. HUD: consciousness level, XP, omistetut solut, vahvin alue.

Testit ennen toteutusta. Aja myos 360px viewport.
## Vaihe 3 — Supabase + moninpeli + corruption

```
Tiketti: docs/tickets/BRDC-MULTI-003.md

Tama on suunnitelman suurin vaihe. Ala yrita tehda sita yhdessa istunnossa.

3A. Supabase kayttoon
  - supabase db push (0001_init.sql on jo olemassa)
  - SupabaseRepository toteuttaa saman GameRepository-rajapinnan
  - Anonyymi kirjautuminen, profiilin luonti triggerilla
  - Migraatio: paikallinen mock-tila siirretaan kantaan ensimmaisella kirjautumisella
  - Repository valitaan ymparistomuuttujalla; mock jaa offline-fallbackiksi

3B. GOLDEN FIXTURE -TESTIT — tama on pakollinen, ei valinnainen
  - Samat reitit packages/core/sim/fixtures/ista ajetaan MockRepositorya JA
    SupabaseRepositorya vasten (paikallinen supabase start CI:ssa)
  - Lopputilan on oltava identtinen solu solulta: omistaja, strength, visit_days
  - Testaa erityisesti: piiritys usealla lenkilla, paivavahvistus, streak,
    rappeutuminen 20 vrk yli, vapautuminen
  - Jos tulokset eroavat: SQL voittaa, TypeScript korjataan

3C. Realtime
  - Broadcast-kanava per res-6 alue, max 4 tilausta, purku panatessa
  - close_loop broadcastaa diffin koskettamiinsa alueisiin
  - Muiden alueet: vari profiles.color_hue:sta, desaturoituna palettiin
  - Piiritetty solu pulssaa; tapahtumafeed lore-sävyisilla teksteilla
  - Presence: lahipelaajat 50 m tarkkuudella

3D. Chat ja leaderboard
  - Chat Realtime broadcastilla, 280 merkkia, 10 viestia/min. Korvaa v2:n
    992-rivisen Socket.io-palvelimen noin sadalla rivilla.
  - Codex of Dominion: pinta-ala / solut / riistot

Aja docs/tickets/BRDC-REGRESSION-000.md — erityisesti boot-race ja 360px.
```

## Vaihe 4 — The Wager (kaverin haastaminen)

```
Tiketti: docs/tickets/BRDC-WAGER-004.md

GREEN: voin luoda haasteen, jakaa linkin WhatsAppissa, kaveri liittyy ja
30 minuutin päästä on voittaja.

1. RPC:t create_wager (6-merkkinen koodi), join_wager, finish_wager
2. Arena-moodi: keskipiste = molempien sijaintien puoliväli, r = 500 m.
   Arena piirtyy kartalle hehkuvana ympyränä, ulkopuoliset valtaukset eivät laske.
3. Lobby: koodi isolla, jakolinkki (navigator.share), vastustajan valmiustila,
   lähtölaskenta
4. Live-tulostaulu: molempien solut arenassa, ajastin, presence näyttää
   vastustajan tarkan sijainnin (vain kaksintaistelun ajan)
5. finish_wager: voittaja saa vastustajan arenasolut + XP-bonuksen.
   Tulossivu jaettavalla kuvalla (canvas → blob).
6. Reitti #/wager/:code toimii myös uloskirjautuneelle: anonyymi kirjautuminen,
   sitten suoraan lobbyyn.
7. Edge Function: sulje vanhentuneet wagerit automaattisesti.
```

---

## Vaihe 5 — Android APK (ei Play Storea)

```
Tiketti: docs/tickets/BRDC-ANDROID-005.md

1. npx cap add android, VITE_BASE_PATH=/ mobiilibuildiin
2. Foreground service paikannukselle, pysyva notifikaatio "The Ley-line is active".
   Luvat: ACCESS_FINE_LOCATION, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION.
   EI ACCESS_BACKGROUND_LOCATION.
3. Wake lock aktiivisen runin ajaksi, akkuvaroitus HUDissa
4. Mock location -tarkistus: natiivilisays lukee Location.isFromMockProvider
   -> runs.suspicious
5. PAIVITYSMEKANISMI — talla ei ole Play Storea joka tekisi taman puolestasi:
   - version.json GitHub Pagesiin: { version, apk_url, notes, min_client_version }
   - Sovellus tarkistaa kaynnistyksessa, nayttaa lore-savyisen ilmoituksen
   - Kannassa min_client_version; liian vanha klientti saa RPC:sta selkean virheen
     eika pysty kirjoittamaan vaaran muotoista dataa
6. Askelmittari YHTENA luokkana. v2:ssa oli nelja toteutusta joista kolme
   oli lataamatonta kuollutta koodia — lahde valitaan ajossa, ei kopioimalla luokkaa.
7. Ikonit ja splash paletilla, adaptive icon
8. Release-signing: keystore talteen JA varmuuskopioon. Jos se katoaa, et voi
   paivittaa asennettuja APK:ita ollenkaan.
9. Offline-jono: pisteet IndexedDB:hen kun verkkoa ei ole (MockRepository on jo
   olemassa Vaiheesta 1 — kaytetaan sita)
10. docs/ANDROID.md: buildaus, allekirjoitus, jakelu, sideload-ohjeet kaverille
```

## Vaihe 6 — Lore ja kiillotus

```
Aja nämä yksi kerrallaan, älä kaikkia yhdessä:

A. Discoveryt palvelinpuolelta: spawn_discoveries-RPC, keräys 15 m säteellä,
   5 rariteettia v1:n mukaan, lore avautuu keräyksestä
B. Aurora-NPC: ilmestyy level-upeissa ja isoissa valtauksissa, dialogit
   erilliseen JSON-tiedostoon
C. Anchor Stonet: rakennus omalle solulle, +200 puolustus 1 solun säteellä,
   1 kpl / 3 tasoa
D. Audio: ambient-luuppi, valtausääni, corruption-ääni. Aina mykistettävissä.
E. Achievementit + viikkoleaderboard (materialized view + pg_cron)
F. Onboarding: kolme ruutua ennen ensimmäistä kävelyä
G. "The Void reclaims" — NPC-korruptio joka syö 30 vrk koskemattomia soluja
   ja pitää kartan elävänä pienellä pelaajamäärällä
```

---

## Hyödyllisiä komentoja kesken työn

```
/init                    # jos CLAUDE.md pitää päivittää
/clear                   # tyhjennä konteksti vaiheiden välissä — tee tämä aina
"älä koske supabase/migrations/-vanhoihin tiedostoihin, tee uusi migraatio"
"näytä minulle packages/core/rules/capture.ts:n testit ennen kuin muutat sitä"
"aja pnpm test ja näytä tulokset"
```
