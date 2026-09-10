# BRDC-SPELL-003 — Kaksi riittiä jotka ylettyvät jalkoja kauemmas

| | |
|---|---|
| **Vaihe** | 3 → PIVOT-2026-09-09 kohta 7 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-SPELL-001 (`SPELLS`, `castSpell`), BRDC-CLAIM-009 (askelvaltauksen kirjoitustapa) |
| **Status** | `done` — 2026-09-10 (v0.5.56) |
| **Valmius** | 100 % koodin osalta; kenttätesti Infinitellä |
| **Lähde** | PIVOT §7: *"Tutki alue — paljastaa ruudun/alueen tiedot ilman fyysistä käyntiä. Valtaa alue — välitön valtaus, erillinen kävelypohjaisesta."* |

## 🔴 RED

**Manalla ei voinut tehdä mitään mikä koskee maata jolla et seiso.**

Viisi kotiriittiä olivat kaikki joko koko valtakunnan bonuksia (`domain`) tai oman solun
suojaus (`bulwark`). Kaksi jäljellä olevaa (`snare`, `dominion`) ovat vihollissoluille eikä
niitä voi heittää kotona lainkaan — `castSpell` torjuu ne `carry-in-a-wager`illa.
Nettotulos: **mana oli tuottobonusten valuutta**, ei tapa vaikuttaa karttaan.

Kaksi konkreettista aukkoa:

1. **Maastoa ei voinut nähdä ennen kävelyä.** Kartta piirtää vain ne solut jotka ovat
   storessa. Pelaaja ei voinut tietää missä vuori on ennen kuin käveli sinne — eli
   kaivoksen paikan valinta oli arvaus, vaikka `terrainForCell` tietää vastauksen.
2. **Ilmakoululla ei ollut kotiriittiä lainkaan.** `spell.ts`:n oma docstring sanoi sen
   ääneen: *"Every school has a home Rite except air."* Guild-Craft avasi ainoastaan
   `dominion`in, joka on Wager-riitti.

## 🟢 GREEN

- [x] **Farsight** (Ilma · Guild-Craft · **30 manaa** · reach 2). Kirjoittaa storeen
      tyhjät solut kahden renkaan säteellä kohteesta — 19 heksaa maata jonka maaston ja
      omistajan kartta osaa jo piirtää. **Ei koske olemassa olevaan soluun**: se voi olla
      omistettu, rapistuva tai kantaa Workia, eikä mikään niistä kuulu Farsightille.
      Ilmakoulu sai kotiriittinsä.
- [x] **Quickening** (Maa · Fortification · **120 manaa** · reach 1). Valtaa **vapaan**
      maan yhden renkaan säteellä kohteesta, kun kohde koskettaa omaa maatasi.
- [x] **Quickening ei koskaan koske omistettuun soluun.** Piiritys vie kaksi tai kolme
      kävelyä eri päivinä (CLAUDE.md §11); jos 120 manaa kääntäisi omistetun solun, koko
      malli olisi valinnainen. Omistettu maa ohitetaan hiljaa, oli omistaja kuka tahansa.
- [x] **Hinta on sarjan korkein, tarkoituksella.** 6 manaa tunnissa yhdestä paikasta →
      120 manaa on kaksikymmentä tuntia. Saman seitsemän heksan kävely vie kymmenen
      minuuttia. Riitti ei ole oikotie vaan **tapa ylettyä maalle jonne jalat eivät pääse**
      — veden yli, aidan taakse, moottoritien toiselle puolelle. Testi vartioi että se on
      kalliimpi kuin mikään muu riitti.
- [x] **Välitön riitti ei jää pyörimään.** `durationMs: 0` riitti ei mene `K.spells`iin
      lainkaan — `activeSpells` pudottaisi sen joka tapauksessa, ja lista joka vain kasvaa
      on lista joka pitää ennen pitkää lakaista. Ei toista lippua tarkistettavaksi.
- [x] **Quickeningin valtaus kirjoitetaan kuin askelvaltaus** (`stepStore.ts`):
      `resolveCapture` per solu, yksi `awardClaims`, XP per solu, yksi `awaken`-lokirivi.
      Näin vallattu heksa ei ole eri lajin heksa.
- [x] **`Spell.reach`** taulukkoon, ei `constants.ts`:ään — samasta syystä kuin `cost` ja
      `durationMs` ovat siellä: se on yhden riitin luku. (`constants.ts` oli myös 400/400
      eikä olisi kestänyt sitä; jako on oikea kummastakin syystä.)
- [x] `SpellPanel` antaa jokaiselle ei-domain-riitille kohteen: kortin oman heksan.
      Bulwark vaatii maan olevan omaasi, Quickening vaatii ettei se ole — molemmat
      torjunnat sanovat mitä tehdä (*"Aim it at free ground that touches yours."*).

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1071**) + `pnpm build` vihreä.
- [x] `spell.test.ts` +8: molemmat toimivat heti eivätkä jää pyörimään · Farsight osuu
      mihin tahansa heksaan · mutta tarvitsee silti kohteen · Quickening ottaa vapaan maan
      joka koskettaa omaasi · torjuu maan joka ei kosketa mitään · **torjuu oman maasi
      nimeltä** eikä veloita siitä · on kallein · ilma sai kotiriitin.
- [x] `spell.repo.test.ts` +7: Farsight kirjoittaa maan storeen ilman askelta · ei
      ylikirjoita olemassa olevaa · Quickening valtaa ja kirjaa `awaken`in ·
      **ei koske rivaalin soluun** (omistaja ja vahvuus muuttumattomat) · veloittaa manan ·
      kumpikaan ei jää `getActiveSpells`iin.
- [x] `SpellPanel.test.ts` +1 ja `HOME_SPELLS` päivitetty seitsemään.
- [~] **Ei e2e:tä.** Molemmat vaativat medieval-teknologian ja satoja manaa; niiden
      syöttäminen tarkoittaisi `resources`-avaimen kylvöä, jota sovellus kirjoittaa
      jatkuvasti — se on juuri se kilpajuoksu joka on jo kerran purettu. Repository-testit
      ajavat saman polun oikean MockRepositoryn läpi.
- [ ] Kenttä: tutki alue kävelemättä, katso maasto, valitse kaivoksen paikka.
      *(Infinite ajaa.)*

## Tasapaino, avoimena kentälle

Nämä luvut ovat **arvioita, eivät mittauksia**: 30 ja 120 manaa, 2 ja 1 rengasta.
Perustelu on kirjoitettu koodiin, mutta kukaan ei ole vielä pelannut niillä. Erityisesti
Quickeningin hinta on koko riitin ainoa jarru — jos se osoittautuu halvaksi, peli muuttuu
kävelemisestä odottamiseksi, ja se on tämän tiketin todellinen riski.

## Ei tässä

- **Sotajoukkoihin ja puolustuksiin liittyvät loitsut** — PIVOT §7 sanoo ne myöhemmiksi.
- **Farsightin maastonratkaisu tiileistä.** Paljastettu solu saa `terrainForCell`in
  hash-vastauksen, saman minkä omistamaton naapurisolu saa tänään. Tiiliratkaisu on
  `BRDC-TERRAIN-002`in polku eikä muutu tässä.
- **Watchtowerin paljastussäde 3** (PIVOT §6:n loppu). Se on rakennus, ei riitti, ja se on
  oma tikettinsä — mutta se on nyt selvästi Farsightin sukulainen ja kannattaa suunnitella
  sen rinnalla.
