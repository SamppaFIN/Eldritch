# 🔍 ANALYSIS — EldrichHorror-v2 (Eldritch Sanctuary v2)

**Analysoitu:** 2026-08-26
**Kohde:** `c:/Projects/Klitoritari-FinalFantasy/EldrichHorror-v2`
**Remote:** `https://github.com/SamppaFIN/EldrichHorror-v2.git` (branch `main`)
**Commitit:** 130 · **Aikaväli:** 2025-10-08 → 2025-10-23 (16 päivää)
**Versio koodissa:** `config.js` → `ALPHA 1.6.0` · `package.json` → `1.4.0` · `server/package.json` → `4.0.0` ⚠️ *kolme eri versiota*

> Tämä on **vain analyysi**. Koodiin ei ole koskettu.
> Kaikki luvut on laskettu koodikannasta, ei dokumenteista — dokumentit ovat osin ristiriidassa koodin kanssa (§8).

---

## 1. Hakemistorakenne ja moduulien vastuut

### 1.1 Taso 1 — juuri

```
EldrichHorror-v2/
├── game/            🎮 Selainpeli — koko pelilogiikka (39 018 riviä JS)
├── server/          🌐 Node.js-multiplayerpalvelin (3 951 riviä JS)
├── tests/           🧪 Jest-testit, juuritason (8 134 riviä)
├── docs/            📚 5 arkkitehtuuridokumenttia + archive/
├── coverage/        📊 Jest-coverage-raportti (vanhentunut, ks. §8)
├── .cursor/         🖼️ Screenshotit
├── 112 × *.md       📄 Status-, bugi- ja release-dokumentteja
├── 35 × *.html      🔧 Debug- ja demotyökaluja
└── 8 × *.js         🛠️ Irrallisia skriptejä (2 418 riviä)
```

**Juuren tila:** 112 markdown-tiedostoa ja 35 HTML-tiedostoa juuressa. Nimeämisessä ei ole
järjestelmää (`FIXES_APPLIED.md`, `FIXES_APPLIED_SESSION2.md`, `FIXES_SUMMARY.md`,
`CRITICAL_FIXES_NEEDED.md`). Ajantasaista dokumenttia ei pysty päättelemään nimestä eikä sisällöstä.

### 1.2 Taso 2–3 — `game/` (pelin ydin)

| Polku | Tiedostoja | Rivejä | Vastuu |
|-------|-----------:|-------:|--------|
| `game/index.html` | 1 | — | **Kaikki 68 `<script>`-tagia.** Ei bundleria, ei moduuleja. Latausjärjestys = riippuvuusgraafi |
| `game/config.js` | 1 | 49 | Ympäristötunnistus (localhost vs. Heroku), palvelin-URL, versio |
| `game/config/` | 2 | ~200 | `GameConfig.js` = kaikki pelivakiot (§6). `google-oauth.js` = OAuth-client-id |
| `game/core/` | 3 | 1 300 | `EventBus.js` (globaali pub/sub), `StateManager.js` (tila + localStorage), `Game.js` (989 r, orkestraattori) |
| `game/systems/` | **43** | ~26 000 | Kaikki pelijärjestelmät. Ks. §1.3 |
| `game/ui/` | 16 | ~6 000 | Modaalit ja `UIManager`. Jokainen rakentaa oman HTML:nsä merkkijonoista |
| `game/rendering/` | 2 | ~700 | `BaseRenderer` (tukikohtagrafiikka), `LightParticleRenderer` (partikkelit) |
| `game/data/` | 2 | 1 169 | `EvolvingCodexData.js` (405 r, lore), `QuestFumingLake.js` (764 r, questi + SVG-cutscenet) |
| `game/styles/` | **34** | **11 204** | Yksi CSS-tiedosto per ominaisuus. `:root`-lohko on vain `main.css`:ssä |
| `game/tests/` | 2 | ~400 | `QuestSystemTests.js` + selaimessa ajettava testisivu |

### 1.3 `game/systems/` — 43 järjestelmää vastuittain

**Sijainti ja liike (7)**
| Moduuli | Rivejä | Vastuu | Ladattu? |
|---------|-------:|--------|:--------:|
| `GeolocationSystem.js` | 850 | `watchPosition`, tarkkuussuodatus, sijaintitapahtumat | ✅ |
| `MapSystem.js` | **4 081** | Leaflet-kartta, kaikki markkerit, klusterointi, jäljet, persistointi | ✅ |
| `BackgroundGPSSystem.js` | 483 | Sijainnin seuranta taustalla, etäisyyskertymä | ✅ |
| `AndroidPedometerSystem.js` | 1 246 | Askelmittari + askelmarkkerien pudotus (50 askelen välein) | ✅ |
| `ImprovedStepCounterSystem.js` | 680 | Askelmittari | ❌ **kuollut** |
| `StepCounterSystem.js` | 653 | Askelmittari | ❌ **kuollut** |
| `SamsungPedometerSystem.js` | 567 | Askelmittari | ❌ **kuollut** |

**Pelimekaniikka (11)**
| Moduuli | Rivejä | Vastuu |
|---------|-------:|--------|
| `DiscoverySystem.js` | ~350 | Löytöjen spawnaus ja automaattinen keräys 5 m säteellä |
| `EntitySpawner.js` | 1 039 | Shrinet, NPC:t, hirviöt. Sisältää entiteettien nimet ja lore-tekstit |
| `ConsciousnessSystem.js` | ~300 | XP, tasot, tietoisuusvaiheet |
| `HealthSanitySystem.js` | 407 | Health/Sanity, regen, kynnysarvot |
| `RandomEncounterSystem.js` | 499 | Satunnaiskohtaamiset (2 min välein, 5 % todennäköisyys) |
| `OneTimeEncounterSystem.js` | ~250 | Kertaluontoiset kohtaamiset per sijainti |
| `QuestSystem.js` | 510 | Questien tila ja eteneminen |
| `QuestMarkerSystem.js` | **2 342** | Questimarkkerit kartalla, itemit, questi-interaktiot |
| `QuestSetupSystem.js` | 811 | Questien alustus | ⚠️ **kytketty pois** (`Game.js:506–509`) |
| `BuffSystem.js` | ~250 | Väliaikaiset buffit |
| `ItemLedgerSystem.js` | ~200 | Esinekirjanpito |

