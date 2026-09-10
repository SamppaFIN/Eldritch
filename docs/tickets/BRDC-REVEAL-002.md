# BRDC-REVEAL-002 — Reveal-nappi ei tehnyt mitään, ja se oli kirjaimellisesti totta

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-REVEAL-001 (`revealOf`), BRDC-CLAIM-009 (`revealBonus`), BRDC-ECON-007 (`PouchGain`) |
| **Status** | `done` — 2026-09-10 (v0.5.60) |
| **Valmius** | 100 % — portti vihreä, step-claim e2e 7/7 |
| **Lähde** | Infinite 2026-09-10: *"mikään nappi ei tee mitään.. lisätään reveal ground nappiin +resurssi notfikaatio ja pling.. kasvata bonuksen saamisprosenttia"* |

## 🔴 RED

Kolme vikaa, ja ensimmäinen niistä tekee kysymyksestä "tuntuuko napista mitään" turhan.

### 1. Kaksi kolmesta paljastuksesta maksoi **nolla**

`TERRAIN_TABLE.plain.resource` on `null`. `revealBonus` teki tästä tyhjän pussin:

```ts
const out = resource ? { [resource]: CLAIM_YIELD * REVEAL_MULT[tier] } : {};
```

ja `revealAt` ohittaa `grantBonus`in tyhjälle bonukselle. Paljonko maasta on plain?
`kindForRegion` antaa 52 % alueista suoraan plainiksi, ja lopuista 48 %:sta 28 %
rispaantuu plainiksi reunoilla — **noin 65 % kartasta**. Eli kaksi kolmesta paljastuksesta
ei siirtänyt yhtään mitään mihinkään.

**Ja siitä oli läpimenevä testi:** *"plain ground with no resource and a common tier pays
nothing"*. Se ei ollut vahinko jota kukaan ei huomannut; se oli kirjattu suunnitelmaksi.

### 2. Loput maksoivat hiljaa

`onReveal` kutsui `refreshRevealed()` ja `onChanged()`. Ei riviä, ei ääntä, ei numeroa.
Nappi vaihtui lauseeksi tasosta ja siinä kaikki. Resurssit tulivat pussiin, mutta pelaaja
sai tietää siitä vain avaamalla HUD:n ja vertaamalla lukuja muistiin.

### 3. Kolme neljästä osui `common`iin

1 % / 5 % / 19 % / 75 % on kirjoitettu peliin jossa paljastaminen on harvinainen tapahtuma.
Se on tapahtuma joka tehdään **joka heksalle jonka ottaa.** `common` maksaa kaksi kertaa
valtauksen verran ja lukee kuin ei mitään.

## 🟢 GREEN

- [x] **Paljastus ei koskaan maksa nollaa.** Maa jolla ei ole omaa resurssia maksaa
      **viisautta** (`PLAIN_REVEAL_RESOURCE`). Viisautta siksi että paljastaminen on
      katsomista ja viisaus on mitä katsomisesta saa — ja siksi että pahiten kärsinyt
      pelaaja oli se jonka naapurusto on pelkkää plainia, eikä hänellä ollut *mitään* tietä
      Researchiin. Testi käy koko ~7500 solun otoksen läpi: jokainen maksaa jotain.
- [x] **Tasojakauma nostettu** 1/5/19/75 → **2/10/33/55**. `common` on yhä yksittäisistä
      todennäköisin, muttei enää kolme neljästä.
- [x] **"+N resurssi" ja pling.** Paljastus syöttää `PouchGain`ia — *saman* laatikon jonka
      Collect käyttää, samoilla väreillä, sanoilla ja plingillä. Kaksi toimintoa jotka
      antavat resursseja näyttävät ja kuulostavat samalta (claude.md §14). `hours: 0`,
      koska paljastus ei ole odotuksen lunastamista.
- [x] **`latestGain(a, b)`** valitsee tuoreimman `at`-leiman mukaan. Naiivi
      `revealGain ?? collected` olisi tarkoittanut että session **ensimmäinen paljastus
      nielaisee jokaisen Collectin sen jälkeen** — paljastuksen palkinto ei koskaan palaa
      nulliksi. Se on oma testinsä.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1104**) + `pnpm build` vihreä.
- [x] `reveal.test.ts`: kaksi testiä kirjoitettu uusiksi ja kaksi lisätty. Se joka väitti
      plainin maksavan nollaa **väittää nyt päinvastaista**, ja uusi *"never pays nothing,
      on any cell in the sample"* käy koko otoksen. Jakauman rajat päivitetty, ja
      `common`ille tuli oma yläraja jottei se pääse takaisin lähes kaikeksi.
- [x] `pouchGain.test.ts` (3): tuorein voittaa kummin päin tahansa · **kumpikaan lähde ei
      varjosta toista pysyvästi** · puuttuva puoli kelpaa.
- [x] e2e `step-claim.spec.ts` +1: paljastuksen jälkeen `.pouch-gain` on näkyvissä ja
      sisältää `+N` — millä maalla kävely sattuikin päättymään. Desktop 7/7.
- [ ] Kenttä: paina Reveal ja katso että laatikko nousee ja pling kuuluu. *(Infinite ajaa.)*

## Huomio jota ei kannata ohittaa

Vika 1 oli **testin suojaama**. Testi luki *"pays nothing"* ja meni läpi vuosikaudet, koska
se kuvasi mitä koodi teki eikä mitä pelin pitäisi tehdä. Kun jokin tuntuu rikkinäiseltä,
läpimenevä testi ei ole todiste siitä ettei se ole — se voi olla vika joka on kirjattu
sopimukseksi.

## Ei tässä

- **Tasokohtainen ääni tai välähdys** (legendary kuulostaisi eri kuin common). Houkuttavaa,
  mutta `MomentFx` on oma järjestelmänsä ja tämä tiketti korjaa nollan.
- **Wonder- ja anomaliasisältö.** `rare` ja `legendary` ovat *paikkoja*; niiden sisältö on
  `BRDC-EVENT-001` ja `BRDC-WONDER-001`. Nostettu osuus tarkoittaa että niitä on nyt enemmän
  odottamassa sisältöä — se on tiedostettu, ei vahinko.
- **Muut napit.** Infinite sanoi *"mikään nappi ei tee mitään"*; tämä kattaa Revealin.
  Jos muissakin on sama hiljaisuus, ne ovat oma tikettinsä ja tämä on niiden malli.
