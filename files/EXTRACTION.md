# EXTRACTION.md — mitä v2:sta siirretään v3:een

Tee tämä **kerran, käsin, ennen kuin Claude Code aloittaa.** Sen jälkeen v2-hakemisto on
arkisto, johon ei enää palata. Näin Claude Codelle ei koskaan päädy 53 500 riviä
vanhaa koodia kontekstiin.

Lähde: `C:\Projects\Klitoritari-FinalFantasy\EldrichHorror-v2`
Kohde: uusi `EldrichHorror-v3`

---

## A. Pelivakiot → `packages/core/rules/constants.ts`

**Lähde:** `game/config/GameConfig.js` + `game/systems/TerritorySystem.js`

Kopioi arvot, kirjoita TypeScriptiksi `as const`. Merkitse jokaiseen kommentilla mistä tulee.

```ts
// Löydöt — v2 GameConfig.discovery
export const DISCOVERY = {
  spawnRadiusM: 150,
  collectRadiusM: 5,
  maxActive: 10,
  respawnCooldownMs: 300_000,
  rarities: {
    common:   { chance: 0.60, xp: 50,  glyph: '🌸' },
    uncommon: { chance: 0.25, xp: 100, glyph: '🌟' },
    rare:     { chance: 0.12, xp: 150, glyph: '🔮' },
    epic:     { chance: 0.03, xp: 200, glyph: '💫' },
  },
  types: ['cosmic-fragment','sacred-geometry','ancient-sigil','void-essence'],
} as const;

// Tietoisuus — v2 GameConfig.consciousness
// HUOM: v2:ssa xpPerLevel = 100 ja taulukko loppuu tasoon 20, mutta koodi
// antoi nousta tasolle 118. v3: taso on katkaistava tai kaava jatkettava.
export const LEVELS = [
  { level: 1,  name: 'Dormant',      xp: 0 },
  { level: 5,  name: 'Awakening',    xp: 500 },
  { level: 10, name: 'Aware',        xp: 1500 },
  { level: 15, name: 'Enlightened',  xp: 3000 },
  { level: 20, name: 'Transcendent', xp: 5000 },
] as const;

// Alue — v2 TerritorySystem (Vaihe 6, Anchor-mekaniikka)
export const ANCHOR = {
  expansionRangeM: 50,
  minExpansionDistanceM: 5,
  maxExpansionPerMarkerM: 50,
  borderPointCount: 12,
  initialRadiusM: 20,
  cooldownMs: 900_000,      // 15 min per markkeri
  maxCarrySteps: 100,
  stepMarkerInterval: 50,   // askelta
} as const;

// GPS — v2 GameConfig.backgroundGPS
export const GPS = {
  minDistanceForCountM: 10,
  positionCacheSize: 100,
  consolidateRadiusM: 5,    // v2 PathMarkerService: < 5 m → marker_count++
} as const;
```

**Jätä pois toistaiseksi** (Vaihe 6, kirjaa `docs/backlog/constants-v2.md`:hen sellaisenaan):
Health/Sanity, taistelu, satunnaiskohtaamiset, shrinet, valonsiirto, OSM-rakennukset,
entiteettien spawn-säteet.

---

## B. Lore → `supabase/seed/`

### B1. Evolving Codex
**Lähde:** `game/data/EvolvingCodexData.js` (405 r)
**Kohde:** `supabase/seed/codex.json`

Porrastusrakenne on v2:n paras yksittäinen suunnitteluidea — säilytä se sellaisenaan.
Muunna JSONiksi muotoon:

```json
{
  "cosmic-fragment": {
    "category": "discovery",
    "tiers": [
      { "at": 0,  "title": "First Encounter",     "body": "..." },
      { "at": 1,  "title": "Basic Understanding", "body": "..." },
      { "at": 5,  "title": "Deeper Knowledge",    "body": "..." },
      { "at": 10, "title": "Mastery",             "body": "..." }
    ]
  }
}
```

Kaikki 12 entiteettiä: 4 löytöä, 3 NPC:tä (aurora, hevy, merchant), 3 hirviötä
(void, chaos, shadow), 2 shrineä (wisdom, nature).

**Kopioi tekstit merkki merkiltä.** Älä anna kenenkään "parantaa" niitä siirron yhteydessä.

### B2. Entiteetit
**Lähde:** `game/systems/EntitySpawner.js` (1 039 r) — poimi **vain data, ei logiikkaa**
**Kohde:** `supabase/seed/entities.json`

- NPC:t: Aurora (The Dawn Bringer), Hevy (The Storm Bringer), Wandering Merchant
- Kauppatavarat: Health Potion 50, XP Boost 100, Lucky Charm 150, Map Fragment 200
- Hirviöt: Shadow Lurker (easy/30), Void Spawn (medium/50), Chaos Beast (hard/75),
  Eldritch Horror (epic/100)
- Shrinet: Grove of Eternity, Library of Ancients, Forge of Titans,
  Sanctuary of Serenity, Abyss Gate — siunauksineen

### B3. Fuming Lake -questi
**Lähde:** `game/data/QuestFumingLake.js` (764 r)
**Kohde:** `docs/backlog/quest-fuming-lake.json` — **backlogiin, ei seediin**

Vaiheet, dialogit, cutscene-SVG:t, 10 sijaintia, kuolemat, epilogi. Tämä palaa Vaiheessa 6.
Päätä samalla, jäävätkö Tampere-koordinaatit kovaksi vai tehdäänkö questista siirrettävä.

### B4. Alignment
Peaceful / Cunning / Forceful → `docs/backlog/alignment.md`. Vaihe 6+.

---