**Alue ja rakentaminen (5)**
| Moduuli | Rivejä | Vastuu |
|---------|-------:|--------|
| `TerritorySystem.js` | 1 295 | **Aluevaltaus** — rajapisteet, laajentuminen askelmarkkereista, polygoni |
| `BasePlacementSystem.js` | 470 | Tukikohdan sijoitus kartalle |
| `BaseBuildingSystem.js` | ~300 | Tukikohdan rakentaminen/tasot |
| `LightTransferSystem.js` | 704 | Valonsiirto markkerien välillä 100 m säteellä, partikkelit |
| `SpatialWisdomSystem.js` | 483 | "Tilallinen viisaus" — paikkasidonnaiset oivallukset |

**Esitys ja tunnelma (7)**
`VisualEffectsSystem.js` (~350), `BackgroundEffectsSystem.js` (505),
`EldritchAudioEngine.js` (751, proseduraalinen ääni), `QuestAudioEffects.js` (~200),
`VoiceManager.js` (887, TTS), `ThemeSystem.js` (418, 3 teemaa), `EvolvingCodexSystem.js` (410).

**Infra ja diagnostiikka (9)**
`MultiplayerSystem.js` (420, Socket.io-klientti), `OtherPlayersRenderer.js` (133, ❌ kuollut),
`GuestModeSystem.js` (~300), `AIService.js` + `MockAIService.js` (OpenRouter-integraatio),
`OSMBuildingService.js` + `BuildingOverlaySystem.js` (Overpass API, rakennusten värjäys),
`WakeLockSystem.js`, `PerformanceMonitor.js`, `PerformanceOptimizer.js`,
`GPSDiagnosticSystem.js`, `GoogleOAuthDiagnostic.js`.

### 1.4 Taso 2–3 — `server/`

| Polku | Vastuu |
|-------|--------|
| `server/index.js` (992 r) | Express + Socket.io. 11 REST-endpointia, 18 socket-tapahtumaa |
| `server/config/supabase.js` | Supabase-klientin alustus |
| `server/services/AuthService.js` | Rekisteröinti, kirjautuminen, JWT, Google OAuth |
| `server/services/GameStateService.js` | Pelitilan lataus/tallennus per pelaaja |
| `server/services/PathMarkerService.js` | **GPS-jäljen palvelinpuoli** — markkerien konsolidointi 5 m säteellä (Haversine) |
| `server/scripts/*.sql` | Skeema, chat-taulut, siivousskriptit |
| `server/Procfile` | Heroku-deploy |

---

## 2. Teknologiat

| Kerros | Valinta | Versio | Huomiot |
|--------|---------|--------|---------|
| **Framework** | **Ei mitään** — vanilla JS, globaalit luokat | ES2015+ | Ei React/Vue/Svelte. Ei ES-moduuleja: kaikki `window`-scopessa |
| **Buildaus** | **Ei mitään** | — | Ei bundleria, ei transpilointia, ei minifiointia. 68 `<script>`-tagia ladataan järjestyksessä. Babel on olemassa **vain Jestiä varten** (`.babelrc`) |
| **Kartta** | **Leaflet 1.9.4** | CDN (`unpkg.com`) | Rasteritiilet OpenStreetMapista. Ei vektoritiiliä, ei WebGL:ää |
| **Tilanhallinta** | Oma `StateManager` + `EventBus` (singletonit `window`issä) | — | localStorage-persistointi. **29 erillistä avainta ilman yhtenäistä nimiavaruutta** (§2.1) |
| **Backend** | Express 4.18 + Socket.io 4.6 | Node ≥18 | Deployattu Herokuun |
| **Tietokanta** | **Supabase (PostgreSQL)** | `@supabase/supabase-js` 2.38 | 9 taulua (§3.2) |
| **Auth** | Google OAuth (GSI) + oma sähköposti/salasana + guest mode | — | Kolme rinnakkaista polkua |
| **Testit** | Jest 29 + jsdom | — | `npm test`. Coverage-raportti on vanhentunut (§8) |
| **Ulkoiset API:t** | Overpass API (OSM-rakennukset), OpenRouter (AI-dialogi) | — | Overpass-välimuisti 7 vrk |
| **Fontit** | `Courier New`, `Segoe UI`, `Spectral` | — | ⚠️ **`Spectral` ei ole ladattu** — ei `@font-face`, ei Google Fonts -linkkiä. Putoaa geneeriseen `serif`iin |
| **Hosting** | Heroku (sekä klientti että palvelin) | — | `client-server.js` tarjoilee staattiset tiedostot |

### 2.1 Kaikki 29 localStorage-avainta

```
Peli:      eldritch_game_state · eldritch_sanctuary_v2_state · consciousness_state
Markkerit: eldritch_stepMarkers · eldritch_discoveryMarkers · eldritch_playerTrails
Shrinet:   eldritch_shrineLevels · eldritch_shrineExperience
Asetukset: eldritch_preferences · questSetupData
GPS:       backgroundGPS · backgroundTime · lastKnownPosition · lastActivity
Auth:      auth_token · auth_provider · user_id · player_id · username · display_name
           · email · profile_picture · mock_auth_token · mock_username
Guest:     is_guest · guest_mode_data · guest_game_state · guest_chat_data
           · guest_conversion_data
```

