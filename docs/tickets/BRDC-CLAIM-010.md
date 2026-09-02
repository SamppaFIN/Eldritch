# BRDC-CLAIM-010 — Lenkki takaisin opetettuna, ja löytöruudun rytmitys

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M |
| **Riippuvuudet** | BRDC-CLAIM-009 |
| **Status** | `todo` |
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

- [ ] **Löytöruudun frekvenssi porrastuu.** Ensimmäiset N heksaa (esim. 5–8) näyttävät
      koko modaalin; sen jälkeen pelkkä pieni toast ("New ground · Old woodland"),
      joka ei pysäytä. Kynnys `constants.ts`:ään.
- [ ] **Lenkin opetus.** Kun pelaajalla on jonkin verran aluetta (esim. ≥ 12 solua tai
      X päivää pelattu), peli ehdottaa lenkin kokeilua: lyhyt selitys ("kävele suljettu
      lenkki, omista sen sisään jäävä maa") + nappi joka kytkee `loopClosure` päälle.
      Kerran, ohitettavissa, ei palaa.
- [ ] **Naapuriheksojen porrastettu paljastus.** Kun otat maan (askel tai lenkki),
      ympäröivät heksat "avautuvat" yksitellen kartalle (reuse `AwakeningLayer`n
      ripple). Tutoriaalikytkentä tähän myöhemmin.
- [ ] Tutoriaalitekstit omaan moduuliinsa, ei siroteltuna komponentteihin.

## Ei tässä

- Täysi tutoriaalimoottori / onboarding-flow — oma tikettinsä jos tarve.
- Askel-valtauksen laajennus rivaalin heksoihin.
