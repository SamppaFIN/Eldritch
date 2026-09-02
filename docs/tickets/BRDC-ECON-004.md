# BRDC-ECON-004 — Resurssit näkyviin: määrä, tuntimuutos, ja Collect-nappi

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S–M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-ECON-003, BRDC-STATS-001, BRDC-KEEP-004 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"joka resurssin määrän ja tuntimuutoksen.. aika mikä on kulunut viimeisestä
keräämisestä ja napin millä voi kerätä resurssit."*

Pouch-luku on kolme lajia yhdellä rivillä, ilman tuottovauhtia solukohtaisesti.
`STATS-001`:n ennuste on erillinen rivi. Mikään ei kerro *milloin viimeksi katsoit* tai
anna sitä idle-pelin tyydytystä että napautat ja resurssit kilahtavat kassaan.

## Suunnittelupäätös — kaksi vaihtoehtoa, suositus alla

Nykyinen malli (`BRDC-ECON-001`): tuotto **tihkuu jatkuvasti**, `settleResources`
laskee sen lukuhetkellä, useammin kysyminen ei tuota enempää. Collect-nappi voi olla:

- **A (kosmeettinen, suositus):** nappi pakottaa `getResources`-luvun ja näyttää
  "+N sitten viime keräyksen" -välähdyksen. "Aika viime keräyksestä" = aika napin viime
  painalluksesta (`es3:last-collect`). Talous ei muutu — tihku on jo kirjattu — mutta
  passiivinen tuotto **tuntuu** aktiiviselta. Ei riskiä `ECON-001`:lle.
- **B (oikea kerää-mekaniikka):** tuotto kertyy erilliseen ämpäriin kunnes napautat.
  Tämä on eri talousmalli — kirjoittaa `settleResources`in uusiksi, muuttaa varastokaton
  merkityksen, ja rikkoo golden-fixture-vertailun Vaiheessa 5. **Ei ilman erillistä
  päätöstä.**

## 🟢 GREEN (vaihtoehto A)

- [ ] **Per-laji-rivi Keepin Resources-osiossa:** ikoni + nimi + määrä + `+N/h` (tuotto
      per tunti tälle lajille, `forecast.perHour[k]` — on jo olemassa). Vain lajit joilla
      on määrää tai tuottoa; nolla-nolla piilossa `+`-napin taakse (`BRDC-BUILD-005`:n
      malli).
- [ ] **"Last collected · 2 h ago"** -rivi, `relativeTime`illa (`features/log/describe.ts`,
      on jo).
- [ ] **Collect-nappi:** `getResources(now)` → `onPouch`; talteen `es3:last-collect = now`;
      "+N food · +M stone" -välähdys `PouchGain`in tyyliin (tai suoraan se komponentti).
      Yksi pling.
- [ ] Nappi on **disabloitu** jos edellisestä keräyksestä alle esim. 60 s — ei mitään
      kerättävää, ja estää nappispämmin.
- [ ] Testit: "aika viime keräyksestä" laskee `es3:last-collect`ista · Collect ei mintaa
      resursseja toistetusti (sama regressio kuin `resources.test.ts`:n polling-testi) ·
      per-laji-rivi näyttää oikean `/h`-luvun.

## Ei tässä

- Vaihtoehto B ilman erillistä hyväksyntää.
- Resurssien ikonit taidetyönä — pip riittää (`BRDC-ECON-003`:n `RESOURCE_COLOUR`).
- Footerin pouch-siru — se näyttää jo kaikki 9 (`BRDC-ECON-003`). Tämä on Keepin
  yksityiskohtaisempi näkymä.