**Havainnot:**
- Kaksi eri "pelitila"-avainta (`eldritch_game_state`, `eldritch_sanctuary_v2_state`) — päällekkäisyys
- **Ei versiokenttää missään** → vanha save ladataan sellaisenaan (aiheutti `CRITICAL_FIXES_NEEDED.md`:n taso-118-bugin)
- Auth-tiedot tallennetaan yksittäisinä avaimina, ei objektina
- Ei quota-käsittelyä, ei debounce-logiikkaa

---

## 3. Multiplayer, backend ja tietokanta

### 3.1 Kyllä — kaikki kolme on olemassa

**Multiplayer:** `game/systems/MultiplayerSystem.js` (420 r) + Socket.io 4.6.1 CDN:stä.
Palvelinpuoli `server/index.js`. Toiminnallisuus: sijaintisynkronointi, lähellä olevat pelaajat,
reaaliaikainen chat, löytöjen broadcast, NPC-kohtaamisten jako.

**Socket-tapahtumat (18):**
```
authenticate · auth:success · auth:error · disconnect
position:update · players:request-nearby · players:nearby · online:count
chat:message · discovery:collected · achievement:earned · npc:encounter
game:state:save · game:state:saved · game:state:loaded · game:state:error
path-marker:save · path-marker:saved
```

**REST-endpointit (11):**
```
GET  /                            GET  /health
POST /api/auth/register           POST /api/auth/login
POST /api/auth/verify             POST /api/auth/google
GET  /api/game-state/:playerId    POST /api/game-state/:playerId
GET  /api/players/nearby          GET  /api/chat/history
DELETE /api/chat/message/:messageId
```

### 3.2 Tietokanta — Supabase / PostgreSQL, 9 taulua

| Taulu | Sisältö |
|-------|---------|
| `players` | Pelaajaprofiilit |
| `player_game_state` | Pelitila (XP, taso, health, sanity) |
| `player_sessions` | Istunnot |
| `player_position_history` | **GPS-jälki** — sijainnit, `marker_type`, `marker_count` |
| `player_achievements` | Saavutukset |
| `player_interactions` | Pelaajien väliset interaktiot |
| `npc_encounters` | NPC-kohtaamiset |
| `shrine_activations` | Shrine-aktivoinnit |
| `chat_messages` | Chat-historia |

**Deploy:** Heroku, `PRODUCTION_SERVER_URL = https://eldritch-sanctuary-server-d0a9fc0734de.herokuapp.com`

⚠️ **Riskihavainto:** `.env` on repossa (ei `.gitignore`:ssa polulla, joka estäisi sen).
Jos siinä on Supabasen `service_role`-avain, se on vuotanut historiaan. **Tarkista ja rotatoi.**

---

## 4. GPS-jäljen tallennus ja aluevaltaus

**Molemmat ovat olemassa ja melko pitkälle vietyjä.** Tämä on v2:n omaperäisin osa.

### 4.1 GPS-jälki — kolme rinnakkaista mekanismia

| Mekanismi | Missä | Miten |
|-----------|-------|-------|
| **Askelmarkkerit** | `AndroidPedometerSystem.js:785–866` | Joka **50. askel** pudotetaan markkeri nykyiseen sijaintiin. Emittoi `step-marker:place`, `light-transfer:marker-added`, `territory:marker-placed` |
| **Polyline-jälki** | `MapSystem.js:1529–1562` | `playerTrails: Map<playerId, LatLng[]>` → Leaflet-polyline per pelaaja. Myös muille pelaajille |
| **Palvelinpuolen jälki** | `PathMarkerService.js` | Tallennus `player_position_history`-tauluun. **Konsolidointi:** jos uusi piste on < 5 m vanhasta, kasvatetaan `marker_count` uuden rivin sijaan (Haversine) |

**Persistointi:** `eldritch_stepMarkers` ja `eldritch_playerTrails` localStoragessa; polyline
palautetaan sivun latauksessa (`MapSystem.js:2964–2975`).

### 4.2 Aluevaltaus — `TerritorySystem.js` (1 295 r)

```javascript
config = {
    expansionRange: 50,          // m — askelmarkkeri laajentaa aluetta tältä etäisyydeltä
    minExpansionDistance: 5,     // m — minimietäisyys tukikohdasta
    maxExpansionPerMarker: 50,   // m — maksimilaajennus per markkeri
    borderPointCount: 12,        // rajapisteiden määrä (12-kulmio)
    initialRadius: 20            // m — alkuperäinen alue
}
cooldownDuration = 15 * 60 * 1000   // 15 min per markkeri
maxCarrySteps = 100                  // askelta jonka markkeria voi "kantaa"
```

**Mekaniikka:** Tukikohdan ympärille luodaan 12-kulmainen raja 20 m säteellä. Kävellessä
pudotetut askelmarkkerit **työntävät lähintä rajapistettä ulospäin** (max 50 m per markkeri).
Alue piirretään Leaflet-polygonina. Rajamarkkerin voi "poimia mukaan" ja kantaa uuteen paikkaan
(max 100 askelta), minkä jälkeen markkeri jäähtyy 15 min.

**Lisäksi:** `LightTransferSystem` yhdistää markkerit toisiinsa 100 m säteellä valonsäteillä,
ja `BuildingOverlaySystem` värjää OSM-rakennukset alueen sisällä (Overpass API, 500 m säde,
max 500 rakennusta).

**Tila:** Ydinlogiikka on kirjoitettu ja committoitu (`5670fc1 Fix StateManager reference mismatch
- territory expansion now works`), mutta juuressa on kaksi erillistä debug-työkalua
(`territory-expansion-debug.html`, `territory-expansion-debug-mobile.html`), mikä viittaa siihen
että toiminta ei ollut luotettavaa ilman apuvälineitä.

