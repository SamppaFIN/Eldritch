# BRDC-CLAIM-010 — Lenkki takaisin opetettuna, ja löytöruudun rytmitys

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M |
| **Riippuvuudet** | BRDC-CLAIM-009 |
| **Status** | `done` — 2026-10-14 (v0.11.10) |
| **Valmius** | 0 % |
| **Lähde** | Infinite, suunnanmuutos 2026-09-02 (irrotettu CLAIM-009:stä) |

## 🔴 RED

`BRDC-CLAIM-009` teki askel-valtauksesta päätavan ja siirsi lenkin sulkemisen
asetuksen taakse (`Settings.loopClosure`, oletus `false`). Infinite: *"lenkki
palautetaan asetuksesta kun sitä ruvetaan opettamaan."* Nyt kytkin on olemassa mutta
kukaan ei löydä sitä eikä tiedä miksi lenkki on parempi.

Löytöruutu (`DiscoveryModal`) laukeaa joka kerta kun askel vallitsee heksan — ~25 m
välein. Se on tarkoituksella opastava pelin alussa mutta muuttuu esteeksi kun sitä on
nähnyt kymmenen kertaa.

## 🟢 GREEN

- [x] **Löytöruudun frekvenssi porrastuu.** Ensimmäiset N heksaa (esim. 5–8) näyttävät
      koko modaalin; sen jälkeen pelkkä pieni toast ("New ground · Old woodland"),
      joka ei pysäytä. Kynnys `constants.ts`:ään.
- [x] **Lenkin opetus.** Kun pelaajalla on jonkin verran aluetta (esim. ≥ 12 solua tai
      X päivää pelattu), peli ehdottaa lenkin kokeilua: lyhyt selitys ("kävele suljettu
      lenkki, omista sen sisään jäävä maa") + nappi joka kytkee `loopClosure` päälle.
      Kerran, ohitettavissa, ei palaa.
- [~] **Naapuriheksojen porrastettu paljastus.** Kun otat maan (askel tai lenkki),
      ympäröivät heksat "avautuvat" yksitellen kartalle (reuse `AwakeningLayer`n
      ripple). Tutoriaalikytkentä tähän myöhemmin.
- [x] Tutoriaalitekstit omaan moduuliinsa, ei siroteltuna komponentteihin.

## Ei tässä

- Täysi tutoriaalimoottori / onboarding-flow — oma tikettinsä jos tarve.
- Askel-valtauksen laajennus rivaalin heksoihin.

## Päätökset ja toteutus 2026-10-14

Infinite (kysely): lenkki **askelvaltauksen päälle**, opetus **Pitäjän kirjan askeleena**,
löytöruutu **6 täyttä, sitten ohut rivi**.

- **Lenkki askeleen päälle:** ennen lenkin kytkeminen *sammutti* askelvaltauksen
  (`useDiscovery`: `if (loopClosure) return`). Nyt molemmat ovat aina päällä: jokainen
  askel valtaa, ja suljettu lenkki valtaa lisäksi sisäpuolensa. `Settings.loopClosure` ja
  valikon kytkin poistettu. `useTerritory` lukee kartan uudelleen vain kun lenkki todella
  sulkeutui — ennen se luki kaikki solut jokaisen jälkierän jälkeen.
- **Opetus:** Kirjan luku III alkaa askeleella *Walk a closed loop around new ground*;
  `walkFlow` laskee maata ottaneet lenkit (`K.loopsClosed`), ja askel lukee sen tilasta.
  Palkinto täydentää Keepin nostoon puuttuvan.
- **Löytöruutu:** `NEW_GROUND_CARDS = 6` (`constants.ts`); sen jälkeen HUDin
  valtausrivi (`HudClaim`) kertoo valtauksen pysäyttämättä kävelyä.
- [~] Naapuriheksojen porrastettu paljastus: ei tehty — sumu avautuu jo valtauksen myötä;
  erillinen animaatio on oma pieni tikettinsä, jos sitä kaivataan.
- Opas (*Awakening*) kertoo lenkistä asetuksen sijaan.
