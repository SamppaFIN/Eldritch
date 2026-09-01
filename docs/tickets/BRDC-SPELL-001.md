# BRDC-SPELL-001 — Loitsut: tutkimus, valta, esto, suoja

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-MANA-001, BRDC-WAGER-JSON-001 |
| **Status** | `done` — 2026-09-01 (kotikoulukunnat; valta/esto → BRDC-SPELL-002; kartta-merkit `[~]`) |
| **Valmius** | 85 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (M3–M4), §3 |

## 🔴 RED

Manaa kertyy eikä sitä voi käyttää mihinkään. Ja pelissä, joka on nimeltään Eldritch
Sanctuary, ei ole yhtään loitsua — mystiikka on tähän asti ollut sanastoa, ei mekaniikkaa.

## 🟢 GREEN

- [x] Neljä koulukuntaa `SPELLS`:ssä: `research`, `protection`, `block`, `dominion`
      (tutkimus / suoja / esto / valta)
- [x] `SPELLS`-taulukko: `cost` (mana), `scope`, `durationMs`, `domainBonusPerH`,
      `tech` — numerot taulussa kuten `BUILDINGS`/`TECHS`
- [x] Loitsulla on **kohde ja se on tarkistettu**: `castSpell` — `domain` (ei kohdetta),
      `own-cell` (`not-your-cell` nimeltä), `enemy-cell` → `carry-in-a-wager`
- [x] Vaikutus **määräaikainen**: `activeSpells(list, now)` pudottaa umpeutuneet
      luettaessa, ei ajastinta
- [~] Aktiiviset loitsut HUDissa (◇-rivi, tunnit) ja solupaneelin Rituaalit-osiossa
      (jäljellä oleva aika). **Kartta-merkit siirretty** — läänin­laajuisella loitsulla
      ei ole yhtä solua merkittäväksi; solukohtaiset merkit tulevat SPELL-002:n
      kohdennettujen loitsujen kanssa
- [x] Umpeutunut loitsu **poistuu laskennasta luettaessa** — testi:
      "stops counting a research spell the moment it has expired"
- [x] Puhtaat funktiot testattu (`rules/spell.test.ts` 12, `data/spell.repo.test.ts` 6):
      taulu, jokainen kieltäytymispolku, aikakelaus; `insight`/`bulwark` päästä päähän

## Toteutettu 2026-09-01

**Kaksi kotikoulukuntaa toimii nyt; vihollista koskevat odottavat SPELL-002:ta.**

- `rules/spell.ts` (puhdas): `SPELLS`-taulu (4), `castSpell(ctx, id, target, castAt)` —
  `ward.ts`:n muoto, järjestetyt kiellot; `activeSpells` / `spellRemaining` ainoat kelloa
  katsovat; `domainSpellBonus` tutkimukselle; `BULWARK_SHELTER_MS` suojalle.
- **Tutkimus (`insight`)**: +6 wisdom/h koko läänille 12 h. Menee `perHourBonus`:iin
  `pouch.ts`:ssä `manaBonus`:n ja `buildingBonus`:n rinnalle. **Ensimmäinen wisdom-lähde
  pelissä** — teknologiapuu on nyt saavutettavissa ilman onnenkantamoista.
- **Suoja (`bulwark`)**: ostaa solulle 24 h decay-kelloaikaa, leivottu soluun
  `Cell.shelteredMs`:ään heti loihdittaessa (additiivinen, ei skeemanostoa) — tunnit
  säilyvät vaikka loitsun oma laskuri päättyy. `projectCell` vähentää sen; muu
  decay-polku ei muutu.
- `data/spellStore.ts` (ohut sauma): `readSpells`, `castSpellAt` — settle, sääntö,
  kirjoita vain onnistuessa; lista karsiutuu `activeSpells`:llä joka loihdinnalla.
- `GameRepository.getActiveSpells` / `castSpell`; `MockRepository` (yksirivit).
- UI: `SpellPanel.tsx` (peili `BuildPanel`:lle) — Insight koko läänille, Bulwark soluun;
  `useSelection` `spell`-bindaus; HUD ◇-rivi. `MapView` mahtui: `Sanctum.tsx` sai
  `SanctumDialogs`-kääreen (molemmat dialogit + tilan), MapView 400 → 388.
- Testit: +20 (`spell.test.ts` 12, `spell.repo.test.ts` 6, `SpellPanel.test.ts` 2),
  `decay.test.ts` +1 (`shelteredMs`). **606 vihreää.**

## Ei tässä (SPELL-002)

- **Esto (`snare`) ja valta (`dominion`)** — vihollisen heksaan ei ylety ilman palvelinta.
  Taulussa `via: 'wager'`, `castSpell` palauttaa `carry-in-a-wager`. Kulkevat
  Wager-viestissä ja vaikuttavat siinä taistelussa (checksum, deterministinen).
- Solukohtaiset kartta-merkit aktiivisille loitsuille.

## 🔴 Ratkaistava: vihollisen heksaan ei ylety

Suunnitelman §3 lupaa opetustapahtuman *"Opit Estoloitsun. Aseta se vihollisen heksalle!"*

**Vihollisen heksaa ei ole olemassa reaaliajassa.** Ilman palvelinta peli tietää muiden
pelaajien alueista vain sen, mitä `world.json` viimeksi kertoi (`BRDC-SHARE-001`) tai
mitä Wager-viesti toi mukanaan (`BRDC-WAGER-JSON-001`). Kumpikaan ei ota vastaan
vaikutusta: et voi kirjoittaa toisen pelaajan tilaan.

Kaksi rehellistä tapaa:

1. **Loitsu kulkee Wager-viestissä.** Asetat sen haasteeseen, ja se vaikuttaa siinä
   taistelussa. Deterministinen, tarkistettavissa checksumilla, toimii tänään
2. **Loitsu vaikuttaa vain omaan lääniisi** — suoja, tuotto, näkyvyys. Hyökkäysloitsut
   odottavat Supabasea

Suositus: **molemmat, eri koulukunnille.** Esto ja valta kulkevat Wagerissa; tutkimus
ja suoja vaikuttavat kotona. Näin jokainen koulukunta tekee jotain jo nyt, eikä yksikään
lupaa jotain, mitä arkkitehtuuri ei kanna.

## Ei tässä

- Uniikit ihmeloitsut → `BRDC-WONDER-001`
- Loitsuefektien grafiikka → `BRDC-ART-001`
- Palvelinvahvistettu hyökkäysloitsu vieraaseen lääniin. Supabase, myöhemmin