---

## 5. Design-tokenit ja fontit

### 5.1 Kaikki CSS-muuttujat

`:root`-lohko on vain `game/styles/main.css`:ssä. `theme-system.css` määrittelee samat
teemamuuttujat uudelleen kolmeen teemaan.

**Perusvärit (`main.css`)**
```css
--void-black:      #0a0612;   /* Tausta */
--cosmic-purple:   #4a1a5c;   /* Ensisijainen korostus */
--elditch-blue:    #1e2a4a;   /* Toissijainen  [sic — kirjoitusvirhe muuttujan nimessä] */
--mystic-cyan:     #00d4ff;   /* Korostus, hehku */
--sacred-gold:     #ffd700;   /* Palkinnot, harvinaisuus */
--awareness-green: #00ff88;   /* Onnistuminen, tietoisuus */
```

**Lasiefekti**
```css
--glass-bg:     rgba(26, 12, 38, 0.7);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
```

**Teemamuuttujat (`theme-system.css`) — 3 teemaa**

| Muuttuja | 🟣 Cosmic (oletus) | ⚫ Void | 🔵 Mystic |
|----------|-------------------|---------|-----------|
| `--theme-primary` | `#4a1a5c` | `#0a0612` | `#00d4ff` |
| `--theme-secondary` | `#6b2c91` | `#1a0d2e` | `#0099cc` |
| `--theme-accent` | `#8b3a9b` | `#2d1b4e` | `#006699` |
| `--theme-glow` | `#8b3a9b` | `#2d1b4e` | `#00d4ff` |
| `--theme-background` | `linear-gradient(135deg,#1a0d2e,#4a1a5c,#6b2c91)` | `linear-gradient(135deg,#0a0612,#1a0d2e,#2d1b4e)` | `linear-gradient(135deg,#001122,#003366,#006699)` |

**High-contrast-tila** (`theme-system.css:265`)
```css
--theme-text:   #ffffff;
--theme-border: #ffffff;
```

**Yhteensä: 15 uniikkia muuttujanimeä.** Vertailun vuoksi: CSS:ää on 11 204 riviä.
Suurin osa väreistä, väleistä ja fonttikoista on kovakoodattu suoraan sääntöihin.

### 5.2 Fontit

| Fontti | Käyttökohteita | Tila |
|--------|---------------:|------|
| `'Courier New', monospace` | 9 | ✅ Järjestelmäfontti |
| `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` | 5 | ✅ Järjestelmäfontti (Windows-painotteinen) |
| `'Spectral', serif !important` | 2 | 🔴 **Rikki** — fonttia ei ladata mistään |
| `monospace` | 1 | ✅ |

**Ei webfontteja.** `grep` ei löydä yhtään `fonts.googleapis.com`-linkkiä eikä `@font-face`-sääntöä.

### 5.3 Puuttuvat design-perusasiat

| Asia | Tila |
|------|------|
| Yhtenäinen väliskaala (spacing) | ❌ Ei ole |
| Typografinen skaala | ❌ Ei ole, kovakoodatut `px`-arvot |
| `clamp()`-responsiivisuus | ❌ Ei ole |
| Touch target -minimi (44 px) | ❌ Ei tokenia |
| `prefers-reduced-motion` | ❌ Ei löydy |
| `:focus-visible` | ❌ Ei löydy |
| Väriavaruus | `#hex` / `rgba()` — ei OKLCH |

---

## 6. Pelivakiot — kaikki yhdessä

Lähde: `game/config/GameConfig.js`, ellei toisin mainita.

### 6.1 Kartta ja sijainti
```javascript
map.defaultZoom            = 16
map.tileLayer              = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
geolocation.enableHighAccuracy = true
geolocation.timeout        = 10000    // ms
geolocation.maximumAge     = 0
backgroundGPS.minDistanceForCount = 10    // m — minimi jotta lasketaan liikkeeksi
backgroundGPS.positionCacheSize   = 100
```

### 6.2 Löydöt
```javascript
discovery.spawnRadius      = 150      // m
discovery.discoveryRadius  = 5        // m — automaattinen keräys
discovery.maxDiscoveries   = 10       // yhtä aikaa aktiivisena
discovery.respawnCooldown  = 300000   // 5 min
```

| Harvinaisuus | Todennäköisyys | XP | Emoji |
|--------------|---------------:|---:|:-----:|
| common | 60 % | 50 | 🌸 |
| uncommon | 25 % | 100 | 🌟 |
| rare | 12 % | 150 | 🔮 |
| epic | 3 % | 200 | 💫 |

**Tyypit:** `cosmic-fragment` · `sacred-geometry` · `ancient-sigil` · `void-essence`

### 6.3 Tietoisuus (XP / tasot)
```javascript
consciousness.xpPerLevel = 100
```
| Taso | Nimi | XP vaadittu |
|-----:|------|------------:|
| 1 | Dormant | 0 |
| 5 | Awakening | 500 |
| 10 | Aware | 1 500 |
| 15 | Enlightened | 3 000 |
| 20 | Transcendent | 5 000 |

⚠️ Taulukko loppuu tasoon 20, mutta koodi antaa nousta pidemmälle — tuotannossa nähtiin **taso 118**.

### 6.4 Health & Sanity
```javascript
maxHealth = 100          maxSanity = 100
healthRegen = 5          // HP / min
sanityRegen = 3          // Sanity / min
lowHealthThreshold = 25  lowSanityThreshold = 30
```

