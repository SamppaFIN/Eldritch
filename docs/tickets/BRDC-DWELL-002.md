# BRDC-DWELL-002 — Dwell-kello hyppää refreshissä

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-DWELL-001, BRDC-PERSIST-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Koitin kukkulalla odotella että ruudusta tulisi temppeli, mutta jonkun
refreshin jälkeen 1.4 tuntia muuttuikin 6 minuutiksi."*

Pelaaja seisoi paikallaan tunnin ja neljäkymmentä minuuttia — juuri sen mitä
`BRDC-DWELL-001` pyytää — ja kello nollautui melkein alusta. Se on pahin mahdollinen
bugiluokka tässä pelissä: **se rankaisee juuri siitä tekemisestä, jota mekaniikka pyytää**,
ja se maksaa pelaajan oikeaa aikaa ulkona.

Dwell on kertynyttä *aikaa yhdessä solussa*. Jos se lasketaan sivun elinajasta eikä
tallennetusta leimasta, reload nollaa sen — ja kentällä sivu latautuu uudelleen usein
(Vigil pettää, selain tappaa välilehden, verkko vaihtuu).

## 🟢 GREEN

- [ ] **Toistava testi ensin.** Kirjoita testi, joka kerryttää dwelliä, simuloi reloadin
      (uusi repository samasta storesta) ja väittää että kertymä säilyy. Sen pitää olla
      punainen ennen korjausta.
- [ ] Dwell luetaan **tallennetusta leimasta**, ei muistinvaraisesta kellosta. Sama
      kuria kuin decayssa: aika on `now - lastX`, ei tikitystä.
- [ ] Selvitä ja kirjaa, **oliko 6 minuuttia** nollaus vai eri solu: GPS-häly voi siirtää
      seisovan pelaajan naapuriheksaan ja aloittaa dwellin alusta. Jos näin, dwell tarvitsee
      saman `CONSOLIDATE_RADIUS_M`-tyyppisen sietokyvyn kuin jäljen pisteet.
- [ ] HUD tai solupaneeli näyttää kertyneen dwellin **ennen** kynnystä, ei vasta sen
      jälkeen — seisova pelaaja ei saa joutua arvaamaan onko mitään tapahtumassa.
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä.

## Ei tässä

- Dwell-kynnysten säätö. Tämä korjaa kellon, ei numeroita.
- Taustaseuranta lukitussa puhelimessa — `BRDC-VIGIL-002`.
