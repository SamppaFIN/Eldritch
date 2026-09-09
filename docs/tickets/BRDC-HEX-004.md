# BRDC-HEX-004 — Jalat ratkaisevat: käyntipäivät ruutukortissa ja osuuden perusteena

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 5 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-HEX-001 (`ownedDays`), BRDC-WAGER-JSON-006 (`shared`) |
| **Status** | `done` — 2026-09-09 (v0.5.53) |
| **Valmius** | 100 % — portti vihreä, 1044 testiä; kenttätesti Infinitellä |
| **Lähde** | Infinite 2026-09-09: *"Ruudun kortissa näytetään monenako erillisenä päivänä pelaaja on käynyt kyseisessä ruudussa. Tästä lasketaan %-omistus muiden käyneiden pelaajien kesken (enemmän käynyt = suurempi osuus)."* |

## 🔴 RED

**Osuuden ratkaisi vahvuus, ei käynnit.** `localShare` jakoi kiistellyn solun tuoton sen
mukaan kumpi oli vahvempi *sillä hetkellä kun Wager-viesti tuotiin* — ja päivät olivat
vain tasatilanteen ratkaisija. Se on tuomio jota pelaaja ei voi muuttaa pelaamalla: viestin
saapumishetken vahvuus on mennyttä, eikä siihen voi kävellä.

**Ja käyntipäivät olivat piilossa.** `Cell.ownedDays` on kumulatiivinen ja kulkee jo langan
yli (`WireCell.d`), mutta ruutukortissa se näkyi vain historiavirkkeen perään liimattuna
(*"You claimed this from the Void today · walked on 12 days"*) ja vain kun luku oli yli
yhden. Se ei ollut perustieto vaan alaviite — vaikka se on nyt se luku josta osuus
lasketaan.

Sivuseikka joka teki numerosta läpinäkymättömän: omistusrengas näytti prosentin
kertomatta mistä se tuli.

## 🟢 GREEN

- [x] **Päivät ratkaisevat osuuden.** `localShare` jakaa nyt `myDays` / `theirDays`
      -suhteessa. Vahvuus tuontihetkellä on **varakeino** — vanhalle merkinnälle joka ei
      kanna päiviä, ja aidolle tasapelille. Tasajako on viimeinen keino.
- [x] **Puuttuva päivälukema on *tuntematon*, ei nolla.** Jos vain toinen puoli kantaa
      luvun, osuus ei siirry — muuten paikallinen pelaaja saisi koko solun teknikaliteetilla.
      Se on ainoa tapa jolla tämä sääntö voisi hiljaa huijata jotakuta, ja se on testattu.
- [x] **Käyntipäivät ovat perustieto.** `CellWorth`in `<dl>`: **Walked · 12 days**, Ground /
      Yields / Neighbours -rivien rinnalla. Poistettu historiavirkkeen hännästä.
- [x] **Rengas kertoo perustelunsa:** *"You walked it on 6 days, they on 2."* — tai
      vahvuus­varakeinon kohdalla sen. Prosentti ilman perustelua on tuomio ilman juttua.
- [x] `localShare` **eriytettiin omaan tiedostoonsa** `rules/share.ts`. `terrain.ts` oli
      399/400 eikä kestänyt muutosta; sama fraktio vastaa kahteen kysymykseen — mitä pussi
      kerää jaetusta heksasta ja mitä kortti näyttää renkaana — joten se on oma käsitteensä.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1044**) + `pnpm build` vihreä.
      Sekä `terrain.ts` että `terrain.test.ts` osuivat rajaan matkalla ja **jaettiin**,
      ei tiivistetty.
- [x] Uusi `share.test.ts` (7): ulkopuolinen maa on kokonaan omaa · päivät jakavat ·
      **päivät voittavat vahvuuden** (kolminkertainen vahvuus häviää yhdeksälle päivälle
      yhtä vastaan) · vahvuus varakeinona vanhalle merkinnälle ja tasapelille ·
      **toispuoleinen päivälukema ei siirrä osuutta** · tyhjä tilanne jakautuu tasan.
- [x] `terrain.test.ts` säilyttää yhden integraatiotarkistuksen: trickle noudattaa
      osuutta. Sääntö itse testataan sen omassa tiedostossa.
- [x] e2e `wager.spec.ts` (jaettu maa) ja `step-claim.spec.ts` desktopilla 10/10.
- [ ] Kenttä: kävele rivaalin kanssa jaettua ruutua useampana päivänä → osuus kasvaa.
      *(Infinite ajaa.)*

## Seuraus kohdalle 6

PIVOT sanoo että sama %-luku jakaa **rakennuksen tuoton** muille kävijöille. Nyt se luku on
olemassa, se perustuu päiviin, ja se on näkyvissä kortissa — eli kohta 6 voi nojata siihen
sen sijaan että keksisi oman mittarinsa.

Huomio jonka nostan sitä varten: päätös **P1** (valtaaja perii rakennuksen) tarkoittaa että
`localShare` puhuu *kävijöistä*, ei valtaajista. Ne kaksi eivät ole ristiriidassa, mutta ne
pitää pitää erillään kun kohta 6 kirjoitetaan.

## Ei tässä

- Rakennustuoton jako käyntipäivien mukaan — PIVOT kohta 6.
- `OwnershipNote`in näyttäminen yksin omistetulla solulla (*"Yours 100% · Theirs 0%"*).
  Se on `BRDC-WAGER-JSON-007`:n tietoinen valinta; jos se on kohinaa, se on oma tikettinsä.
- `visitDays`in kahden päivän katto — se on `capture.ts`:n suoja rajattomalta kasvulta ja
  eri käsite kuin `ownedDays`. Ei kosketa.