### 6.5 Satunnaiskohtaamiset
```javascript
enabled         = true
checkInterval   = 120000   // 2 min
encounterChance = 0.05     // 5 %  (kommentti: laskettu 15 %:sta)
cooldown        = 300000   // 5 min
```

### 6.6 Taistelu
```javascript
attackDamage            = { min: 15, max: 25 }
defendReduction         = 0.5     // 50 %
affirmExistenceDamage   = 40      // Void-olentoja vastaan
meditationHealing       = { min: 20, max: 30 }
fleeSuccessRate         = 0.7     // 70 %
```

### 6.7 Shrinet
```javascript
cooldownDuration = 300000   // 5 min  (kommentti: muutettu 1 tunnista)
meditationXP     = 20
```
| Siunaus | XP | Muu vaikutus |
|---------|---:|--------------|
| nature | 50 | +30 health |
| wisdom | 100 | level up |
| power | 75 | +25 % XP, 10 min |
| peace | 60 | poistaa efektit |
| void | 100 | void-vastustus, 10 min |

### 6.8 Entiteettien spawn-säteet
```javascript
shrineSpawnRadius  = 300   // m
npcSpawnRadius     = 500   // m
monsterSpawnRadius = 400   // m
```

### 6.9 Valonsiirto
```javascript
connectionRadius    = 100   // m
maxConnections      = 50
proximityThreshold  = 50    // m
performanceMode     = 'auto'
partikkelit: ambient {count:2, speed:0.5, size:2}
             active  {count:10, speed:2.0, size:4}
             event   {count:50, speed:3.0, size:6, duration:2000}
```

### 6.10 Alue (`TerritorySystem.js`)
```javascript
expansionRange       = 50        // m
minExpansionDistance = 5         // m
maxExpansionPerMarker= 50        // m
borderPointCount     = 12
initialRadius        = 20        // m
cooldownDuration     = 900000    // 15 min per markkeri
maxCarrySteps        = 100
stepMarkerInterval   = 50        // askelta (AndroidPedometerSystem)
```

### 6.11 OSM-rakennukset
```javascript
overpassApiUrl        = 'https://overpass-api.de/api/interpreter'
cacheExpiration       = 604800000   // 7 vrk
maxBuildingsToRender  = 500
colorOpacity          = 0.4
strokeColor           = '#48dbfb'
fetchRadius           = 500          // m
```

### 6.12 UI
```javascript
notificationDuration = 3000   // ms
toastPosition        = 'top-right'
```

---

## 7. Lore-tekstit

### 7.1 `EvolvingCodexData.js` — porrastuva tietämys (405 r)

Rakenne: jokaisella entiteetillä on **tasoja**, jotka aukeavat kun pelaaja kohtaa sen useammin.
Tämä on v2:n paras yksittäinen suunnitteluidea.

**Löydöt (4):** `cosmic-fragment` (tasot 0/1/5/10) · `sacred-geometry` (0/1/3/7) ·
`ancient-sigil` · `void-essence`
**NPC:t (3):** `aurora` · `hevy` · `merchant`
**Hirviöt (3):** `void` · `chaos` · `shadow`
**Shrinet (2):** `wisdom` · `nature`

**Esimerkki porrastuksesta — Cosmic Fragment:**
> **Taso 0 — First Encounter:** *"A shimmering piece of stardust. Its purpose is unknown, but it pulses with gentle energy."*
> **Taso 1 — Basic Understanding:** *"Cosmic Fragments are condensed starlight that fell from the celestial realm. Each carries echoes of ancient cosmic wisdom."*
> **Taso 5 — Deeper Knowledge:** *"These fragments are not mere objects—they are memories of stars. Each one contains the last thought of a dying sun, preserved in crystalline form."*
> **Taso 10 — Mastery:** *"Fragments resonate with prime number frequencies… They form constellation patterns when viewed together… Some fragments hum with specific musical notes."*

**Sacred Geometry, taso 7 — Sacred Architect:**
> *"You now understand that Sacred Geometry isn't discovered—it's remembered. These patterns exist in your DNA, in the structure of atoms, in the orbits of planets. You ARE sacred geometry, exploring itself."*

### 7.2 `QuestFumingLake.js` — "The Fuming Lake" (764 r)

```
Nimi:      The Fuming Lake — "A Reasonably Unreasonable Adventure"
Sävy:      "A Terry Pratchett meets HP Lovecraft adventure"
Vaikeus:   EPIC · Suositeltu taso 5 · Kesto 30–45 min
Palkinnot: 500 XP · titteli "Servant of the Deep"
           · saavutus "The Lake Incident" · lore "cthulhu_awakening"
```

**Sijainnit — kovakoodattu Tampereelle (Näsijärven pohjoispuoli, ~61.47 N, 23.73 E):**
| Avain | Koordinaatit | Nimi |
|-------|--------------|------|
| `start` | 61.47291, 23.72588 | Statue of the Boy |
| `lake` | 61.47526, 23.72804 | The Fuming Lake |
| `trinket` | 61.47414, 23.72867 | Shiny Trinket |
| `hermit` | 61.47308, 23.73261 | Hermit's Hovel |
| `staff` | 61.47359, 23.73332 | Ancient Staff |
| `troll` | 61.47658, 23.73055 | Troll Bridge |
| `wisdom` | 61.47594, 23.72406 | Wisdom Stone |
| `cthulhu` | 61.47775, 23.72721 | The Deep |
| `healingShrine` | 61.47295, 23.72668 | Healing Shrine |
| `sanityShrine` | 61.47697, 23.73098 | Sanity Shrine |

**Vaiheet:** `start` → `lake` → `hermit` → `troll` → `cthulhu` → `completion`
Lisäksi `deaths` (`fumes`, `troll`) ja `epilogue`.

