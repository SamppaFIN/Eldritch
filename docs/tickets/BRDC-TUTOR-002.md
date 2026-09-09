# BRDC-TUTOR-002 — Avaus on tikapuut, ja ne luetaan tilasta

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 1 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-CLAIM-013, BRDC-TECH-002 (ilman niitä ei ole mitä opettaa) |
| **Status** | `done` — 2026-09-09 (v0.5.52) |
| **Valmius** | 100 % avauksen osalta; `BRDC-TUTOR-001`in laajempi opetuskaari jatkuu erikseen |
| **Lähde** | Infinite 2026-09-09: *"Peli opastaa progressiivisesti: jokaisen toiminnon jälkeen näytetään vihje siitä, mitä seuraavaksi voi tehdä… Tarvitaan selkeä alkuohjeistus ja mielekäs päämäärä."* |

## 🔴 RED

**Pelin ensimmäinen lause opetti mekaniikkaa jota ei ollut päällä.**

`FirstLook` sanoi: *"Walk a closed loop. The ground inside it becomes yours."*
`BRDC-CLAIM-009` teki askeleesta ensisijaisen valtaustavan ja siirsi lenkinsulkemisen
`Settings.loopClosure`in taakse **oletuksena pois** — eikä tätä riviä päivitetty. Uusi
pelaaja sai ensimmäisenä ohjeena tehtävän jota peli ei tue.

Ja se **vaikeni heti**: `show={territory.owned.length === 0 && …}`, eli rivi katosi sillä
hetkellä kun Hearth perustettiin. Juuri silloin kun pelaajalla on ensimmäinen kysymyksensä,
peli lakkasi puhumasta. Sen jälkeen ei ollut mitään joka kertoisi mitä tehdä seuraavaksi,
mihin ollaan menossa, tai milloin avaus on ohi.

## 🟢 GREEN

- [x] **`steps.ts` — puhdas tikapuufunktio.** `nextStep({ owned, works, researched })`
      palauttaa yhden tekemisen ja yhden syyn, tai `null` kun avaus on ohi.
- [x] **Kynnykset luetaan tilasta, ei tapahtumista** (`BRDC-TUTOR-001`in oma
      toteutussääntö). "Kolmas heksa" on kysymys johon `owned.length` vastaa milloin
      tahansa; tapahtumalaskuri hukkaa tilanteen jossa kolme heksaa tuli yhdellä lenkillä
      tai jossa peli suljettiin kahden välissä.
- [x] **Neljä porrasta**, järjestyksessä joka opettaa silmukan nopeimmin:
      1. *Walk into the hex beside yours* — maa joka koskettaa omaasi tulee omaksesi, ja
         se maksaa heti (`CLAIM_YIELD`)
      2. *Open Here and raise your first Work* — Work tuottaa joka tunti, ei vain kerran
      3. *Open Research and spend your wisdom* — tutkimus nostaa kaikkea sitä maastoa
         jota omistat, pysyvästi (`BRDC-TECH-002`)
      4. *Keep walking — 10 hexes makes a realm* — bonus on per heksa, joten maa on se
         mikä tekee teknologioista arvokkaita
- [x] **Päämäärä on PIVOTin oma:** kymmenen heksaa, yksi Work, yksi teknologia. Sen
      jälkeen paneeli vaikenee lopullisesti.
- [x] Rivi **puhuu koko avauksen ajan**, ei vain ennen ensimmäistä valtausta.
- [x] Rivaali-ilmoitus (*"Someone already holds ground to the north-east"*) näytetään enää
      ensimmäisellä portaalla — myöhemmin se on kohinaa, ei ohje.
- [x] `first-look.css` mittaa nyt HUD:n **julkaistua korkeutta** (`--hud-height`)
      kovakoodatun `12.5rem`:n sijaan. Paneeli kasvaa ja kutistuu sen mukaan mitä sillä on
      sanottavaa, eikä 12,5 rem ollut oikein yhdessäkään niistä tiloista.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1037**) + `pnpm build` vihreä.
      `MapView.tsx` osui 401 riviin matkalla ja tiivistettiin takaisin 398:aan.
- [x] `steps.test.ts` +8, ja niistä kaksi ovat se syy miksi tila voittaa tapahtumat:
      *"skips the rungs a big lap jumped over"* (40 heksaa ja nolla Workia → `build`, ei
      onnittelu askeleesta jota kukaan ei nähnyt) ja *"still asks to walk while the ring is
      all there is, however it was reached"*.
- [x] Yksi testi vartioi **copyn muotoa**: yksi lause tekemiseksi, alle 90 merkkiä syyksi.
      Se on ulkopeli, luettuna kävellessä.
- [x] e2e mobile-360: `trail-detail` (HUD-budjetti) ja `standards` (a11y) vihreät sen
      jälkeen kun paneeli alkoi näkyä useammassa tilassa.
- [ ] Kenttä: uusi peli → rivi kertoo mitä tehdä joka portaalla, ja vaikenee kympin
      kohdalla. *(Infinite ajaa.)*

## Ei tässä

- **`BRDC-TUTOR-001`in koko kaari** — temppelit, kaupunkivaltiot, saartaminen, loitsut,
  pyhä geometria avautumisen hetkenä, palkinto kokeilusta, wiki-linkitys. Tämä tiketti
  kattaa **avauksen**: ensimmäiset kymmenen heksaa. TUTOR-001 jatkaa siitä.
- Vihjeen näyttäminen *tapahtumana* (välähdys, ääni) kun porras vaihtuu. Nyt se vaihtuu
  hiljaa; onko se liian huomaamaton, on kenttäkysymys.
- Ohitusmahdollisuus ja paluu wikin kautta — TUTOR-001.