## C. Design-tokenit → `packages/ui/styles/tokens.css`

**Lähde:** `game/styles/main.css` (`:root`) + `game/styles/theme-system.css`

Poimi 15 muuttujaa, korjaa `--elditch-blue` → `--eldritch-blue`, ja **laajenna täydeksi
tokenistoksi**. Lopputulos on uusi tiedosto, ei kopio.

```css
:root {
  /* Väripohja — v2 main.css */
  --void-black:      #0a0612;
  --cosmic-purple:   #4a1a5c;
  --eldritch-blue:   #1e2a4a;   /* v2:ssa kirjoitusvirhe: --elditch-blue */
  --mystic-cyan:     #00d4ff;
  --sacred-gold:     #ffd700;
  --awareness-green: #00ff88;

  /* Lasi — v2 */
  --glass-bg:     rgba(26, 12, 38, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);

  /* UUTTA — näitä ei ole kummassakaan versiossa */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --text-xs: clamp(0.75rem, 2vw, 0.8rem);
  --text-sm: clamp(0.875rem, 2.5vw, 0.9rem);
  --text-md: clamp(1rem, 3vw, 1.1rem);
  --text-lg: clamp(1.25rem, 4vw, 1.5rem);
  --text-xl: clamp(1.75rem, 6vw, 2.5rem);
  --touch-min: 44px;
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px;
}
```

**Teemat:** Cosmic / Void / Mystic + high-contrast — kopioi `theme-system.css`:n
`--theme-*`-arvot taulukkona, toteuta `[data-theme]`-attribuutilla.

**Fontit:** v2:n Courier New + Segoe UI **korvataan** v1:n valinnoilla, self-hostattuina:
```
@fontsource/cinzel      → otsikot, mystinen
@fontsource/orbitron    → numerot, HUD
@fontsource/inter       → leipäteksti
```
v2:n `Spectral` ei ladannut mistään — sitä ei siirretä.

**Tavoite:** yksi tiedosto, **alle 800 riviä**. v2:ssa oli 34 tiedostoa ja 11 204 riviä.

---

## D. Algoritmit → SQL

**Lähde:** `server/services/PathMarkerService.js`

Konsolidointi-idea siirtyy `submit_trail_batch`iin: jos uusi piste on < 5 m edellisestä,
älä lisää riviä. v3 lisää siihen validoinnin (tarkkuus, nopeus, aikaväli), jota v2:ssa
ei ollut.

**Lähde:** `game/systems/TerritorySystem.js` — lue, ymmärrä, **älä kopioi**.
Kirjoita `docs/backlog/anchor-mechanic.md` joka kuvaa mekaniikan sanallisesti
(12 rajapistettä, työntö ulospäin, markkerin kantaminen, 15 min jäähdytys).
Toteutus Vaiheessa 6 puhtaana funktiona.

---

## E. Bugilista → testeiksi

**Lähde:** `CRITICAL_FIXES_NEEDED.md`, `BACKLOG_v4.2.md`
**Kohde:** `docs/tickets/BRDC-REGRESSION-000.md`

Kirjaa jokainen v2:n dokumentoitu vika testitapauksena. Ne on lueteltu MASTERPLANin
kohdassa 7. Nämä testit kirjoitetaan **ennen** vastaavaa ominaisuutta.

---

## F. Mitä EI siirretä

Merkitse tämä listaksi, johon voi osoittaa kun houkutus iskee:

| | Rivejä | Miksi ei |
|---|---:|---|
| `game/systems/*` (43 kpl) | ~26 000 | Globaalit `window`-luokat, EventBus-kytkennät, ei moduuleja |
| `game/ui/*` (16 kpl) | ~6 000 | HTML merkkijonoista; React korvaa |
| `game/core/*` | 1 300 | Zustand + TanStack Query korvaa |
| `server/*` | 3 951 | Supabase RPC + Realtime korvaa |
| `tests/*` | 8 134 | Kattavuus mitattuna 0 % — arvo todentamaton |
| Kuollut koodi | 2 033 | 3 lataamatonta askelmittaria + `OtherPlayersRenderer` |
| 112 × `*.md` | — | Yksi `CLAUDE.md` korvaa. Poimi vain bugilistat (E) |
| 35 × debug-`*.html` | — | Playwright korvaa |
| `game/styles/*` (34 kpl) | 11 204 | Vain muuttujat poimitaan (C) |
| `.env` | — | **Rotatoi avaimet, älä kopioi** |
| `coverage/` | — | Vanhentunut, 0 osumaa |

**Yhteensä siirtymättä jäävä koodi: ~53 000 riviä.** Siirtyvä osuus on käytännössä
konfiguraatiota ja lore-tekstiä — arviolta 1 500 riviä dataa.

Tämä on tarkoitus. v2:n arvo on sisällössä ja opituissa asioissa, ei toteutuksessa.

---

## G. Tarkistuslista ennen kuin Claude Code aloittaa

- [ ] Supabase-, Google-, OpenRouter- ja Heroku-avaimet rotatoitu
- [ ] `packages/core/rules/constants.ts` kirjoitettu (A)
- [ ] `supabase/seed/codex.json` + `entities.json` (B1, B2)
- [ ] `docs/backlog/` — questi, alignment, anchor, parkitut vakiot (B3, B4, D)
- [ ] `packages/ui/styles/tokens.css` (C)
- [ ] `docs/tickets/BRDC-REGRESSION-000.md` (E)
- [ ] `CLAUDE.md` repon juuressa
- [ ] `supabase/migrations/0001_init.sql` paikallaan
- [ ] v2-hakemisto **ei ole** v3-repon sisällä eikä symlinkattuna
