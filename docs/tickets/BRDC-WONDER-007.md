# BRDC-WONDER-007 — He Who Waits at the Shore

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `rules/landmark.ts`, `data/pouch.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään), `BRDC-LANDMARK-001` (`landmarkOn`) |
| **Lähde** | `worldseed.ts` (`the_boy_who_waits`), `rules/harmalaWonder.ts`in `waits-at-shore` |

## 🔴 RED — mitattu, ei arvattu

Dokumentti: *"+6 culture/h. Any cell adjacent to a landmark yields double culture."*
Jälkimmäinen puolisko on **aidosti uusi, tarkkaan rajattava sääntö** — ei suora
uudelleenkäyttö kuten `BRDC-WONDER-005`/`-006`:

- `landmarkOn(h3)` (`landmark.ts:21`) tarkistaa vain **sen tarkan heksan**, ei naapureita.
  `landmarkBonus` maksaa maamerkin omalle heksalle +2 kulttuuria — tämä on eri asia kuin
  "heksa VIEREESSÄ maamerkkiä tuottaa tuplasti **oman** kulttuurinsa"
- "Oma kulttuuri" ei ole yksi luku yhdessä paikassa: se voi tulla maastosta
  (`TERRAIN_TABLE`), bounty-löydöstä (`bounty.ts`), rakennuksesta (Monument, Vineyard) tai
  itse maamerkistä. Tuplaus koskisi siis **kaikkea kulttuuria jonka se yksi heksa
  tuottaa**, ei yhtä lähdettä — muuten "tuplaa kulttuuri" olisi puolitotuus

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+6 culture/h**, kun ihme on löydetty ja hereillä (`BRDC-WONDER-003`in `wonderBonus`)
- [ ] Uusi `landmarkAdjacent(h3): boolean` (`landmark.ts`): `neighboursOf(h3).some(n =>
      landmarkOn(n) !== null)` — sama muoto kuin `ironAdjacentTo` (`BRDC-BUILD-013`) ja
      `fortified` (`BRDC-CARD-001`): naapurirengas, ei oma heksa
- [ ] Kaksinkertaistus tapahtuu **pouchin kokoamisvaiheessa**, ei jokaisessa erillisessä
      lähteessä: kun ihme on löydetty, jokaisen `landmarkAdjacent`-heksan senhetkinen
      kulttuurisumma (maasto + bounty + rakennus + maamerkki, jo laskettuna) kerrotaan
      kahdella ennen kuin se lisätään loppusummaan. Yksi kertolasku yhdessä paikassa,
      ei neljä eri sääntöä joita pitäisi muistaa muuttaa yhdessä
- [ ] Testit: heksa jonka viereisenä maamerkki, ilman ihmettä (ei muutosta), ihmeen kanssa
      (kulttuuri tuplattu); heksa joka EI ole vieressä (ei muutosta, vaikka ihme olisi
      löydetty muualta realmissa)

## Päätös Infiniteltä

- **Tuplaako myös itse maamerkkiheksan oman +2 kulttuurin, jos SE heksa sattuu olemaan
  toisen maamerkin vieressä?** Härmälänrannassa on 14 maamerkkiheksaa (`BRDC-SEED-002`)
  suhteellisen tiheässä — kaksi vierekkäistä maamerkkiä ei ole mahdotonta, ja silloin
  kysymys on aito, ei teoreettinen

## Ei tässä

- Muiden resurssien tuplaus — dokumentti nimeää vain kulttuurin