**Rakenne per vaihe:** `cutscene` (inline-SVG animaatioineen) · `encounter` (dialogi) ·
`items` (koordinaatit + keräys).
Loppuvaikutus sisältää mm. `{ maxSanity: -5, xpMultiplier: 1.1 }` — pysyvä hinta viisaudesta.

**Avausteksti:**
> *"In which a boy's statue, a fuming lake, a hermit, a troll, and an Elder God come together in a tale that is simultaneously cosmic horror and comedic farce."*

### 7.3 Entiteetit (`EntitySpawner.js`)

**NPC:t**
| Nimi | Rooli |
|------|-------|
| ✨ **Aurora, The Dawn Bringer** | Opastava jumalatar, "godly female voice" |
| ⚡ **Hevy, The Storm Bringer** | Ukkosen ääni, edustaa jumalaa |
| 🏪 **Wandering Merchant** | Kauppias |

**Kauppiaan tavarat**
| Tavara | Hinta | Vaikutus |
|--------|------:|----------|
| Health Potion | 50 | +50 health |
| XP Boost | 100 | ×2.0 XP |
| Lucky Charm | 150 | +0.2 onni |
| Map Fragment | 200 | paljastaa kartan 500 m |

**Hirviöt**
| Tyyppi | Nimi | Vaikeus | XP |
|--------|------|---------|---:|
| shadow | 👤 Shadow Lurker | easy | 30 |
| void | 🌑 Void Spawn | medium | 50 |
| chaos | 👹 Chaos Beast | hard | 75 |
| eldritch | 🐙 Eldritch Horror | epic | 100 |

**Shrinet**
| Tyyppi | Nimi | Siunaus |
|--------|------|---------|
| nature | 🌳 Grove of Eternity | Nature's Embrace |
| wisdom | 📚 Library of Ancients | Eternal Knowledge |
| power | ⚡ Forge of Titans | Titan's Strength |
| peace | ☮️ Sanctuary of Serenity | Inner Peace |
| void | 🌑 Abyss Gate | Void's Touch |

### 7.4 Alignment-järjestelmä
README mainitsee kolme linjausta, joita dialogivalinnat seuraavat:
**Peaceful · Cunning · Forceful**

---

## 8. Mikä toimii, mikä on kesken, mikä on rikki

### ✅ Toimii (committoitu, dokumentoitu toimivaksi, ei TODO-merkintöjä)

| Alue | Peruste |
|------|---------|
| **EventBus + StateManager** | Yksinkertaisia, koko peli rakentuu niiden päälle, merkitty "DIAMOND QUALITY" |
| **Leaflet-kartta + markkerit** | Ydintoiminto, useita korjauskierroksia |
| **Löytöjärjestelmä** | Spawn + keräys 5 m säteellä, XP:llä ja harvinaisuuksilla |
| **Evolving Codex** | Data valmis, porrastuva sisältö kirjoitettu |
| **Quest-data "The Fuming Lake"** | 764 riviä valmista sisältöä SVG-cutsceneineen |
| **Proseduraalinen audio** | `EldritchAudioEngine` 751 r, alkulukuihin perustuva synteesi |
| **Multiplayer-perusta** | Chat + sijaintisynkronointi committoitu ("CONGRATULATIONS_MULTIPLAYER.md") |
| **OSM-rakennusten värjäys** | Uusin ominaisuus, `78b7fa4` |
| **Teemajärjestelmä** | 3 teemaa toimivat |
| **GPS-jälki + aluevaltaus** | Ydinlogiikka olemassa, korjattu `5670fc1`:ssä |

### ⚠️ Kesken

| Asia | Sijainti | Tila |
|------|----------|------|
| **Markkeriklusterointi** | `MapSystem.js:922–927` | 🔴 **Kytketty pois päältä.** `// TEMPORARILY DISABLE CLUSTERING` + `// TODO: Re-enable clustering once the logic is fixed`. README mainostaa tätä pääominaisuutena |
| **QuestSetupSystem** | `Game.js:506–509` | Kommentoitu pois: `// Quest Setup System (disabled for now)`. 811 riviä käyttämätöntä koodia |
| **Questin item-efektit** | `QuestMarkerSystem.js:1677` | `// TODO: Implement item effect system` |
| **Questin kohtaamiset** | `QuestMarkerSystem.js:1718` | `// TODO: Implement encounter system` |
| **Chat-reaktiot** | `ChatModal.js:838` | `// TODO: Send to server when backend supports it` — vain paikallinen |
| **Virheilmoitukset** | `Game.js:883` | `alert(message); // TODO: Replace with proper modal` |
| **Askelmarkkerin sijoitus** | `AndroidPedometerSystem.js:1162` | `// For now, it's a placeholder to prevent the error` |
| **Preferences-testit** | `PreferencesModal.js:594` | `"Test not implemented yet"` |
| **Guest mode** | `BACKLOG_v4.2.md` | Merkitty ⚠️ "needs implementation" |

### 🔴 Rikki / vakavat ongelmat

