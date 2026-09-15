# BRDC-ART-005 — Harvinaisuusasteikko, Diablon väreillä

| | |
|---|---|
| **Alue** | `packages/ui/src/styles/tokens.css`, löydöt, Työt, Riitit, wonderit |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `done` (v0.6.18) — kanava pystyssä, asteikko mitattu |
| **Lähde** | Infinite 2026-09-15: *"todo listalle värit.. ota diablo sarjan värit, common, maaginen, rare, uniikke, legendaarinen jne."* |

## 🔴 RED

Pelissä on jo useita asioita joilla on **aste**: bonusresurssien tierit
(`revealOf`: common → epic), wonderit, Työt, Riitit. Mikään niistä ei sano astettaan
värillä — ne ovat kaikki samaa tekstiä samalla sävyllä, ja pelaaja oppii arvon ulkoa
eikä näe sitä.

Diablon asteikko on se sanasto jonka kaikki osaavat lukea ilman selitystä: harmaa
common, sininen maaginen, keltainen rare, ruskea/kulta uniikki, oranssi legendaarinen.

## 🟢 GREEN

- [x] **Kysymys 2 vastattu: harvinaisuus on oma kanavansa.** Reunuslista ja eyebrow, ei
      koskaan luku, resurssisana tai kartan merkki. Kartta pysyy resurssivärisenä —
      kävelyvauhdin luettavuus on koko väälain syy, ja se laki on siellä
- [x] `--rarity-common|uncommon|rare|legendary` + `.es-rarity` `tokens.css`issa (625/800)
- [x] `<Rarity>` ja `RARITY_COLOUR` `packages/ui`:ssä
- [x] **Värit mitattu, ei silmämääräisesti valittu.** Diablon oma rare-keltainen on
      20/441 päässä `tokens`-resurssista — ja rare-paljastus *maksaa* tokeneita, joten ne
      olisivat olleet vierekkäin samassa kortissa eri merkityksinä. Rare on siksi
      meripihka (76 clear), legendary kuuma oranssi (79 rarest)
- [x] Kontrastit `--bg`iä vasten: 5.96 · 6.34 · 8.60 · 6.50 — kaikki yli AA:n 4.5
- [x] `rarityPalette.test.ts` pitää eron voimassa: Diablon alkuperäinen keltainen
      kaataa sen viestillä *"rare (#ffd700) is too close to gold"*
- [x] Käytössä siellä missä aste jo on: `DiscoveryModal`in tier-rivi ja wonderin tähdet
      (jotka olivat aiemmin samaa kultaa kaikilla asteilla — viisi tähteä ja kaksi
      tähteä näyttivät samalta)
- [x] Väri ei kanna yksin (§14): aste on aina kirjoitettu sanaksi sen vieressä

## Mitä jäi — ja miksi

**Työt ja Riitit eivät saaneet astetta.** Niillä ei ole `Rarity`-kenttää datassa, joten
asteen antaminen niille on *sisältömuutos* (mikä saha on "rare"?), ei väritys. Se on oma
tikettinsä jos Infinite haluaa sen. Kanava on nyt pystyssä ja odottaa dataa.

## Alkuperäiset avoimet kysymykset

1. **Mikä saa asteen?** Löydöt (`revealOf`in neljä tieriä) on ilmeisin. Entä Työt?
   Riitit? Wonderit ovat jo omaa luokkaansa
2. **Miten tämä sopii väälakiin?** `claude.md` §13 ja Sigil §01 sanovat että **väri
   tarkoittaa resurssia** — kaikkialla. Harvinaisuusväri on toinen merkitys samalle
   kanavalle, ja kaksi lakia samasta kanavasta on juuri se tapa jolla kumpikin lakkaa
   olemasta laki. Ehkä harvinaisuus on **reunus tai tausta**, ei tekstin väri
3. **Kuinka monta astetta?** Löydöillä on neljä, Diablolla viisi tai kuusi

## Ei tässä

Mitään ennen kuin kysymys 2 on vastattu. Se ei ole makuasia: väälaki on ainoa syy miksi
tiheä ruutu on luettavissa kävelyvauhtia, ja tämä koskee sitä suoraan.
