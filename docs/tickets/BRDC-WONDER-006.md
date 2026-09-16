# BRDC-WONDER-006 — The Yuggoth Lens

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `rules/spell.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään) |
| **Lähde** | `worldseed.ts` (`ley_observatory`), `rules/harmalaWonder.ts`in `yuggoth-lens` |

## 🔴 RED — mitattu, ei arvattu

Dokumentti: *"+10 wisdom/h. Every Rite costs 25% less mana."* Yksi selkeä koukutuspiste,
ei arvattu vaan luettu:

- `castSpell` (`spell.ts:311`) maksaa manan yhdellä rivillä: `spend(ctx.pool, {mana:
  spell.cost})`. `CastContext` (`ctx`) kantaa jo `owned`, `researched`, `pool`, `active`,
  `playerId` — sama olio johon `BRDC-BUILD-013` lisäsi `tavernInProvince`in ja
  `BRDC-CARD-001` `fortified`in samaan tapaan muualla. Yksi uusi kenttä, ei uutta
  arkkitehtuuria

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+10 wisdom/h**, kun ihme on löydetty ja hereillä (`BRDC-WONDER-003`in `wonderBonus`)
- [ ] `CastContext`iin uusi kenttä, esim. `manaDiscount: number` (0–1), jonka kutsuja
      laskee (onko Yuggoth Lens löydetty). `castSpell`in oma rivi muuttuu
      `spend(ctx.pool, {mana: Math.ceil(spell.cost * (1 - ctx.manaDiscount))})`.
      `Math.ceil`, ei `Math.floor` — pyöristys ei saa tehdä mistään ilmaista
- [ ] Testit: 25% alennus pyöristettynä oikein pienillä ja suurilla kustannuksilla
      (`spell.cost` vaihtelee 30:stä 120:een taulukossa), ei alennusta ilman ihmettä

## Päätös Infiniteltä

- **Onko 25% liikaa vai liian vähän?** Halvin riitti (30 mana) putoaisi 23:een,
  kallein (120) 90:een — `sim/`in oma mittaus (ticketin oma tapa, `BRDC-BUILD-012`in
  siege-mittaus on malli) kertoisi muuttaako tämä minkään riitin käytännön
  saatavuuden ennen kuin se on peräti tutkittu

## Ei tässä

- Tutkimuksen (teknologian) hintaan ei kosketa — vain riitin castaamisen manakustannus