| # | Ongelma | Todiste | Vaikutus |
|---|---------|---------|----------|
| 1 | **Mobiililayout rikki** | `BACKLOG_v4.2.md` BUG-001, **P0**, S23 Ultra | Estää mobiilipelaamisen — ja peli on mobiilipeli |
| 2 | **Vanha save-data korruptoi pelin** | `CRITICAL_FIXES_NEEDED.md` — pelaaja tasolla 118, kohtaamiset ohitettu | Ei versiointia, ei resettiä |
| 3 | **Race condition bootissa** | `CRITICAL_FIXES_NEEDED.md` — `EntitySpawner` emittoi `entity:spawned` ennen kuin `MapSystem` kuuntelee | Shrinet eivät ilmesty kartalle |
| 4 | **Aurora/Hevy-kohtaamiset eivät laukea** | `CRITICAL_FIXES_NEEDED.md` + `BACKLOG_v4.2.md` | Pääjuoni ei etene mobiilissa |
| 5 | **Testikattavuus 0 %** | `coverage/lcov.info`: 53 tiedostoa, 8 727 riviä, **0 osumaa** | Coverage-raportti on generoitu ilman ajettuja testejä. 8 134 riviä testikoodia, jonka arvo on todentamaton |
| 6 | **`Spectral`-fonttia ei ladata** | Ei `@font-face`, ei Google Fonts -linkkiä | 2 sääntöä putoaa `serif`iin |
| 7 | **2 033 riviä kuollutta koodia** | Ei `index.html`:ssä: `StepCounterSystem` (653), `ImprovedStepCounterSystem` (680), `SamsungPedometerSystem` (567), `OtherPlayersRenderer` (133) | *Korjaus aiempaan arvioon:* rinnakkaisia askelmittareita ei aja neljä — kolme neljästä on lataamatonta kuollutta koodia. Käytössä on vain `AndroidPedometerSystem` |
| 8 | **Kolme eri versionumeroa** | `config.js` = ALPHA 1.6.0, `package.json` = 1.4.0, `server/package.json` = 4.0.0 | Ei tiedetä mikä on julkaistu |
| 9 | **Dokumentaatio on ristiriidassa itsensä kanssa** | `FEATURES_TRACKER.md`: yhteenvetotaulukko "Testing 38/38 implemented", samassa tiedostossa Epic 1: "Unit Tests: ❌ None" | 112 .md-tiedostoa, ei totuuden lähdettä |
| 10 | **`.env` on repossa** | `ls -a` löytää `.env` juuresta | Jos sisältää Supabase-avaimia → **rotatoi ne** |
| 11 | **Ei bundleria, 68 `<script>`-tagia** | `index.html` | 68 peräkkäistä HTTP-pyyntöä mobiiliverkossa. Latausjärjestys on piilotettu riippuvuusgraafi |
| 12 | **`MapSystem.js` 4 081 riviä** | — | Kartta, markkerit, klusterointi, jäljet, persistointi, alueet yhdessä tiedostossa |
| 13 | **Taustaääni jouduttiin poistamaan** | `8d27d19 Disable cosmic humming noise - users find it disrupting` | Viimeisin commit — audio oli päällä oletuksena |
| 14 | **Heroku-riippuvuus staattiselle klientille** | `client-server.js` + `Procfile` | Klientti on staattinen, mutta tarvitsee Node-prosessin. `147ceb3 Fix Heroku client crash` |
| 15 | **CDN-riippuvuudet ilman fallbackia** | Leaflet, Socket.io, Google GSI unpkg/cdn:stä | Yksi CDN-katko = peli ei käynnisty |

### 8.1 Kokonaiskuva

```
Koodirivit yhteensä: ~53 500 JS
  game/    39 018   (43 järjestelmää, 16 modaalia)
  tests/    8 134   (kattavuus mitattuna 0 %)
  server/   3 951
  juuri/    2 418   (irralliset skriptit)
CSS:        11 204  (34 tiedostoa, 15 muuttujaa)
Dokumentit:    112 .md + 35 debug-HTML
Kehitysaika:    16 päivää, 130 committia
```

**Tulkinta:** 16 päivässä on rakennettu poikkeuksellisen paljon sisältöä ja ideoita —
mekaniikat ovat aidosti omaperäisiä (askelmarkkereista kasvava alue, porrastuva codex,
Pratchett-Lovecraft-questi). Ongelma ei ole idea eikä sisältö vaan se, että rakenne ei
kestänyt vauhtia: ei bundleria, ei versioitua tallennusta, ei ajettuja testejä, ei
yhtä totuuden lähdettä. Viimeisimmät commitit korjaavat oireita, eivät syitä.

**v3:lle arvokkainta v2:sta:** pelivakiot (§6), lore (§7), aluevaltausmekaniikka (§4.2),
codexin porrastusrakenne (§7.1) ja bugilista (§8).

---

## 9. Ero v1:een (SamppaFIN/EldrichHorror)

> ⚠️ **Lähdehuomautus:** v1 ei ole tässä koneessa. Tiedot on haettu GitHubista
> (`github.com/SamppaFIN/EldrichHorror`, README + repo-metatiedot), eikä niitä ole voitu
> varmistaa koodista. v2:n luvut ovat mitattuja.

### 9.1 Perusfaktat

| | **v1 — EldrichHorror** | **v2 — EldrichHorror-v2** |
|---|---|---|
| Commitit | 19 | **130** |
| Viimeksi päivitetty | 2025-10-08 | 2025-10-23 |
| Ensimmäinen commit | — | **2025-10-08** ← *v1 loppui samana päivänä kun v2 alkoi* |
| Kieli | Vanilla JS | Vanilla JS |
| Kartta | Leaflet.js | Leaflet 1.9.4 |
| Tallennus | localStorage | localStorage **+ Supabase** |
| Backend | **Ei ole** | Express + Socket.io, Heroku |
| Metodologia | BRDC (Bug Report-Driven Coding) | Sama henki, ei nimettynä |

### 9.2 Rakenne

**v1**
```
game/
├── index.html
├── css/     (theme, geometry, animations, fixes)
├── js/      (main, DiscoverySystem, MapManager, GameState, …)
└── svg/
tickets/
docs/
```

**v2**
```
game/  (config/ core/ systems/×43 ui/×16 rendering/ data/ styles/×34 tests/)
server/  (config/ services/×3 scripts/)
tests/  (unit/ integration/ fixtures/)
docs/  + 112 .md + 35 debug-HTML juuressa
```

