# BRDC-MANA-002 — Paikka maksaa molempia: mana loitsuihin, viisaus tutkimukseen

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 4, päätös P3 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-MANA-001, BRDC-KEEP-002, BRDC-TECH-001 |
| **Status** | `done` — 2026-09-09 (v0.5.50) |
| **Valmius** | 100 % — portti vihreä, 1022 testiä; kenttätesti Infinitellä |
| **Lähde** | Infinite 2026-09-09: *"pidetään mana, sillä voi loitsia.. viisautta tulee aina saman verran kun manaa ja sitä käytetään tutkimiseen"* ja *"nyt temppeli ja kotiruutu antaa molempia +6 per tunti"* |

## 🔴 RED

PIVOTin kohta 4 sanoi ensin *"Mana poistuu — pelkkä Viisaus"*. Koodista selvisi ettei se
ole kenttä vaan alijärjestelmä: **seitsemän loitsua maksaa manaa** (40–80,
`spell.ts:188`), `rules/mana.ts`, kahdeksan vakiota, alttari, temppelit, Keepin
Mana-välilehti. Infinite kumosi kohdan saman päivän aikana → **P3**.

Ongelma ei siis ollut mana vaan **viisauden lähde**. Viisautta sai kahdella tavalla:
Library-rakennuksesta, tai **kanavoimalla manaa viisaudeksi alttarilla**
(`MANA_TO_WISDOM_RATE = 5`, `MANA_CHANNEL_STEP = 25`). Jälkimmäinen on vaihtokauppa, ja
vaihtokauppa on nappi jota pitää muistaa painaa: tutkimuksen eteneminen riippui siitä että
pelaaja käy Keepissä painamassa "Channel" kaksikymmentäviisi manaa kerrallaan.

Se ei ole mekaniikka vaan kotityö.

## 🟢 GREEN

- [x] **Paikka maksaa saman luvun kahdesti.** `manaBonus` → `placeBonus`, palauttaa
      `{ mana, wisdom }` samalla `manaRate`-luvulla. Yksi funktio, yksi kutsupaikka
      (`pouch.ts:68`).
- [x] **`MANA_TEMPLE_RATE` 4 → 6.** Temppeli ja Hearthin Anchor maksavat nyt yhtä paljon,
      ja kumpikin maksaa molempia — juuri kuten P3 sanoo.
- [x] **Kanavointi poistettu kokonaan:** `channelMana`, `ChannelRefusal`, `ChannelResult`,
      `channelManaFor`, `ChannelOutcome`, `GameRepository.channelMana`,
      `MockRepository.channelMana`, `useKeepEconomy.onChannel`, `ManaPanel`in kanavointirivi,
      `MANA_TO_WISDOM_RATE`, `MANA_CHANNEL_STEP` ja lokin `'channel'`-selite.
- [x] **Alttari kertoo mitä se tekee:** *"6 mana/h · 6 wisdom/h"* ja rivi
      *"Every place you hold pays both — mana for the Rites you cast, wisdom for the
      Research you spend it on."*
- [x] `ManaPanel`in *"At its height"* ei ole enää napin tekstinä `'—'`, vaan napissa lukee
      mitä se on ja vasen sarake sanoo mitä tehdään.
- [x] Loitsujen manakustannukset **ennallaan** — mana on yhä se millä loitsitaan.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1022**) + `pnpm build` vihreä.
      `constants.ts` osui 402 riviin matkalla ja tiivistettiin takaisin alle rajan.
- [x] `mana.test.ts` — `placeBonus` maksaa molempiin pooleihin, myös temppelin
      laajennuksen kanssa; dormantti ja omistamaton paikka eivät maksa kumpaakaan.
- [x] `keep.repo.test.ts` — uusi *"what a place pays (P3)"*: kolme tuntia tuottaa
      `3 × MANA_ANCHOR_RATE` **sekä** manaa että viisautta, ja alttarin nosto nostaa
      molempia, ei vain sitä minkä mukaan se on nimetty.
- [x] `spell.repo.test.ts` — kaksi testiä mittasi viisautta olettaen että vain Insight
      tuottaa sitä. Ne mittaavat nyt **loitsun oman osuuden**: `6 × (perH + ANCHOR_RATE)`
      loitsun aikana, ja vanhenemisen jälkeen kertyy `8 × ANCHOR_RATE` eikä yhtään
      loitsun osuutta. Sama väite, kestävämpi mittari.
- [x] e2e `temple.spec.ts` + `research.spec.ts` vihreät.
- [ ] Kenttä: seiso Hearthilla tunti → mana **ja** viisaus nousivat kuudella. *(Infinite ajaa.)*

## Seuraus jota kannattaa katsoa kentällä

Viisaus tulee nyt **ilman mitään nappia**. Tutkimus etenee kävelemällä ja pitämällä maata,
niin kuin kaikki muukin. Se tekee kohdan 3 (kevyt tutkimuspuu) mahdolliseksi ilman että
puun juurelle pitää rakentaa Library ensin — ja se on syytä mitata: **onko 6/h liian
nopea** kun juuriteknologia maksaa 20 wisdomia, eli reilut kolme tuntia yhdellä Hearthilla?

## Ei tässä

- Tutkimuspuun rakenne ja bonukset — PIVOT kohta 3, oma tikettinsä.
- Viisauden kertyminen uuden ruudun avaamisesta (PIVOT kohta 4:n toinen lähde) — se on
  `CLAIM_YIELD`in sukua ja kuuluu talouden tikettiin, ei tähän.
- Library-rakennuksen rooli nyt kun viisautta tulee muutenkin — katsotaan kentän jälkeen.
