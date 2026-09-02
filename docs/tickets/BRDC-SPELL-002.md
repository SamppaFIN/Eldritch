# BRDC-SPELL-002 — Scrying, ja loput koulukunnat

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SPELL-001, BRDC-MANA-001, BRDC-MAP-003, BRDC-KEEP-003 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 · `BRDC-SPELL-001` (valta/esto siirrettiin tänne) |

## 🔴 RED

`BRDC-SPELL-001` jätti tämän auki nimeltä mainiten: kotikoulukunnat (Insight, Bulwark)
tehtiin, **valta ja esto siirrettiin `BRDC-SPELL-002`:een**. Tiketti puuttui. Tässä se on.

Kentältä tuli sille sisältö: *"Loitsuja: Scrying, millä saa tietoon alueet."*

Scrying on täsmälleen se loitsu jota tämä peli tarvitsee ja jota sillä ei ole: sumu
(`BRDC-MAP-003`) tekee kartasta tuntemattoman, vartiotorni (`BRDC-BUILD-006`) avaa sitä
rakentamalla — ja manalle ei ole vieläkään mitään käyttöä, joka tuntuisi taialta.

## 🟢 GREEN

- [ ] **Scrying.** Maksaa manaa, paljastaa valitun alueen heksat ilman kävelyä — mutta
      **määräajaksi**, ei pysyvästi. Kävely ja vartiotorni paljastavat pysyvästi; taika
      näyttää ja unohtaa. Ero on koko pelin ydin, älä hukkaa sitä.
- [ ] Kantama ja kesto `constants.ts`:ään. Kantama kasvaa Consciousness-tason mukana.
- [ ] **Loput koulukunnat `BRDC-SPELL-001`:stä:** yksi vallan loitsu (vahvista omaa maata
      kauempaa) ja yksi eston (hidasta vastustajan rappiota vastaan tekemää työtä).
      Molemmat noudattavat samaa `ActiveSpell`-mallia kuin Insight ja Bulwark.
- [ ] Loitsut löytyvät Keepin **Rites-välilehdeltä** (`BRDC-KEEP-003`) — ei uutta paikkaa.
- [ ] Aktiivinen loitsu näkyy HUDissa jäljellä olevine aikoineen (malli on jo olemassa).
- [ ] Puhtaat funktiot + testit: scryn paljastus vanhenee · kantama kasvaa tasolla ·
      mana ei voi mennä negatiiviseksi · päällekkäinen scry ei kerrannaista kestoa.

## Ei tässä

- Vastustajaan kohdistuvat loitsut jaetussa maailmassa. Kaikki tämä ajetaan paikallisesti;
  moninpeli on Vaihe 5, ja Infinite rajasi sen: *"Kaikki backend ja multiplayer asiat
  tehdään sit, kun saadaan lokaali versio toimiin."*
- Loitsuefektien grafiikka (`BRDC-ART-001`, `BRDC-FX-001`).