Nimeäminen muuttui: `MapManager` → `MapSystem`, `GameState` → `StateManager`.
Kansiorakenne syveni yhdestä `js/`-kansiosta seitsemään alihakemistoon.

### 9.3 Ominaisuusdelta

| Ominaisuus | v1 | v2 |
|---|:---:|:---:|
| GPS-löydöt | ✅ (**10 m** keräyssäde) | ✅ (**5 m** — tiukennettu) |
| 4 harvinaisuustasoa | ✅ | ✅ |
| Consciousness / XP / tasot | ✅ | ✅ |
| Lore-järjestelmä | ✅ staattinen | ✅ **porrastuva Evolving Codex** |
| Animoidut SVG-markkerit | ✅ | ✅ + PBR-kokeilut |
| Offline-tila | ✅ dokumentoitu | ⚠️ ei mainittu |
| **Questit** (Fuming Lake) | ❌ *"roadmap planned"* | ✅ 764 r + SVG-cutscenet |
| **Taistelujärjestelmä** | ❌ | ✅ vuoropohjainen |
| **Health / Sanity** | ❌ | ✅ |
| **Satunnaiskohtaamiset** | ❌ | ✅ 11 tyyppiä |
| **NPC:t äänellä** (Aurora, Hevy) | ❌ | ✅ TTS |
| **Proseduraalinen audio** | ❌ | ✅ alkulukupohjainen synteesi |
| **Askelmittari** | ❌ | ✅ (mutta 3 kuollutta toteutusta) |
| **GPS-jälki / askelmarkkerit** | ❌ | ✅ 3 mekanismia |
| **Aluevaltaus** | ❌ | ✅ `TerritorySystem` 1 295 r |
| **Valonsiirto markkerien välillä** | ❌ | ✅ |
| **Tukikohdan rakentaminen** | ❌ | ✅ |
| **OSM-rakennusten värjäys** | ❌ | ✅ Overpass API |
| **Multiplayer + chat** | ❌ | ✅ Socket.io |
| **Autentikointi** | ❌ | ✅ Google OAuth + email + guest |
| **Tietokanta** | ❌ | ✅ Supabase, 9 taulua |
| **AI-dialogi** | ❌ | ✅ OpenRouter |
| **Teemat** | 1 | 3 + high-contrast |
| **Yksikkötestit** | ❌ | ⚠️ olemassa, kattavuus mitattuna 0 % |

### 9.4 Yhteenveto erosta

v1 oli **yhden idean peli**: kävele, löydä, kerää XP, lue lorea. Yksi `js/`-kansio,
19 committia, ei backendia, ei tiliä. Se oli pieni ja se toimi.

v2 lisäsi 16 päivässä questit, taistelun, sanityn, äänen, äänisynteesin, askelmittarin,
GPS-jäljen, aluevaltauksen, tukikohdat, rakennusdatan, multiplayerin, autentikoinnin,
tietokannan ja AI-dialogin — **ja säilytti v1:n arkkitehtuurin**: vanilla JS, ei bundleria,
globaalit `window`-luokat, käsin ylläpidetty latausjärjestys. `<script>`-tagien määrä kasvoi
kourallisesta 68:aan ja `MapManager` kasvoi `MapSystem`iksi, 4 081 riviä.

**Ero yhdellä lauseella:** v1 oli demo joka toimi, v2 on tuote joka ei mahdu
arkkitehtuuriinsa. Sisältö ja mekaniikat ovat v2:ssa selvästi parempia — perusta ei.

---

## 10. Suositukset v3:lle

Nämä seuraavat suoraan yllä olevista havainnoista. Ne on jo kirjattu tiketeiksi `claude.md`:hen.

| # | Havainto | Seuraus v3:lle | Tiketti |
|---|----------|----------------|:-------:|
| 1 | 68 `<script>`-tagia, ei bundleria | ES-moduulit + yksi bundle | 1 |
| 2 | Ei save-versiointia → taso 118 | `SAVE_VERSION`, hylkää tuntematon | 3 |
| 3 | 29 hajanaista localStorage-avainta | Yksi nimiavaruus `es3_*`, yksi `save()` | 3 |
| 4 | Boot-race: spawn ennen `map:ready` | Deterministinen `await`-ketju | 4, 10 |
| 5 | Kolme kuollutta askelmittaria | Yksi luokka, lähde valitaan ajossa | 8 |
| 6 | Klusterointi kytketty pois, koska rikki | MapLibren natiivi klusterointi | 7 |
| 7 | `MapSystem.js` 4 081 riviä | Kova raja 400 riviä | 6 |
| 8 | 34 CSS-tiedostoa, 15 muuttujaa, 11 204 riviä | Yksi tiedosto, täysi tokenisto, < 800 riviä | 13 |
| 9 | `Spectral` ei lataudu | Fontit ladataan tai niitä ei käytetä | 13 |
| 10 | Mobiililayout P0-rikki | 360 px testataan ensin | 14 |
| 11 | Testikattavuus 0 % | Testit ajetaan, kattavuus todennetaan | 16, 17 |
| 12 | Rasteritiilet + CDN-riippuvuudet | MapLibre + avaimeton vektorilähde, graceful degradation | 6 |
| 13 | Heroku + Supabase + OAuth MVP:ssä | F1 = standalone, ei backendia | §2.0 |
| 14 | 112 status-.md:tä | Yksi `claude.md` | §5.1 |
| 15 | Audio päällä oletuksena → häiritsi | Mykistys oletus, audio opt-in | 15 |
| 16 | `.env` repossa | Tarkista ja rotatoi avaimet **ennen** kuin v2-repoa käytetään mihinkään | — |

---

*Analyysi perustuu koodikannan lukemiseen 2026-08-26. Koodiin ei tehty muutoksia.*
