# BRDC-CHAR-001 — Hahmonäkymä, ja palkinto paluusta

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | M–L (päivä) |
| **Riippuvuudet** | BRDC-QUEST-001/002, BRDC-LOG-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infiniten testiajon huomiot 2026-09-02 (v0.4.5–0.4.6) |

## 🔴 RED

Pelaajalla ei ole "minä"-näkymää: ei nimeä jonka voi asettaa, ei selitystä sille mitä
Consciousness 6 · Awakening tarkoittaa, ei listaa löydetyistä esineistä eikä
saavutuksista. Ja pouch kertyy hiljaa — tasatunnin sato ilmestyy ilman merkkiä, ja
kahdeksan tunnin poissaolon jälkeen paluu on yhtä äänetön kuin lähtö.

## 🟢 GREEN

- [x] **Character-nappi footerissa** ("◇ You") avaa `CharacterPanel`in (ei-modaali, ESC/✕).
- [x] **Nimi muokattavissa** — `<input>`, tallentuu blurilla/Enterillä. `setPlayerName`
      (`data/profileStore.ts`): trimmaa, katkaisee 24 merkkiin, tyhjä säilyttää vanhan.
      Wagerin export kantaa nimen jo.
- [x] **Consciousness lore-tekstillä** — `features/character/consciousness.ts`: viisi
      virstanpylvästä, kullekin lyhyt rivi + kappale. Level 6 → Awakening-kappale.
      XP-palkki, virstanpylväsluettelo nykyinen korostettuna.
- [x] **Löydetyt esineet** — `getQuestFinds` → `QUEST_ITEMS` nimi + blurb. Tyhjänä
      nimeää kolme salaisuutta ja linkittää `adventures`-codexiin.
- [x] **Saavutukset — oikea unlock-store.** `rules/achievements.ts` (puhdas `earnedNow`,
      11 saavutusta) + `data/achievementStore.ts` (`K.achievements` → `{id: unlockedAt}`,
      ei koskaan poista). `getAchievements` listaa "unlocked <aika sitten>" tai "locked".
      `resetAll` tyhjentää. Testattu (`rules/achievements.test.ts`, `data/achievement.repo.test.ts`).
- [x] **Paluupalkinto.** `usePouchPolling` muistaa edellisen poolin (localStorage
      `es3:last-pouch`) ja raportoi `gain`-deltan. Ensimmäisellä luvulla = poissaolon
      sato → `WelcomeBack`-kortti ("While you were away · +150 timber …") + chime, napautus
      pois. `positiveDelta` puhdas + testattu.
- [x] **Tasatunnin kilinä.** Kun myöhempi settle kasvattaa poolia, `PouchGain` nostaa
      pienen "+N" HUD:n pussin kohdalta ja häivyttää + pling. Kunnioittaa
      `prefers-reduced-motion`.

## Toteutus

`MapView` (399) ja `Hud` (395) olivat katossa. `useMapAside.tsx` kokoaa Help/History/
Character -paneelit yhdeksi hookiksi (−10 riviä MapView'sta). `profileStore.ts` ja
`achievementRepo.ts` irrotettiin MockRepositorystä. `RESOURCE_WORD` jaettu
`territoryFeatures.ts`:ään (`useAwakening` käytti omaa).

## Jatkoon

- **Toast saavutuksen auetessa** — `syncAchievements` palauttaa juuri avautuneet id:t,
  mutta mikään ei vielä näytä niitä HUD-rivinä. Paneeli näyttää aikaleiman. Kytke
  `useMapAside`en tai omaan hookkiin claimin jälkeen.
- Saavutuspalkinnot (XP, unlockit) — nyt pelkkää tunnustusta.

## Ei tässä

- Värin / avatarin muokkaus — vain nimi.
- Hahmokortin jako — Vaihe 5.
